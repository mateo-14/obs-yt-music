const title = document.querySelector('.music-player__title')
const author = document.querySelector('.music-player__author')
const img = document.querySelector('.music-player__img')
const duration = document.querySelector('.music-player__time--duration')
const currentTime = document.querySelector('.music-player__time--current')
const progressBar = document.querySelector('.music-player__progress-bar--filled')

const eventSource = new EventSource('http://localhost:8080/sse');

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data)
  if (data.title) {
    title.textContent = data.title
    author.textContent = data.author
    img.src = data.img
    img.classList.remove('hidden')

    const minutes = Math.floor(data.duration / 60)
    const seconds = Math.floor(data.duration) % 60
    duration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
    updateProgress(data.currentTime, data.duration)
  }
})

function updateProgress(time, duration) {
  const currentMinutes = Math.floor(time / 60)
  const currentSeconds = Math.floor(time) % 60
  currentTime.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`
  progressBar.style.width = `${(time / duration) * 100}%`
}