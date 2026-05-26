//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: true,
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
    initialize_more() {
        class Point {
            constructor(x, y) {
                this.x = x
                this.y = y
                this.orig = { x, y }
                this.disturbed = false
            }
        }
        /**@type {Point[][]} */
        const points = []
        const rows = 80 * 2
        const cols = 40 * 2
        const radius = 3
        for (let i = 0; i < rows - 1; i++) {
            // points.push(Array(cols).fill().map((_, j) => new Point(this.WIDTH / rows * (i + (i % 2) * .5), this.HEIGHT / cols * (j + (j % 2) * .5))))
            let next = Array(cols - 1).fill().map((_, j) => new Point(this.WIDTH / rows * (i + 1), this.HEIGHT / cols * (j + 1)))
            // next.forEach((p, j) => { if (j % 2 == 0) p.x -= this.WIDTH / rows / 2 })
            if (i == rows - 1) {
                // next = next.filter((_, j) => j % 2 == 0)
            }
            points.push(next)
        }
        console.log(points)

        const tolerance = 3
        const drift = 0.01
        const driftAwayCoeff = 1
        const radiusSquare = 80 ** 2
        const returnRadiusSquare = radiusSquare * 1.1 ** 2
        const ptsDrawable = {
            four: [],
            twelve: [],
            update(dt) {
                const { pos } = game.mouser
                points.forEach((row, i) => {
                    row.forEach((entry, j) => {
                        const dx = pos.x - entry.x
                        const dy = pos.y - entry.y
                        const distSquare = dx ** 2 + dy ** 2
                        if (distSquare < radiusSquare) {
                            entry.x -= dx * drift * driftAwayCoeff * dt
                            entry.y -= dy * drift * driftAwayCoeff * dt
                            entry.disturbed = true
                        } else if (entry.disturbed && distSquare > returnRadiusSquare) {
                            const dx = entry.orig.x - entry.x
                            const dy = entry.orig.y - entry.y
                            if (Math.abs(dx) < tolerance && Math.abs(dy) < tolerance) {
                                entry.x = entry.orig.x
                                entry.y = entry.orig.y
                                entry.disturbed = false
                            }
                            entry.x += dx * drift * dt
                            entry.y += dy * drift * dt

                        }
                    })
                })
            },
            updateFrag(dt) {
                const c = closest()
                const f = this.four = c.four
                const t = this.twelve = c.twelve
                const a = f.concat(t)
                points.forEach((row, i) => {
                    row.forEach((entry, j) => {
                        if (a.includes(entry)) {
                            entry.disturbed = true
                            const { pos } = game.mouser
                            const dx = pos.x - entry.x
                            const dy = pos.y - entry.y
                            if (dx ** 2 + dy ** 2 < radiusSquare) {
                                entry.x -= dx * drift * driftAwayCoeff * dt
                                entry.y -= dy * drift * driftAwayCoeff * dt
                            }
                        } else if (entry.disturbed) {
                            const dx = entry.orig.x - entry.x
                            const dy = entry.orig.y - entry.y
                            if (Math.abs(dx) < tolerance && Math.abs(dy) < tolerance) {
                                entry.x = entry.orig.x
                                entry.y = entry.orig.y
                                entry.disturbed = false
                            }
                            entry.x += dx * drift * dt
                            entry.y += dy * drift * dt

                        }
                    })
                })
            },
            draw(ctx) {
                const f = this.four
                const t = this.twelve
                points.forEach((row, i) => {
                    row.forEach((entry, j) => {
                        MM.drawCircle(ctx, entry.x, entry.y, radius, {
                            color:
                                "black"
                            /*f.includes(entry) ? "red" :
                                t.includes(entry) ? "green" :
                                    entry.disturbed ? "black" : "lightgray"*/
                        })
                    })
                })
            }

        }
        this.add_drawable(ptsDrawable, 3)


        const closest = (pos) => {
            const { x, y } = pos ?? game.mouser.pos
            if (x == null || y == null) return { four: [], twelve: [] }
            const i = Math.floor(x / this.WIDTH * rows) - 1
            const j = Math.floor(y / this.HEIGHT * cols) - 1
            const four = [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]].map(([i, j]) => points[i]?.[j]).filter(x => x)
            const twelve =
                [
                    [i - 1, j - 1], [i - 1, j], [i - 1, j + 1], [i - 1, j + 2],
                    [i, j - 1], [i, j + 2],
                    [i + 1, j - 1], [i + 1, j + 2],
                    [i + 2, j - 1], [i + 2, j], [i + 2, j + 1], [i + 2, j + 2],
                ]
                    .map(([i, j]) => points[i]?.[j]).filter(x => x)
            return { four, twelve }

        }


        Object.assign(this, { closestFour: closest, points, ptsDrawable })
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
