var canvas = document.getElementById("canvas")
var ctx = canvas.getContext("2d")
var game

let player = {
    x: 250,
    y: 450,
    alive: true
}
let frames = 0

const enemyImage = new Image()
enemyImage.src = "enemy.png"

const draw = function () {

    if (player.alive) {
        ctx.fillStyle = "blue"
        ctx.fillRect(player.x, 450, 20, 20)
    }

    for (const bullet of bullets) {
        ctx.fillStyle = "gray"
        ctx.fillRect(bullet.x, bullet.y, 10, 10)

    }
    for (const enemy of enemies) {
        ctx.fillStyle = "red"
        // ctx.fillRect(enemy.x, enemy.y, 20, 20)
        ctx.drawImage(enemyImage, enemy.x, enemy.y)
    }
}

let enemyCooldown = Date.now()
const logic = function () {

    if (keys["a"]) player.x -= 1
    if (keys["d"]) player.x += 1
    if (keys[" "]) shoot()

    for (const bullet of bullets) {
        bullet.y -= bullet.velocity
        if (collide(player, bullet)) {
            player.alive = false
        }

    }
    for (const enemy of enemies) {
        enemy.move()
        for (let bullet of bullets) {
            if (collide(enemy, bullet)) {
                enemy.willDie = true
                bullet.willGetDestroyed = true
            }
        }
    }

    enemies = enemies.filter(x => !x.willDie)
    bullets = bullets.filter(x => !x.willGetDestroyed)
    if (Date.now() - enemyCooldown > 500) {
        let thoseWhoCanShoot = enemies.filter(canThisEnemyShoot)
        if (thoseWhoCanShoot.length > 0) {
            let theEnemyWhoWillShoot = thoseWhoCanShoot[Math.floor(Math.random() * thoseWhoCanShoot.length)]
            enemyShoot(theEnemyWhoWillShoot)
        }
        enemyCooldown = Date.now()
    }


}


let canThisEnemyShoot = function (enemy) {
    return enemies.filter(e =>
        (e.x > enemy.x - 100) && (e.x < enemy.x + 100) && (e.y > enemy.y + 20) && (e.y < enemy.y + 120)
    ).length == 0

}

const input = function () {

}

const gameloop = function () {
    ctx.fillStyle = "lightblue"
    ctx.fillRect(0, 0, 500, 500)
    frames += 1
    input()
    logic()
    draw()

    requestAnimationFrame(gameloop)
}

let cooldown = 0
const shoot = function () {
    if (Date.now() - cooldown > 600) {
        bullets.push(new Bullet())
        cooldown = Date.now()
    }
}

let enemyShoot = function (enemy) {
    let b = new Bullet()
    b.x = enemy.x
    b.y = enemy.y + 20
    b.velocity = -b.velocity
    bullets.push(b)
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
        this.velocity = +0.5
    }

    move() {
        if (frames % 60 == 0) this.velocity *= -1
        this.x += this.velocity
    }

}
let enemies = []

class Bullet {
    x = player.x
    y = 430
    velocity = 2
}
let bullets = []

const collide = function (enemy, bullet, bulletSize = 10) {
    const notCollide = (bullet.x + bulletSize < enemy.x) || (bullet.x > enemy.x + 20) || (bullet.y + bulletSize < enemy.y) || (bullet.y > enemy.y + 20)
    return !notCollide
}

start()