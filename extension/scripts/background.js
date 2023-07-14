const OFF_COLOR = "#737373"
const ON_COLOR = "#2cb03f"

let watchingTabId = null

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeTextColor({
    color: "#fff"
  })

  setOffAction()
})

chrome.action.onClicked.addListener((tab) => {
  const url = new URL(tab.url)
  if (!watchingTabId && url.hostname === 'music.youtube.com') {
    watchingTabId = tab.id

    chrome.action.setBadgeText({
      text: "ON",
    })

    chrome.action.setBadgeBackgroundColor(
      { color: ON_COLOR }
    )

    chrome.action.setTitle(
      {
        title: "Watching another tab",
      } 
    )

    chrome.action.setTitle(
      {
        title: "Click to stop watching",
        tabId: tab.id
      }    
    )

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["scripts/content.js"]
    })

    return
  }

  if (watchingTabId === tab.id) {
    watchingTabId = null
    setOffAction(tab.id)
  }
})

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === watchingTabId) {
    watchingTabId = null
    setOffAction(tabId)
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId === watchingTabId && changeInfo.url && changeInfo.status === 'loading') {
    const url = new URL(changeInfo.url)
    if (url.hostname === 'music.youtube.com') return

    watchingTabId = null
    setOffAction(tabId)
  }
})

function setOffAction(tabId) {
  chrome.action.setBadgeText({
    text: "OFF",
  })

  chrome.action.setBadgeBackgroundColor(
    { color: OFF_COLOR }
  )

  chrome.action.setTitle(
    {
      title: "Click to watch",
    }    
  )

  if (tabId) {
    chrome.tabs.sendMessage(tabId, { type: 'stop' })
  }
}