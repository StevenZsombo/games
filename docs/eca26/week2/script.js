var canvas = document.getElementById("canvas")
var ctx = canvas.getContext("2d")
var game

let i = 250
let frames = 0

const draw = function () {
    ctx.fillRect(i, 450, 25, 25)
    for (const bullet of bullets) {
        ctx.fillRect(bullet.x, bullet.y, 10, 10)
    }
    for (const enemy of enemies) {
        ctx.fillRect(enemy.x, enemy.y, 30, 30)
    }
}

const logic = function () {

    if (keys["a"]) i -= 1
    if (keys["d"]) i += 1
    if (keys[" "]) shoot()

    for (const bullet of bullets) {
        bullet.y -= 1
    }
    for (const enemy of enemies) {
        enemy.move()
    }
}

const input = function () {

}

const gameloop = function () {
    ctx.clearRect(0, 0, 500, 500)
    frames += 1
    input()
    logic()
    draw()

    requestAnimationFrame(gameloop)
}

const shoot = function () {
    bullets.push(new Bullet())
}
var keys = {}
const start = function () {

    document.addEventListener("keydown", (e) => {
        keys[e.key] = true
    })
    document.addEventListener("keyup", (e) => {
        keys[e.key] = false
    })

    for (let i = 0; i < 8; i++) {
        enemies.push(new Enemy(50 + (500 - 50 * 2) / 8 * i, 50))
        enemies.push(new Enemy(50 + (500 - 50 * 2) / 8 * i, 100))
        enemies.push(new Enemy(50 + (500 - 50 * 2) / 8 * i, 150))
    }

    gameloop()
}

class Enemy {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.velocity = +1
    }

    move() {
        if (frames % 60 == 0) this.velocity *= -1
        this.x += this.velocity
    }
}
const enemies = []

class Bullet {
    x = i
    y = 450
}
const bullets = []

start()