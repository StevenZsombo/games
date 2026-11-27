//#region canvas setup
const canvas = document.getElementById("canvas")
/**@type {RenderingContext} */
const ctx = canvas.getContext("2d")
//#endregion
//#region input management
let mouseX, mouseY, mouseHeld
canvas.onmousedown = /** @param {MouseEvent} e */ (e) => {
    mouseHeld = true
    mouseX = e.offsetX
    mouseY = e.offsetY
    e.preventDefault()
}
canvas.onmousemove = /** @param {MouseEvent} e */ (e) => {
    mouseX = e.offsetX
    mouseY = e.offsetY
}
window.onmouseup = /** @param {MouseEvent} e */ (e) => {
    mouseHeld = false
}
const heldKeys = {}
window.onkeydown = /** @param {KeyboardEvent} e */ (e) => {
    heldKeys[e.key] = true
    if (!e.ctrlKey) { e.preventDefault() }
}
window.onkeyup = /** @param {KeyboardEvent} e */ (e) => {
    heldKeys[e.key] = false
    if (!e.ctrlKey) { e.preventDefault() }
}
//#endregion


//gameloop
const gameloop = () => {
    requestAnimationFrame(gameloop)
}
gameloop()