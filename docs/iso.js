class Cube {
    constructor(x, y, z, grid, { color = "lightgray", outline_color = "black", outline = 3 } = {}) {
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

}
class CubeGrid {


    constructor(rows, cols) {
        this.cubes = Array(cols).fill().map((_, j) => Array(rows).fill().map((_, i) => new Cube(i, j, 0, this)))
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

    }



    findGridElement(x, y) {
        const { offsetX, offsetY, size } = this
        const [nx, ny] = [x - offsetX, y - offsetY]
        let [rx, ry] = [nx / 2 + ny, -nx / 2 + ny]
        const i = Math.floor(rx / size)
        const j = Math.floor(ry / size)
        return [i, j]
    }
}