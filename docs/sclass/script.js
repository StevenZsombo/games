///@ts-nocheck
const canvas = document.getElementById("canvas")
/**@type {RenderingContext} */
const ctx = canvas.getContext("2d")


canvas.onclick = /** @param {MouseEvent} e */ (e) => {

}
canvas.onmousemove = /** @param {MouseEvent} e */ (e) => {

}

const heldKeys = {}
document.onkeydown = /** @param {KeyboardEvent} e */ (e) => { heldKeys[e.key] = true }
document.onkeyup = /** @param {KeyboardEvent} e */ (e) => { heldKeys[e.key] = false }

//gameloop
const gameloop = () => {

    requestAnimationFrame(gameloop)
}
gameloop()