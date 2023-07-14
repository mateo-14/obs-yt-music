package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
)

type Song struct {
	Title       string  `json:"title"`
	IsPlaying   bool    `json:"isPlaying"`
	Duration    float32 `json:"duration"`
	CurrentTime float32 `json:"currentTime"`
	Author      string  `json:"author"`
	Img         string  `json:"img"`
}

func main() {
	port := flag.Int("port", 8080, "port to listen on")
	flag.Parse()

	channels := make(map[string]chan Song)

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			song := Song{}
			decoder := json.NewDecoder(r.Body)
			err := decoder.Decode(&song)
			if err != nil {
				fmt.Println(err.Error())
				http.Error(w, "Bad request", http.StatusBadRequest)
				return
			}

			for _, ch := range channels {
				ch <- song
			}

			w.Write([]byte("OK"))
			return
		}

		if r.Method == http.MethodGet {
			http.ServeFile(w, r, "overlay/index.html")
			return
		}

		fmt.Fprint(w, "Method not allowed")
	})

	http.Handle("/public/", http.StripPrefix("/public/", http.FileServer(http.Dir("overlay/public"))))

	http.HandleFunc("/sse", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		f, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
			return
		}

		ch := make(chan Song)
		channels[r.RemoteAddr] = ch

		go func() {
			<-r.Context().Done()
			delete(channels, r.RemoteAddr)
		}()

		for {
			song := <-ch
			json, err := json.Marshal(song)
			if err != nil {
				fmt.Println(err.Error())
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}

			fmt.Fprintf(w, "data: %s\n\n", json)
			f.Flush()
		}

	})

	addr := fmt.Sprintf("127.0.0.1:%d", *port)
	fmt.Printf("Listening on http://%s\n", addr)
	http.ListenAndServe(addr, nil)
}
