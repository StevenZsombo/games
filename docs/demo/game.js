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

        const cols = 190
        const rows = 100
        const fatness = 10
        //1000x1000
        const draw =/**@param {CanvasRenderingContext2D} ctx */ (ctx) => {
            ctx.save()
            ctx.scale(fatness, fatness)
            for (let i = 0; i < game.grid.length; i++) {
                for (let j = 0; j < game.grid[0].length; j++) {
                    const value = game.grid[i][j]
                    if (typeof value === "string") ctx.fillStyle = value
                    else ctx.fillStyle = value ? "black" : "white"
                    ctx.fillRect(j, i, 1, 1)

                }
            }
            ctx.restore()
        }
        const ddd = { draw }

        this.grid = Array(rows).fill().map(_ => Array(cols).fill().map(_ => Math.random() < .5))

        this.noise = () => this.grid = Array(rows).fill().map(_ => Array(cols).fill().map(_ => Math.random() < .5))

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
        let canDoInfinite = false
        worker.onmessage = e => {
            this.grid = e.data
            if (!canDoInfinite) return
            setTimeout(() => redo(), this.period) //infinite loop!

        }
        const redo = () => {
            worker.postMessage(this.grid)
        }
        // redo()
        this.infiniteConway = () => {
            canDoInfinite = true
            redo()
        }
        const voronoi = (bases) => {
            /**@type {boolean[][]} */
            const grid = this.grid
            grid.forEach(x => x.fill(false))
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

        this.randomwalk = (color = "blue", steps = 2000) => {
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

        this.bsp = (iterations = 6) => {
            const rect = function (x, y, w, h) { return ({ x, y, w, h }) }
            let minsize = 6
            let R = rows
            let C = cols

            const split = r => {
                if (r.w < 2 * minsize || r.h < 2 * minsize) return [r]
                if (r.w > r.h) {
                    let bp = minsize + Math.floor(Math.random() * (r.w - 2 * minsize))
                    return [rect(r.x, r.y, bp, r.h), rect(r.x + bp, r.y, r.w - bp, r.h)]
                } else {
                    let bp = minsize + Math.floor(Math.random() * (r.h - 2 * minsize))
                    return [rect(r.x, r.y, r.w, bp), rect(r.x, r.y + bp, r.w, r.h - bp)]
                }
            }



            let a = [rect(0, 0, R, C)]

            const b = Array(R).fill().map(_ => Array(C).fill("#"))

            const draw = (r) => {
                for (let i = r.x; i < r.x + r.w; i++) {
                    for (let j = r.y; j < r.y + r.h; j++) {
                        b[i][j] = "."
                    }
                }
            }

            const display = () => { console.log(b.map(x => x.join("")).join("\n")) }

            const pickRoom = (r) => {
                const w = minsize - 2 + Math.floor(Math.random() * (r.w - 2 - (minsize - 2)))
                const h = minsize - 2 + Math.floor(Math.random() * (r.h - 2 - (minsize - 2)))
                const x = r.x + 1 + Math.floor(Math.random() * (r.w - w - 2))
                const y = r.y + 1 + Math.floor(Math.random() * (r.h - h - 2))
                r.room = rect(x, y, w, h)
            }

            const center = r => [r.x + r.w / 2, r.y + r.h / 2].map(Math.floor)
            const carveCorridor = (r1, r2) => {
                const [c1, c2] = [r1, r2].map(center)
                const [xlower, xhigher] = c1[0] < c2[0] ? [c1[0], c2[0]] : [c2[0], c1[0]]
                const [ylower, yhigher] = c1[1] < c2[1] ? [c1[1], c2[1]] : [c2[1], c1[1]]
                const [cornerX, cornerY] =
                    // Math.random() < .5 
                    true ? [c1[0], c2[1]] : [c2[0], c1[1]];
                for (let i = xlower; i <= xhigher; i++) b[i][cornerY] = ".";
                for (let j = ylower; j <= yhigher; j++) b[cornerX][j] = ".";
            }

            let rounds = iterations ?? +prompt()
            let lastNumberOfRooms = a.length
            while (rounds-- > 0) {
                a = a.flatMap(split)
                if (a.length == lastNumberOfRooms) {
                    console.error("number of rooms stabilized after only ", iterations - rounds, "iterations")
                    break
                }
                lastNumberOfRooms = a.length
            }
            a.forEach(pickRoom)
            const rooms = a.map(x => x.room)
            rooms.forEach(draw)
            //rooms that came from the same split are adjacent, so I can just do a shifting window
            rooms.slice(1).forEach((x, i) => carveCorridor(x, rooms[i]))
            display()

            this.grid = b.map(x => x.map(k => k == "#"))

            return { a, b, rooms }
        }

        const buttonMall = this.buttonMall = new Malleable()
        const lowerRect = new Rect(0, 0, this.WIDTH, this.HEIGHT - rows * fatness).untangle()
        lowerRect.stretch(.9, .7)
        lowerRect.bottomat(this.HEIGHT)
        const wanted = [
            ["noise", () => this.noise()],
            ["cellular", () => this.cellular()],
            ["conway", () => this.conway()],
            ["infiniteConway", () => {
                this.infiniteConway()
                ICB.txt = "STOP"
                ICB.on_release = () => {
                    canDoInfinite = false
                    ICB.txt = wanted[3][0]
                    ICB.on_release = wanted[3][1]
                }

            }],
            ["voronoi", () => this.voronoi(+prompt("bases"))],
            ["BSP", () => this.bsp(+prompt("number of iterations:"))]
        ]
        buttonMall.push(...
            lowerRect.splitGrid(1, wanted.length).flat().map((r, i) => {
                r = Button.fromRect(r)
                r.color = "lightgray"
                r.txt = wanted[i][0]
                r.on_release = wanted[i][1]
                return r
            }))
        const ICB = buttonMall.find(x => x.txt == "infiniteConway")
        this.add_drawable(buttonMall, 6)
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
