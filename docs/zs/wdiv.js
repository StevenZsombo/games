const wDiv = (() => {
    const div = document.createElement("div")
    div.style.position = "fixed"
    div.style.width = "80vw"
    div.style.top = "50%"
    div.style.left = "50%"
    div.style.transform = "translate(-50%, -50%)"
    div.style.zIndex = "99999"
    div.style.pointerEvents = "none"
    // div.style.userSelect = "none"
    div.style.fontFamily = "monospace" //instead of myMonospace (no load time)
    div.style.fontSize = "18px"
    div.style.color = "white"
    div.style.backgroundColor = "midnightblue"
    div.style.padding = "10px"
    div.style.borderRadius = "5px"
    div.style.whiteSpace = "pre-wrap"
    div.style.textAlign = "left"
    document.body.appendChild(div)
    // div.onclick = () => api.hide()

    let stored = ""
    const api = {
        div: div,
        add(txt) { div.textContent += (!div.textContent || div.textContent.endsWith("\n") ? "" : " ") + txt },
        addLine(txt) { div.textContent += "\n" + txt },
        clear() { div.textContent = "" },
        save() { stored = div.textContent },
        load() { div.textContent = stored },
        timePassed() { return (performance.now() / 1000).toFixed(2) },
        remove() { div.remove() },
        show() { div.style.display = "" },
        hide() { div.style.display = "none" },
        toggle() { div.style.display == "" ? div.style.display = "none" : div.style.display = "" },
        error(txt) { api.show(); div.style.backgroundColor = "red", api.addLine(txt) },
        autoShowErrorsSetup() {
            window.onerror = (event, source, lineno, colno, error) => {
                if (!location.hash.includes("noerror"))
                    this.error(`ERROR: ${event}, source: ${source}, lineno: ${lineno}, colno: ${colno}, error: ${error}`)
            }
            window.onunhandledrejection = (event) => {
                if (!location.hash.includes("noerror"))
                    this.error("UNHANDLED: " + (event.reason?.stack || event.reason))
            }
        }
    }
    api.add("Hi! Please wait patiently for the game to load.\n")
    api.autoShowErrorsSetup()
    api.hide()
    return api
})()