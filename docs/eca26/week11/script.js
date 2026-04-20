///@ts-nocheck
var canvas = document.getElementById("canvas")
/**@type {RenderingContext} */
var ctx = canvas.getContext("2d")
var game

let width = canvas.width
let height = canvas.height

let cells = 8
let grid = Array(cells).fill().map(x => Array(cells).fill(" "))

let draw = function () {
    //background
    ctx.fillStyle = "lightsalmon"
    ctx.fillRect(0, 0, width, height)
    //gridlines

    ctx.strokeStyle = "black"
    for (let i = 1; i < grid.length; i++) {
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.moveTo(i / grid.length * width, 0)
        ctx.lineTo(i / grid.length * width, height)
        ctx.stroke()
        ctx.moveTo(0, i / grid[0].length * height)
        ctx.lineTo(width, i / grid[0].length * height)
        ctx.stroke()
    }
    //x and o

}

let update = function () {
}






canvas.onclick = e => {
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)
    console.log(x, y)
}



//gameloop
let gameloop = () => {
    draw()
    update()
    requestAnimationFrame(gameloop)
}
gameloop()