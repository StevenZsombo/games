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
    async initialize_more() {

        const LOD = await GameEffects.nameSelect([1, 2, 3, 4, 5], {
            topText: "Level of detail:", doNotConfirm: true
        }).promise()
        const selector = Button.fromRect(this.rect.copy.stretch(.5, .3).move(0, -200),
            { txt: "Select image", fontSize: 64 })
        const def = selector.copy
        def.topat(selector.bottom + 50)

        def.txt = "Or use default"
        def.on_release = async () => {
            this.remove_drawable(selector)
            this.remove_drawable(def)
            const img = await Cropper.loadImagePromise("fatloud.jpg")

            const qqq = new Rect(0, 0, img.width, img.height)
            qqq.scaleWithinAnother(this.rect)
            this.setup(
                await this.cropper.resizePromise(img, qqq.width, qqq.height),
                LOD)
        }
        let img
        selector.on_release = async () => {
            img = await this.cropper.filePicker()
            this.remove_drawable(selector)
            this.remove_drawable(def)

            const qqq = new Rect(0, 0, img.width, img.height)
            qqq.scaleWithinAnother(this.rect)
            this.setup(
                await this.cropper.resizePromise(img, qqq.width, qqq.height),
                LOD)
        }
        this.add_drawable(def)
        this.add_drawable(selector)

    }
    //#endregion

    setup(img, detail = 3) {

        const bg = Button.fromRectShallow(new Rect(0, 0, img.width, img.height))
        const canv = new GameCanvas(bg)
        const but = Button.fromRect(this.rect.copy.resize(img.width, img.height))
        but.visible = true
        but.color = "darkred"
        but.imgScale = 1
        this.add_drawable(but)
        this.add_drawable(canv)
        Object.assign(this, { but, canv })

        const ROWS = 16 * detail
        const rS = but.width / ROWS
        const COLS = 9 * detail
        const cS = but.height / COLS

        let radius = 120
        // Math.min(rS, cS) * 5

        const posToIJ = (pos) => ({
            i: Math.floor(pos.x / rS),
            j: Math.floor(pos.y / cS),
        })
        const ijToPos = (ij) => ({
            x: ij.i * rS,
            y: ij.j * cS,
        })


        class Cell {
            constructor(i, j) {
                this.i = i
                this.j = j
                const { x, y } = ijToPos({ i, j })
                this.x = this.origX = x
                this.y = this.origY = y
                this.vx = this.vy = 0
            }
            draw() {
                canv.ctx.drawImage(
                    img,
                    this.origX, this.origY, rS, cS,
                    this.x, this.y, rS, cS
                )
            }
            update(dt) {
                this.x += this.vx * dt
                this.y += this.vy * dt
            }
            disturbed = false
            crawlTo(x = this.origX, y = this.origY, crawlCoeff) {
                const dx = x - this.x
                const dy = y - this.y
                if (dx ** 2 + dy ** 2 < 1) {
                    this.x = this.origX
                    this.y = this.origY
                    this.vx = this.vy = 0
                    this.disturbed = false
                    return
                }
                this.x += dx * crawlCoeff
                this.y += dy * crawlCoeff
            }
        }
        /**@type {Cell[][]} */
        const grid = []
        for (let j = 0; j < COLS; j++) {
            const row = []
            for (let i = 0; i < ROWS; i++) {
                row.push(new Cell(i, j))
            }
            grid.push(row)
        }
        /**@type {Cell[]} */
        const gridFlat = grid.flat()
        canv.add_drawable(gridFlat)
        // but.scaleWithinAnother(this.rect)
        but.img = canv.canvas


        const spreadoutvel = 0.4
        let crawlCoeff = 0.02
        but.update = (dt) => {
            const pos = this.mouser
            /*const { i, j } = posToIJ({ x: pos.x - but.x, y: pos.y - but.y })
            if (!grid[j]?.[i]) return
            grid[j][i].vx = 1*/
            for (const g of gridFlat) {
                const dx = g.x - pos.x + but.x
                const dy = g.y - pos.y + but.y
                let mag
                if (Math.abs(dx) < radius && Math.abs(dy) < radius && (mag = Math.hypot(dx, dy)) < radius) {
                    g.disturbed = true
                    g.vx = dx / mag * spreadoutvel
                    g.vy = dy / mag * spreadoutvel
                } else if (g.disturbed) {
                    g.vx = g.vy = 0
                    g.crawlTo(undefined, undefined, crawlCoeff)
                }
            }
        }

        let canAnim = true
        const wave = () => {
            if (!canAnim) return
            canAnim = false
            this.animator.add_staggered((grid), 20, Anim.custom(null, 1000, (t, b) => {
                b.forEach(u => u.x = u.origX + 300 * t)
            }, "", {
                lerp: MM.compose(Anim.l.smoothstep, Anim.l.vee), on_end: (b) => b.forEach(u => u.disturbed = true),
                noLock: true
            }), { on_final: () => canAnim = true })
        }

        const corner = () => {
            if (!canAnim) return
            canAnim = false

            gridFlat.forEach(p => {
                p.x = 0
                p.y = 0
                p.disturbed = false
            })
            animRelease()
        }
        const animRelease = () => {
            this.animator.add_sequence(
                ...
                MM.reshape(MM.shuffle(gridFlat), 5)
                    .map(p => Anim.delay(5, { on_end: () => p.forEach(u => u.disturbed = true) })),
                Anim.delay(0, { on_end: () => canAnim = true })
            )
        }
        const random = () => {
            gridFlat.forEach(p => {
                p.disturbed = true
                p.x = MM.random(0, but.width)
                p.y = MM.random(0, but.height)
            })
        }
        const splitMid = () => {
            gridFlat.forEach(p => {
                p.disturbed = true
                p.x = but.width / 2
                p.y = MM.random(0, but.height)
            })
        }
        const spiral = () => {
            // return GameEffects.popup("TODO")
            // if (!canAnim) return
            const totalSteps = 180
            const polar = new Map()
            const { cx, cy } = canv.worldRect
            const angleStep = TWOPI / totalSteps //2 degrees each
            const magStep = canv.worldRect.width / totalSteps / 2 //half-widht
            gridFlat.forEach((p) => {
                const dx = p.x - cx
                const dy = p.y - cy
                const mag = Math.hypot(dx, dy)
                const ang = Math.atan2(dy, dx)
                // console.log({ mag, ang })
                let index = [mag / magStep, ang / angleStep].map(Math.floor)
                index = Math.max(...index)

                if (!polar.has(index)) polar.set(index, [])
                polar.get(index).push(p)

            })
            //sweep
            const all = new Set(gridFlat)
            all.forEach(p => {
                p.disturbed = false
                p.vx = p.vy = 0
            })
            let i = 0
            const a = setInterval(() => {
                let mag = i * magStep
                let ang = i * angleStep
                all.forEach(p => {
                    p.x = cx + Math.cos(ang) * mag
                    p.y = cy + Math.sin(ang) * mag
                })
                polar.get(i)?.forEach(p => {
                    all.delete(p)
                    p.disturbed = true
                })
                i++
                if (i > totalSteps) {
                    clearInterval(a)
                    all.forEach(p => p.disturbed = true)
                }
            }, 30)
            this.polar = polar
            console.log({ polar, all, cx, cy })

        }
        const dazzle = () => {
            gridFlat.forEach(p => {
                // if (Math.random() < .8 ) return
                p.x += MM.random(-1, 1) * 20
                p.y += MM.random(-1, 1) * 20
                p.disturbed = true
            })
        }

        const jitter = () => {
            // if (!canAnim) return
            // canAnim = true
            gridFlat.forEach(p => {
                p.rnd = MM.random(0, TWOPI)
            })
            let tot = 0
            const r = 5
            game.animator.add_anim(Anim.custom(null, 5000, (t) => {
                tot += t / 3
                gridFlat.forEach(p => {
                    p.x = p.origX + Math.cos(tot + p.rnd) * r
                    p.y = p.origY + Math.sin(tot + p.rnd) * r
                })
            }, null, { on_end: () => gridFlat.forEach(p => p.disturbed = true) }))
        }
        const setRadius = () =>
            radius = +prompt(`Set radius (current = ${radius}):`)

        const setCrawlCoeff = () =>
            crawlCoeff = +prompt(`Set crawlCoeff (current = ${crawlCoeff}):`)

        const allAnims = { setRadius, setCrawlCoeff, wave, corner, random, splitMid, spiral, dazzle, jitter }
        Object.assign(this, allAnims)

        const ab = new Button({ width: 200, x: 0, height: 80, txt: "Animate!" })
        ab.bottomat(this.HEIGHT)
        ab.on_click = GameEffects.dropDownDebugFunctionsFromAnObject(allAnims)
        this.add_drawable(ab)

        Object.assign(this, { grid, gridFlat })

    }
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
