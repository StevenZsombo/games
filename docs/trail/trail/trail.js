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
            constructor(x, y, friends) {
                this.x = x
                this.y = y
                /**@type {Point[]} */
                if (friends) this.friends = Array.from(friends)
                this.time = 0
                this.isRecent = true
                this.hue = (Date.now() / 10) % 360
                this.vx = (Math.random()) * Math.sign(Math.random() - .5) * .5
                this.vy = (Math.random()) * Math.sign(Math.random() - .5) * .5
            }
        }
        /**@type {Set<Point>} */
        const points = new Set()
        /**@type {Set<Point>} */
        const recents = new Set()
        const aliveFor = 800
        const recentFor = 1000
        let lastPos = game.mouser.pos
        const cooldownBase = 50
        let cooldown = cooldownBase
        const addPoint = (x, y) => {
            x ??= game.mouser.pos.x
            y ??= game.mouser.pos.y
            const pt = new Point(x, y,
                // Array.from(recents).filter((x, i) => i == recents.size - 1 || Math.random() < .2)
                Array.from(recents).slice(-3)
            )
            points.add(pt)
            recents.add(pt)
            cooldown = cooldownBase
        }
        const minMovement = 1
        const trailDrawable = {
            update(dt) {
                cooldown -= dt
                const dx = game.mouser.pos.x - lastPos.x
                const dy = game.mouser.pos.y - lastPos.y
                lastPos = game.mouser.pos
                if (dx ** 2 + dy ** 2 > minMovement && cooldown < 0) addPoint()
                points.forEach(p => {
                    p.time += dt
                    p.hue += dt / 360 * 0.1
                    p.x += p.vx
                    p.y += p.vy
                    if (p.isRecent && p.time > recentFor) {
                        p.isRecent = false
                        recents.delete(p)
                    }
                    if (p.time > aliveFor) {
                        points.delete(p)
                    }
                })

            },
            draw(ctx) {
                points.forEach(p => {
                    const color = `hsl(${p.hue},100%,50%)`
                    MM.drawCircle(ctx, p.x, p.y, (1 - p.time / aliveFor) * 20, {
                        color
                    })
                    if (p.isRecent) {
                        const left = 1 - p.time / recentFor
                        const color =
                            // `rgba(100,100,100,${left})`
                            `hsl(${p.hue},${left * 100}%,50%)`
                        p.friends.forEach(q =>
                            MM.drawLine(ctx, p.x, p.y, q.x, q.y, {
                                color, width: (left) * 2,
                            })
                        )
                    }
                })
            }
        }

        this.add_drawable(trailDrawable)





        const butDots = new Button({ width: 200, height: 200 })
        butDots.bottomat(this.HEIGHT - 100)
        butDots.leftat(100)
        butDots.txt = "Splash"

        this.add_drawable(butDots, 3)
        /**@type {Set<Point>} */
        const dots = new Set()
        butDots.on_click = () => {
            for (let i = 0; i < 50; i++) {
                const d = new Point(game.mouser.pos.x, game.mouser.pos.y)
                d.hue = Date.now() % 360 + MM.random(0, 30)
                d.vx *= 5
                d.vy *= 5
                dots.add(d)
            }
        }
        const dotsAlive = 800
        const dotsDrawable = {
            update(dt) {
                dots.forEach(p => {
                    p.time += dt
                    if (p.time > dotsAlive) {
                        dots.delete(p)
                        return
                    }
                    p.x += p.vx
                    p.y += p.vy
                })
            },
            draw(ctx) {
                dots.forEach(p => {
                    const left = (1 - p.time / dotsAlive)
                    MM.drawCircle(ctx, p.x, p.y,
                        left * 15,
                        { color: `hsla(${p.hue},100%,50%,${left})` }
                    )
                })
            }
        }
        this.add_drawable(dotsDrawable)

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
