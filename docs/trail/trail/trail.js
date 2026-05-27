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
                this.orig = { x, y }
                /**@type {Point[]} */
                if (friends) this.friends = Array.from(friends)
                this.time = 0
                this.isRecent = true
                this.hue = (Date.now() / 10) % 360
                this.vx = (Math.random()) * Math.sign(Math.random() - .5) * .5
                this.vy = (Math.random()) * Math.sign(Math.random() - .5) * .5
                this.setNewOrigV()
            }
            move(coeff = 1) {
                this.x += this.vx * coeff
                this.y += this.vy * coeff
            }
            draw(ctx, radius = 10, color = `hsl(${this.hue},100%,50%)`) {
                MM.drawCircle(ctx, this.x, this.y, radius, { color })
            }
            velMult(coeff) {
                this.vx *= coeff
                this.vy *= coeff
            }
            setNewOrigV() {
                this.origV = { vx: this.vx, vy: this.vy }
            }
        }
        /**@type {Set<Point>} */
        const points = new Set()
        /**@type {Set<Point>} */
        const recents = new Set()
        const aliveFor = 1600
        const recentFor = 1200
        const radius = 15
        let lastPos = game.mouser.pos
        const cooldownBase = 50
        let cooldown = cooldownBase
        const addPoint = (x, y, dx, dy) => {
            x ??= game.mouser.pos.x
            y ??= game.mouser.pos.y
            const pt = new Point(x, y,
                // Array.from(recents).filter((x, i) => i == recents.size - 1 || Math.random() < .2)
                Array.from(recents).slice(-2)
            )
            if (dx || dy) {
                const ang = Math.atan2(dy, dx) + MM.random(-1, 1) * 0.1
            }
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
                if (
                    dx ** 2 + dy ** 2 > minMovement
                    && cooldown < 0
                    && game.lastHovered.size == 0
                ) addPoint(null, null, dx, dy)
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
                    MM.drawCircle(ctx, p.x, p.y, (1 - p.time / aliveFor) * radius, {
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
        butDots.centeratY(this.HEIGHT * .3)
        butDots.leftat(200)
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


        const butVult = Button.fromRectShallow(butDots)
        butVult.move(butVult.width * 1.5, 0)
        butVult.txt = "Vult"
        this.add_drawable(butVult, 3)
        /**@type {Set<Point>} */
        const vultures = new Set()
        const vultOut = 400
        const vultSpin = 1200
        const vultIn = 400
        const vulturesDrawable = {
            update(dt) {
                vultures.forEach(p => {
                    p.time += dt
                    if (p.time < vultOut) {
                        p.move(dt)
                    } else if (p.time < vultOut + vultSpin) {
                        const dx = p.orig.x - p.x
                        const dy = p.orig.y - p.y
                        /*const ang = Math.atan2(dy, dx) + 0.005
                        const dist = Math.hypot(dx, dy)
                        p.x = p.orig.x + dist * Math.cos(ang)
                        p.y = p.orig.y + dist * Math.sin(ang)*/
                        p.vx = dy * 0.0005
                        p.vy = -dx * 0.0005
                        p.move(dt)
                    } else if (p.time < vultOut + vultSpin + vultIn) {
                        if (!p.rot2) {
                            p.rot2 = true
                            const dx = p.orig.x - p.x
                            const dy = p.orig.y - p.y
                            const magAdj = Math.hypot(p.origV.vx, p.origV.vy) / Math.hypot(dx, dy) * vultOut / vultIn
                            p.vx = dx * magAdj
                            p.vy = dy * magAdj
                        }
                        p.move(dt)
                    } else {
                        vultures.delete(p)
                    }
                })
            },
            draw(ctx) {
                vultures.forEach(p => {
                    p.draw(ctx)
                })
            }

        }
        const addVult = (howmany = 24) => {
            for (let i = 0; i < howmany; i++) {
                const { x, y } = this.mouser.pos
                const v = new Point(x, y)
                const ang = TWOPI / howmany * i
                const [c, s] = [Math.cos, Math.sin].map(fn => fn(ang))
                v.vx = c
                v.vy = s
                v.velMult(.5)
                v.setNewOrigV()
                v.rot1 = v.rot2 = false
                vultures.add(v)
            }
        }
        butVult.on_release = () => addVult()
        this.add_drawable(vulturesDrawable)




        const butStar = Button.fromRectShallow(butVult)
        butStar.move(butStar.width * 1.5, 0)
        this.add_drawable(butStar, 3)
        butStar.txt = "Stars"
        /**@type {Set<Point & {poly: number[], legs:number}>} */
        const stars = new Set()
        const addStars = () => {
            const { x, y } = game.mouser.pos
            const p = new Point(x, y)
            p.legs = MM.randomInt(5, 7)
            p.poly = MM.polyStar(x, y, 50, { legs: p.legs })
            stars.add(p)
        }
        const starsGrow = 400
        const starsSize = 100
        const starsRotate = 800
        const starsDeflate = 400
        const starsDrawable = {
            update(dt) {
                stars.forEach(p => {
                    p.time += dt
                    if (p.time > starsGrow + starsRotate + starsDeflate) {
                        stars.delete(p)
                        return
                    }
                    p.poly = MM.polyStar(p.orig.x, p.orig.y,
                        p.time < starsGrow ? p.time / starsGrow * starsSize
                            : p.time > starsGrow + starsRotate ?
                                (1 - (p.time - starsGrow - starsRotate) / starsDeflate) * starsSize
                                : starsSize
                        , {
                            legs: p.legs,
                            startAngle: game.dtTotal / 360,

                        })
                })
            },
            draw(ctx) {
                stars.forEach(p => {
                    MM.drawPolygon(ctx, p.poly, { color: `hsl(${p.hue},100%,50%)`, outline: 0 })
                })
            }
        }
        butStar.on_release = () => addStars()
        this.add_drawable(starsDrawable)


        const butSquiggles = butStar.copy
        butSquiggles.txt = "Squiggles"
        butSquiggles.move(butSquiggles.width * 1.5, 0)
        butSquiggles.on_release = () => addSquiggles()
        this.add_drawable(butSquiggles, 3)
        /**@type {Set<{xy:number[], old: number[], time:number, loops:number, orig:{x:number,y:number}}>} */
        const squiggles = new Set()
        const squigglesMaxLoops = 3
        const squigglesSteadyTime = 1000
        const squigglesShuffleTime = 500
        const addSquiggles = (vertices = MM.randomInt(6, 8)) => {
            const s = { time: 0, loops: -1 }
            s.xy = Array(vertices).fill().flatMap(_ => [0, 0])
            s.orig = { ...game.mouser.pos }
            rearrange(s)
            squiggles.add(s)
        }
        const rearrange = (p) => {
            p.time = 0
            p.loops += 1
            if (p.loops > squigglesMaxLoops) {
                squiggles.delete(p)
                return true
            }
            p.old = [...p.xy]
            p.new =
                p.loops == squigglesMaxLoops
                    ? p.xy.map(_ => 0)
                    : p.xy.map(_ => MM.random(-200, 200))
            Anim.custom(p, squigglesShuffleTime, (t) => {
                p.xy = p.xy.map((_, i) => Anim.interpol(p.old[i], p.new[i], t))
            }, "", { ditch: true, add: game })

        }
        const squigglesDrawable = {
            update(dt) {
                squiggles.forEach(p => {
                    p.time += dt
                    if (p.time > squigglesSteadyTime) {
                        if (rearrange(p)) return
                    }
                })
            },
            draw(ctx) {
                squiggles.forEach(p => {
                    MM.drawPolygon(ctx, p.xy.map(
                        (c, i) => c + (i % 2 ? p.orig.y : p.orig.x)
                    ), { color: null, outline: 2, outline_color: "red" })
                })
            }
        }
        this.add_drawable(squigglesDrawable)




        Object.assign(this, { vultures, dots, points, stars, squiggles })

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
