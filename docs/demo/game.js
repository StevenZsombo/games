//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "auto",
    //BROKEN
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    //BROKEN
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_first_run_blocking: null,
    on_first_run_async: null, //async function. overrides on_first_run_blocking
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: true,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}
//#endregion


class Game extends GameCore {
    //#region initialize_more
    initialize_more() { }
    async initialize_async() {

        const rows = 190
        const cols = 100
        const fatness = 10
        //1000x1000
        const draw =/**@param {CanvasRenderingContext2D} ctx */ (ctx) => {
            ctx.save()
            ctx.scale(fatness, fatness)
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const value = game.grid[i][j]
                    if (typeof value === "string") ctx.fillStyle = value
                    else ctx.fillStyle = value ? "black" : "white"
                    ctx.fillRect(i, j, 1, 1)

                }
            }
            ctx.restore()
        }
        const ddd = { draw }

        this.grid = Array(rows).fill().map(_ => Array(cols).fill().map(_ => Math.random() < .5))

        this.w = new GameWorld(game.rect.copy)
        const i = Button.fromRect(game.rect.copy, { visible: false })
        this.add_drawable(i)
        this.w.make_button_on_screen_drag_world(i)
        this.w.make_button_on_screen_scroll_world_with_wheel(i)
        this.add_drawable(this.w)
        this.w.add_drawable(ddd)

        this.cellular = (minimumNeighboursNeeded = 5) => {
            this.grid = MM.cellularAutomata(this.grid, { minimumNeighboursNeeded })
        }

        this.conway = () => {
            this.grid = MM.conwaysGameOfLife(this.grid)
        }

        const worker = this.worker = MM.createWorker(
            (grid) => {
                const neighbours = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
                const numberOfNeighbors = (i, j) => neighbours.reduce((s, [u, w]) => s + (grid[i + u]?.[j + w] ?? 0), 0)
                return grid.map((x, i) => x.map((alive, j) => {
                    const n = numberOfNeighbors(i, j)
                    if (n == 3) return true
                    if (n == 2 && alive) return true
                    return false
                }))
            })

        this.period = 500
        worker.onmessage = e => {
            this.grid = e.data
            setTimeout(() => redo(), this.period) //infinite loop!

        }
        const redo = () => {
            worker.postMessage(this.grid)
        }
        // redo()

        const voronoi = () => {
            /**@type {boolean[][]} */
            const grid = this.grid
            grid.forEach(x => x.fill(false))
            const bases = 24
            const colors = Array(bases).fill().map((_, i) => `hsl(${360 / bases * i} 50% 50%)`)
            const winners = MM.choice(Array.from({ length: rows * cols }, (_, i) => i), bases)
            const indices = winners.map(k => [k % rows, (k - k % rows) / rows])
            /*
            indices.forEach(([i, j], k) => {
                grid[i][j] = colors[k]
            })
            */
            const findClosest = (i, j) => {
                let closest = 0
                let bestDist = Infinity
                indices.forEach(([x, y], k) => {
                    let dist = (x - i) ** 2 + (y - j) ** 2
                    if (dist < bestDist) {
                        closest = k
                        bestDist = dist
                    }
                })
                return colors[closest]
            }
            this.grid = grid.map((x, i) => x.map((_, j) => findClosest(i, j)))
            return { grid: this.grid, bases, colors, winners, indices }
        }

        this.voronoi = voronoi
        // voronoi()
        // game.once(() => game.isDrawing = false)

        this.randomwalk = (color = "blue", steps = 100) => {
            let i = Math.floor(rows / 2)
            let j = Math.floor(cols / 2)
            this.grid.forEach(x => x.fill(0))
            const paint = () => (this.grid[i]?.[j] != null) && (this.grid[i][j] = color)
            paint()
            // const options = [-1, 0, 1].flatMap(x => [-1, 0, 1].map(y => [x, y])).filter((([x, y]) => x || y))
            const options = [[-1, 0], [1, 0], [0, 1], [0, -1]]
            const step = () => {
                const c = MM.choice(options)
                i += c[0]
                j += c[1]
                paint()
            }
            /*
            setInterval(() => {
                if (steps-- > 0) {
                    step()
                }
            }, 5)*/
            while (steps-- > 0) step()
        }
    }
    //#endregion

    //#region update_more
    update_more(dt) {






    }
    //#endregion


    //#region draw_more
    draw_more(screen) {






    }
    //#endregion

    //#region next_loop_more
    next_loop_more() {




    }//#endregion



    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
