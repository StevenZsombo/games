const { app, BrowserWindow } = require("electron")
function createWindow() {
    const win = new BrowserWindow({
        title: "test game",
        width: 1080,
        height: 1920,
        icon: "favicon.ico",
    })
    win.loadFile("template.html")
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
    app.quit()
})

app.on("active", () => {
    if (BrowserWindow.getAllWindows() === 0) {
        createWindow()
    }
})