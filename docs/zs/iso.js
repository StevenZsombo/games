class Cube extends Clickable {
    constructor(x, y, z, grid, {
        color = "darkgray", side_color = "lightgray", outline_color = "black", outline = 1
    } = {}) {
        super()
        this.x = x
        this.y = y
        this.z = z// to be implemented
        this.color = color
        this.side_color = side_color
        this.outline_color = outline_color
        this.outline = outline
        /**@type {CubeGrid}*/
        this.grid = grid
        this.visible = true
    }


    /**@param {RenderingContext} screen */
    draw(screen) {
        if (!this.visible) return
        const [x, y] = this.grid.topCorner(this.x, this.y, this.z)
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
        screen.fillStyle = this.side_color
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

    collidepoint(x, y) {//takes in its own position
        return this.x == x && this.y == y
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
        this.floorColor = null // "darkgray"

    }

    topCorner(x, y, z) {
        const { offsetX, offsetY, offsetZ, size } = this
        const corner = [offsetX + (x - y) * size, offsetY + (y / 2 + x / 2 - z) * size]
        return corner
    }

    /**@param {RenderingContext}[screen] */
    draw(screen) {
        screen.beginPath()
        screen.lineWidth = 0
        screen.moveTo(...this.topCorner(0, 0, -1))
        screen.lineTo(...this.topCorner(this.rows, 0, -1))
        screen.lineTo(...this.topCorner(this.rows, this.cols, -1))
        screen.lineTo(...this.topCorner(0, this.cols, -1))
        screen.closePath()
        screen.fillStyle = this.floorColor
        screen.fill()
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
        const [u, w] = this.findGridElement(x, y)
        for (let i = 0; i < this.cols; i++) for (let j = 0; j < this.rows; j++)
            this.cubes[i][j].check(u, w, clicked, released, held, wheel)

    }

}