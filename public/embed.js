// HeHo Chatbot Embed Script
// Usage: HeHoChatbot.embed('https://your-deploy-url', 'container-id');

;(() => {
  var HeHoChatbot = (window.HeHoChatbot = window.HeHoChatbot || {})

  HeHoChatbot.embed = (deployUrl, containerId) => {
    const container = document.getElementById(containerId)
    if (!container) {
      console.error(`[HeHo] Container with id "${containerId}" not found`)
      return
    }

    // Create iframe
    const iframe = document.createElement("iframe")
    iframe.src = deployUrl
    iframe.style.width = "100%"
    iframe.style.height = "100%"
    iframe.style.border = "none"
    iframe.style.borderRadius = "8px"
    iframe.setAttribute("allow", "microphone; camera")

    // Clear container and add iframe
    container.innerHTML = ""
    container.appendChild(iframe)

    console.log("[HeHo] Chatbot embedded successfully")
  }

  // Auto-embed if data-heho-embed attribute is found
  document.addEventListener("DOMContentLoaded", () => {
    const autoEmbeds = document.querySelectorAll("[data-heho-embed]")
    autoEmbeds.forEach((element) => {
      const url = element.getAttribute("data-heho-url")
      if (url) {
        const containerId = element.id || `heho-${Math.random().toString(36).substr(2, 9)}`
        element.id = containerId
        HeHoChatbot.embed(url, containerId)
      }
    })
  })
})()
