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



const chat = new Chat()
chat.spam("time")

let enemies = []
let bullets = []
let lives = 5
let score = 0
let currentWave = 0
chat.eggs("bc", ([e, b, l, s, c]) => {
    enemies = e.map(([x, y, radius, color, id]) => ({ x, y, radius, color, id }))
    bullets = b.map(([x, y]) => ({ x, y, color: "black", radius: 3 }))
    lives = l
    score = s
    currentWave = c
})
chat.eggs("gameOver", () => gameOver())
chat.on_disconnect = () => lives = score = currentWave = "DISCONNECTED"


const player = {
    x: 250,
    y: 250,
    radius: 15,
    color: "blue",
    vx: 0,
    vy: 0
}


const draw = (obj) => {
    if (obj.id == chat.nameID) return
    ctx.beginPath()
    ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI)
    ctx.strokeStyle = "black"
    ctx.stroke()
    ctx.fillStyle = obj.color
    ctx.fill()
}

const move = (obj, dt) => {
    obj.x += obj.vx * dt
    obj.y += obj.vy * dt
    if (obj.on_move) { obj.on_move(dt) }
}



const graphics = () => {
    ctx.fillStyle = "lightgray"
    ctx.fillRect(0, 0, 500, 500)
    draw(player)
    enemies.forEach(draw)
    bullets.forEach(draw)
    ctx.fillStyle = "black"
    ctx.font = "24px Times"
    ctx.fillText("Lives: " + lives + " Score: " + score + " Wave: " + currentWave, 0, 24)
    ctx.fillText("Vectors demo game for G10S-class (Mr. Steven)", 0, 490)
}


const logic = (dt) => {
    inputs()
    setSpeed(player, 200)
    move(player, dt)
    stopOnBounds(player)

    chat.spam("me", [player.x, player.y])

    reload()

}


const inputs = () => {
    if (heldKeys.a && !heldKeys.d) { player.vx = -1 }
    else if (heldKeys.d && !heldKeys.a) { player.vx = 1 }
    else { player.vx = 0 }
    if (heldKeys.w && !heldKeys.s) { player.vy = -1 }
    else if (heldKeys.s && !heldKeys.w) { player.vy = 1 }
    else { player.vy = 0 }
    if (mouseHeld) { shoot() }
    if (heldKeys[" "]) { shotgun() }
}


const createBullet = () => {
    const bullet = {
        x: player.x,
        y: player.y,
        vx: mouseX - player.x,
        vy: mouseY - player.y
    }
    setSpeed(bullet, 400)
    chat.spam("b", bullet)
    return bullet
}
let lastFiredWhen = 0
let ammo = 4
const shoot = () => {
    if (now() - lastFiredWhen < 50) { return }
    if (ammo <= 0) { return }
    lastFiredWhen = now()
    ammo -= 1
    createBullet()
}
const reload = () => {
    if (now() - lastFiredWhen >= 300) {
        ammo = 4
    }
}
let lastShotgunWhen = 0
const shotgun = () => {
    if (now() - lastShotgunWhen < 2000) { return }
    lastShotgunWhen = now()
    chat.spam("s", [player.x, player.y, mouseX, mouseY])
}

const getSpeed = (obj) => {
    return Math.hypot(obj.vx, obj.vy)
}
const setSpeed = (obj, targetSpeed) => {
    if (!obj.vx && !obj.vy) return
    const currentSpeed = getSpeed(obj)
    obj.vx /= currentSpeed
    obj.vx *= targetSpeed
    obj.vy /= currentSpeed
    obj.vy *= targetSpeed
}

const stopOnBounds = (obj) => {
    if (obj.x < 0) { obj.x = 0 }
    if (obj.x > 500) { obj.x = 500 }
    if (obj.y < 0) { obj.y = 0 }
    if (obj.y > 500) { obj.y = 500 }
}




const now = () => { return performance.now() }
let lastGameloopWhen = now()
let gameIsRunning = true
//gameloop
const gameloop = () => {
    if (!gameIsRunning) return gameOver()
    const dt = (now() - lastGameloopWhen) / 1000
    lastGameloopWhen = now()
    logic(dt)
    graphics()

    requestAnimationFrame(gameloop)
}
const gameOver = () => {
    gameIsRunning = false
    ctx.fillStyle = "white"
    ctx.fillText("Game over. Score: " + score + " Wave: " + currentWave, 200, 250)
}
gameloop()
