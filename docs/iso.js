class Molecule extends Clickable {
    constructor(options = {}) {
        const defaults = {
            color: "blue",
            velX: 1.2,
            velY: 2.1,
            unresolved: false,
            randVelMax: 5,
            mass: 100,
            txt: null
        }
        super()
        Object.assign(this, { ...defaults, ...options })
        this.height = this.width
        //oddities: radius is width, x,y refer to center instead
    }

    draw(screen) {
        MM.drawCircle(screen, this.x, this.y, this.width, {
            color: this.color
        })
        if (this.txt) {
            MM.drawTextSingleDepr(screen, this.txt, this.x, this.y, { font: "24px times", color: "black" })
        }

    }

    collidepoint(x, y) {
        return MM.dist(this.x, this.y, x, y) < this.width
    }
    collidecirc(particle) {
        if (Math.abs(this.x - particle.x) > (this.width + particle.width) || Math.abs(this.y - particle.y) > (this.width + particle.width)) {
            return false
        }
        return MM.dist(this.x, this.y, particle.x, particle.y) < this.width + particle.width
    }

    randVel() {
        this.velX = Math.random() * this.randVelMax
        this.velY = Math.random() * this.randVelMax
    }

    get center() { return { x: this.x, y: this.y } }
    set mag(val) {
        let currmag = this.mag
        currmag = currmag == 0 ? 0.0001 : currmag
        const factor = val / currmag
        this.velX *= factor
        this.velY *= factor
    }

    get mag() {
        return Math.hypot(this.velX, this.velY)
    }

    set size(x) {
        this.width = x
        this.recomputeMass()
    }

    get size() {
        return this.width
    }

    get height() { return this.width }
    set height(x) { this.width = x }

    recomputeMass() {
        this.mass = Math.pow(this.width, 3)
    }


    static collidePhysics(p1, p2) {
        if (p1 === p2) { return }
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const dist = Math.hypot(dx, dy)
        const minDist = p1.radius + p2.radius
        if (dist < minDist) {
            // Separate particles to prevent sticking
            const correction = (minDist - dist) / 2
            const correctionX = (dx / dist) * correction
            const correctionY = (dy / dist) * correction

            p1.x -= correctionX
            p1.y -= correction;
            p2.x += correctionX
            p2.y += correctionY
        }
        const nx = dx / dist
        const ny = dy / dist

        const v1n = p1.velX * nx + p1.velY * ny
        const v2n = p2.velX * nx + p2.velY * ny

        const v1t = p1.velX * ny - p1.velY * nx
        const v2t = p2.velX * ny - p2.velY * nx

        const m1 = p1.mass
        const m2 = p2.mass
        const newV1n = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2)
        const newV2n = (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2)


        p1.velX = newV1n * nx + v1t * ny
        p1.velY = newV1n * ny - v1t * nx
        p2.velX = newV2n * nx + v2t * ny
        p2.velY = newV2n * ny - v2t * nx
    }

    forceWithinRect(rect) {
        const bound = rect.copy.deflate(this.width * 2, this.width * 2).boundWithinInfo(this.x, this.y)
        if (bound.leftOut || bound.rightOut) {
            this.velX *= -1
        }
        if (bound.topOut || bound.bottomOut) {
            this.velY *= -1
        }
        [this.x, this.y] = [bound.x, bound.y]
        return this
    }

    get boundingRect() {
        return new Rect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2)
    }



}


class Cube extends Clickable {
    constructor(x, y, z, grid, { color = "lightgray", outline_color = "black", outline = 3 } = {}) {
        super()
        this.x = x
        this.y = y
        this.z = z
        this.color = color
        this.outline_color = outline_color
        this.outline = outline
        this.grid = grid
    }



    /**@param {RenderingContext}[screen] */
    draw(screen) {
        const [x, y] = this.grid.corner(this.x, this.y, this.z)
        const { size } = this.grid
        screen.strokeStyle = this.outline_color
        screen.lineWidth = this.outline
        screen.fillStyle = this.color
        screen.beginPath()
        screen.moveTo(x, y)
        screen.lineTo(x + size, y + size / 2)
        screen.lineTo(x, y + size)
        screen.lineTo(x - size, y + size / 2)
        screen.closePath()
        screen.stroke()
        screen.fill()
        screen.beginPath()
        screen.moveTo(x - size, y + size / 2)
        screen.lineTo(x - size, y + size * 3 / 2)
        screen.lineTo(x, y + size * 2)
        screen.lineTo(x + size, y + size * 3 / 2)
        screen.lineTo(x + size, y + size / 2)
        screen.lineTo(x, y + size)
        screen.closePath()
        screen.stroke()
        screen.fill()
        screen.moveTo(x, y + size)
        screen.lineTo(x, y + size * 2)
        screen.stroke()
    }

    collidepoint() {
        return true
    }

}
class CubeGrid {


    constructor(rows, cols) {
        this.cubes = Array(cols).fill().map((_, j) => Array(rows).fill().map((_, i) => new Cube(i, j, 0, this)))
        this.rows = rows
        this.cols = cols
        this.offsetX = 600
        this.offsetY = 30
        this.offsetZ = 0//to be implemented
        this.size = 100

    }

    corner(x, y, z) {
        const { offsetX, offsetY, offsetZ, size } = this
        const corner = [offsetX + (x - y) * size, offsetY + (y / 2 + x / 2 - z) * size]
        return corner
    }

    /**@param {RenderingContext}[screen] */
    draw(screen) {
        for (const row of this.cubes) {
            for (const cube of row) {
                cube.draw(screen)
            }
        }
    }



    findGridElement(x, y) {
        const { offsetX, offsetY, size } = this
        const [nx, ny] = [x - offsetX, y - offsetY]
        let [rx, ry] = [nx / 2 + ny, -nx / 2 + ny]
        const i = Math.floor(rx / size)
        const j = Math.floor(ry / size)
        return [i, j]
    }

    check(x, y, clicked, released, held, wheel) {
        const [i, j] = this.findGridElement(x, y)
        if (0 <= i && i < this.rows && 0 <= j && j < this.cols) {
            this.cubes[j][i].check(x, y, clicked, released, held, wheel)
        }
    }
}