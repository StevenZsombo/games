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
        this.BGCOLOR = `hsl(0,70%,30%)`
        const defColor = "white"

        const nrPoints = 500
        const connectDistance = 120
        const avoidDistance = 160

        const points = Array(nrPoints).fill().map(_ => ({
            x: MM.random(0, this.WIDTH),
            y: MM.random(0, this.HEIGHT),
            vx: MM.random(-1, 1) * 0.1,
            vy: MM.random(-1, 1) * 0.1,
            size: MM.random(2, 5),
            move(dt) {
                this.x += this.vx * dt
                this.y += this.vy * dt
            },
            oob() {
                if (this.x < 0) this.x = game.WIDTH
                else if (this.x > game.WIDTH) this.x = 0
                if (this.y < 0) this.y = game.HEIGHT
                else if (this.y > game.HEIGHT) this.y = 0
            }
        }))


        const poinstDrawable = {
            update(dt) {
                const { x, y } = game.mouser.pos
                points.forEach(p => {
                    p.move(dt)
                    p.oob()
                    const dx = p.x - x
                    const dy = p.y - y
                    if (dx ** 2 + dy ** 2 < avoidDistance ** 2) {
                        const mag = 1 / Math.hypot(dx, dy) * avoidDistance
                        p.x = x + dx * mag
                        p.y = y + dy * mag
                    }
                })
            },
            draw(ctx) {
                points.forEach(p => {
                    MM.drawCircle(ctx, p.x, p.y, p.size, { color: defColor })
                })
                for (let i = 0; i < points.length; i++) {
                    const p = points[i]
                    for (let j = i + 1; j < points.length; j++) {
                        const q = points[j]
                        if ((p.x - q.x) ** 2 + (p.y - q.y) ** 2 < connectDistance ** 2)
                            MM.drawLine(ctx, p.x, p.y, q.x, q.y, { color: defColor, width: 1 })
                    }
                }
            },
        }

        this.add_drawable(poinstDrawable, 2)


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
