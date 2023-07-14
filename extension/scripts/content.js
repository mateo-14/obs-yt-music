(() => {
  if (window.setUpdatedDataTimeout) {
    clearTimeout(window.setUpdatedDataTimeout)
    window.setUpdatedDataTimeout = null
  }

  let video, player, musicTitle, albumImg, progressBar;
  function getElements() {
    const video = document.querySelector('video.video-stream.html5-main-video')
    const player = document.querySelector('ytmusic-player-bar')
    const musicTitle = player.querySelector('.middle-controls .title')
    const albumImg = player.querySelector('.thumbnail-image-wrapper img')
    const progressBar = document.querySelector('#progress-bar')

    return {
      video,
      player,
      musicTitle,
      albumImg,
      progressBar
    }
  }

  function getMusicInfo() {
    if (!video || !player || !musicTitle || !albumImg || !progressBar) {
      const elements = getElements()
      video = elements.video
      player = elements.player
      musicTitle = elements.musicTitle
      albumImg = elements.albumImg
      progressBar = elements.progressBar
    }

    const isPlaying = !video?.paused
    const duration = parseInt(progressBar?.getAttribute('aria-valuemax'))
    const currentTime = parseInt(progressBar?.getAttribute('aria-valuenow'))
    const title = musicTitle?.getAttribute('title')
    const infoTextContainer = player?.querySelector('.subtitle yt-formatted-string')
    const author = infoTextContainer?.firstChild?.textContent ?? ''
    const img = albumImg?.getAttribute('src')

    return { isPlaying, title, duration, currentTime, img, author }
  }

  function sendData({ isPlaying, title, duration, currentTime, img, author }) {
    return fetch('http://localhost:8080', {
      method: 'POST',
      body: JSON.stringify({ isPlaying, title, duration, currentTime, img, author }),
      mode: 'no-cors',
    })
  }

  async function sendUpdatedData() {
    const { isPlaying, title, duration, currentTime, img, author } = getMusicInfo()

    try {
      if (title && img && author && !isNaN(duration))
        await sendData({ isPlaying, title, duration, currentTime, img, author })

    } catch {

    } finally {
      window.sendUpdatedDataTimeout = setTimeout(sendUpdatedData, 1000)
    }
  }

  sendUpdatedData();

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'stop') {
      clearTimeout(window.sendUpdatedDataTimeout)
      window.sendUpdatedDataTimeout = null
    }
  });
})()