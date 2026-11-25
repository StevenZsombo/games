///@ts-nocheck
const canvas = document.getElementById("canvas")
/**@type {RenderingContext} */
const ctx = canvas.getContext("2d")
const { width, height } = canvas

const graphics = () => {
    //background
    ctx.fillStyle = "lightsalmon"
    ctx.fillRect(0, 0, width, height)
    //gridlines


}

const circle = ({ x, y, radius, color } = {}) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fill()
}

const dots = new Set()
const drawables = [dots]

canvas.onclick = /** @param {MouseEvent} e */ (e) => {
    const x = e.offsetX
    const y = e.offsetY
    dots.add({ x, y, radius: 10, color: "pink" })
}
canvas.onmousemove = /** @param {MouseEvent} e */ (e) => {


}

const heldKeys = {}
document.onkeydown = /** @param {KeyboardEvent} e */ (e) => {
    heldKeys[e.key] = true
}
document.onkeyup = /** @param {KeyboardEvent} e */ (e) => {
    heldKeys[e.key] = false
}

//gameloop
const gameloop = () => {
    drawables.forEach(x => x.forEach(y => circle(y)))
    requestAnimationFrame(gameloop)
}
gameloop()