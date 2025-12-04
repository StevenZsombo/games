//should import scripts.js, gui.js, MM.js, animations.js
const framerateUnlocked = false
const dtUpperLimit = 1000 / 30
const denybuttons = false
const showFramerate = false
const imageSmoothingEnabled = true
const imageSmoothingQuality = "high" // options: "low", "medium", "high"
const canvasStyleImageRendering = "smooth"
const fontFile = null//"resources/victoriabold.png" //set to null otherwise
const filesList = "" //space-separated

//#region window.onload
window.onload = function () {
    const canvas = document.getElementById("myCanvas")
    document.body.style.overflow = 'hidden';
    canvas.style.touchAction = 'none'
    canvas.style.userSelect = 'none'
    canvas.style.webkitUserDrag = 'none'
    document.addEventListener('dragover', (e) => {
        e.preventDefault()
        e.stopPropagation()
    }
    )
    document.addEventListener('drop', (e) => {
        e.preventDefault()
        e.stopPropagation()
    }
    )
    const screen = canvas.getContext("2d")
    screen.imageSmoothingQuality = imageSmoothingQuality
    screen.imageSmoothingEnabled = imageSmoothingEnabled
    canvas.style.imageRendering = canvasStyleImageRendering
    //canvas.tabIndex = 0
    //canvas.focus()
    beforeMain(canvas)
}
//#endregion

//#region beforeMain, main

const beforeMain = function (canvas) {
    const filelist = null
    //filelist = `${fontFile}${fontFile && filesList ? " " : ""}${filesList}` //fontFile goes first!
    if (filelist) {//croper, files, myFont are all GLOBAL
        cropper.load_images(filelist.split(" "), files, () => {
            if (fontFile) { myFont.load_fontImage(cropper.convertFont(Object.values(files)[0])) }
            main(canvas)
        })

    } else {
        main(canvas)
    }



}

const main = function (canvas) {
    canvas ??= document.getElementById("myCanvas")
    if (game !== undefined) { game.isRunning = false }
    game = new Game(canvas)
    game.start()
}
//#endregion

//#region Game
class Game {
    constructor() {
        const canvas = document.getElementById("myCanvas")
        this.canvas = canvas
        /**@type {RenderingContext} */
        this.screen = canvas.getContext("2d")

        this.WIDTH = canvas.width
        this.HEIGHT = canvas.height
        this.SIZE = {
            x: this.WIDTH,
            y: this.HEIGHT
        }
        /**@type {Rect}*/
        this.rect = new Rect(0, 0, this.WIDTH, this.HEIGHT)
        this.BGCOLOR = stgs.BGCOLOR ?? "linen"
        //null for transparent
        this.CENTER = {
            x: this.SIZE.x / 2,
            y: this.SIZE.y / 2
        }
        this.mouser = new Mouser(canvas)
        this.keyboarder = new Keyboarder(denybuttons)
        this.framerate = new Framerater(showFramerate)
        this.framerateUnlocked = framerateUnlocked //redundant unless reused
        this.animator = new Animator()
        this.cropper = new Cropper()

        this.extras_on_update = []
        this.extras_on_draw = []
        this.extras_temp = []

        this.layers = Array(10).fill().map(x => [])

        showFramerate && this.add_drawable(this.framerate.button)


        this.lastCycleTime = Date.now()


    }
    start() {
        this.status = "initializing"
        this.initialize()
        this.initialize_more()
        /**@type {boolean} */
        this.isRunning = true
        this.isDrawing = true
        this.isAcceptingInputs = true
        this.status = "playing"
        this.tick()
    }
    initialize() {

    }

    tick() {
        if (!this.isDrawing) {
            this.drawnAlready = true
        }
        if (!this.isRunning) {
            return
        }
        const now = Date.now()
        const dt = Math.min((now - this.lastCycleTime), dtUpperLimit)
        this.lastCycleTime = now

        const screen = this.screen
        this.drawnAlready ? null : this.draw_reset(screen)
        this.update(dt)
        this.update_more(dt)
        this.extras_on_update.forEach(x => x.call(this))
        this.drawnAlready ? null : this.draw(screen)
        this.drawnAlready ? null : this.draw_more(screen)
        this.extras_on_draw.forEach(x => x.call(this))
        this.next_loop()
        this.next_loop_more()
        this.extras_temp.forEach(x => x.call(this))
        this.extras_temp.length = 0
        if (!this.isRunning) {
            return
        }

        this.framerate.update(dt, this.drawnAlready)
        if (!this.framerateUnlocked) {
            requestAnimationFrame(this.tick.bind(this))
        } else {
            setTimeout(this.tick.bind(this), 0)
            if (!this.drawnAlready) {
                this.drawnAlready = true
                requestAnimationFrame((function () { this.drawnAlready = false }).bind(this))
                this.animator.draw()
            }
        }




    }

    update(dt) {
        //update
        const now = Date.now()
        this.keyboarder.update(dt, now)
        this.update_drawables(dt)
        this.animator.update(dt)

    }
    update_drawables(dt) {
        for (const layer of this.layers) {
            for (const item of layer) {
                item.update?.(dt)
                if (this.isAcceptingInputs) {
                    item.check?.(this.mouser.x, this.mouser.y, this.mouser.clicked, this.mouser.released, this.mouser.held, this.mouser.wheel)
                }
            }
        }
    }

    draw(screen) {
        //draw
        this.draw_layers(screen)
        this.framerate.draw(screen)

    }

    draw_reset(screen) {
        if (this.BGCOLOR) {
            screen.fillStyle = this.BGCOLOR
            screen.fillRect(0, 0, this.WIDTH, this.HEIGHT)
        } else {
            screen.clearRect(0, 0, this.WIDTH, this.HEIGHT)
        }
    }

    draw_layers(screen) {
        for (const layer of this.layers) {
            for (const item of layer) {
                item.draw(screen)
            }
        }
    }

    next_loop() {
        this.mouser.next_loop()
        this.keyboarder.next_loop()
    }
    close() {
        this.isRunning = false
        setTimeout(x => game.screen.fillRect(0, 0, game.WIDTH, game.HEIGHT), 100)

    }
    add_drawable(items, layer = 5) {
        if (!Array.isArray(items)) {
            items = [items]
        }
        for (const item of items) {
            this.layers[layer].push(item)
        }
    }
    remove_drawable(item) {
        this.layers = this.layers.map(x => x.filter(y => y !== item))
    }
    //#endregion
    //#region more
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                             customize here                                                   ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                                                                                              ///
    ///         these are called  when appropriate                                                                   ///
    ///                                                                                                              ///
    ///         initialize_more                                                                                      ///                                   
    ///         draw_more                                                                                            ///
    ///         update_more                                                                                          ///
    ///         next_loop_more                                                                                       ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                             INITIALIZE                                                       ///
    /// start initialize_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#endregion
    //#region initialize_more
    initialize_more() {
        if (!stgs.numberOfTransformations) {
            const diff = this.rect.copy.splitCol(1, 1, 1).
                map(x => x.stretch(.8, .2)).
                map(Button.fromRect)

            diff.forEach((x, i) => {
                x.txt = ["Random easy\n2 transformations", "Random medium\n3 transformations", "Random hard\n4-5 transformations"][i]
                x.fontSize = 36
                x.on_release = () => {
                    stgs.numberOfTransformations = [2, 3, MM.choice([4, 4, 5])][i]
                    main()
                }
            })

            this.add_drawable(diff)

            return
        }


        const bg = Button.fromRect(this.rect.copy)
        bg.resize(1400, 1000)
        bg.topleftat(40, 40)
        bg.color = "white"
        this.add_drawable(bg)
        const plt = new Plot(null, bg)
        this.add_drawable(plt)
        plt.show_axes = true
        plt.show_grid = true
        plt.axes_width = 3
        plt.grid_width = 1
        plt.width = 4
        plt.label_highlighted = false
        Object.assign(plt, stgs.plt)
        plt.matchAxesScaling()
        plt.show_border_values = false
        const level = this.randomSquiggly(stgs.numberOfTransformations)
        plt.func = MM.brokenLineFunction(...level.pts.flat())
        plt.highlightedPoints = level.pts
        const COLORS = ["green", "red", "blue", "orange", "brown"]
        const points = Array(COLORS.length).fill([])
        game.index = 0
        const guidance = {}
        const buttons = {}



        const colorSelectorBG = new Rect(bg.right, bg.top, 0, 0)
        colorSelectorBG.bottomrightstretchat(this.rect.right, bg.bottom)
        //this.add_drawable(colorSelectorBG)
        colorSelectorBG.stretch(.9, .15)
        colorSelectorBG.bottomat(bg.bottom)


        const colorButtons = colorSelectorBG.
            splitCol(...Array(COLORS.length).fill(1)).
            map(x => x.shrinkToSquare()).
            map(x => x.deflate(14, 14)).
            map(Button.fromRect)
        colorButtons.forEach((x, i) => {
            x.color = COLORS[i]
            //x.outline_color = "black"
            x.outline = 3
            x.on_click = () => this.selectColor(i)
            plt.pltMore[i] = { color: COLORS[i], highlightedPoints: [] }
        })
        game.colorButtonsDefaultSize = colorButtons[0].width

        colorSelectorBG.move(0, -.6 * colorSelectorBG.height)
        guidance.colors = Button.fromRect(colorSelectorBG)
        guidance.colors.txt = "Choose color:"
        guidance.colors.transparent = true

        colorSelectorBG.move(0, -colorSelectorBG.height)

        buttons.clear = Button.fromRect(colorSelectorBG)
        Object.assign(buttons.clear, {
            txt: "Clear this color",
            on_click: () => {
                buttons.clear.interactable = false
                this.animator.add_anim(Anim.stepper(buttons.clear, 500, "rad", 0, TWOPI, {
                    on_end: () => {
                        buttons.clear.interactable = true
                        game.clearAll(game.index)
                    }
                }))
                this.animator.add_anim(Anim.stepper(plt.pltMore[game.index], 500, "opacity", 0, 1))
            }
        })
        colorSelectorBG.move(0, -1.5 * colorSelectorBG.height)

        buttons.submit = Button.fromRect(colorSelectorBG)
        Object.assign(buttons.submit, {
            txt: "Submit this color",
            on_click: () => {
                buttons.submit.interactable = false
                this.animator.add_anim(Anim.stepper(buttons.submit, 500, "rad", 0, TWOPI, {
                    on_end: () => {
                        buttons.submit.interactable = true
                        const didTheyWin = game.checkVictory(game.index)
                        if (!didTheyWin) {
                            //this.animator.add_anim(Anim.setter(buttons.instruction, 1000, "txt", ["Try again to draw:"]))
                            this.animator.add_anim(Anim.setter(buttons.submit, 1500, "txt", "Incorrect, try again.", { ditch: true, noLock: true }))
                            this.animator.add_anim(Anim.setter(buttons.submit, 1500, "interactable", [false], { noLock: true }))
                        }
                    }
                }))
            }
        })


        colorSelectorBG.topat(bg.top)
        buttons.retry = Button.fromRect(colorSelectorBG)
        buttons.instruction = Button.fromRect(colorSelectorBG)
        buttons.instruction.move(0, 80)
        buttons.instruction.txt = "Draw:"
        buttons.instruction.transparent = true
        colorSelectorBG.move(0, colorSelectorBG.height)
        buttons.eqn = Button.fromRect(colorSelectorBG)
        //buttons.eqn.txt = level.eqn
        Button.make_latex(buttons.eqn, level.eqn)
        buttons.eqn.outline = 5
        buttons.eqn.transparent = true
        buttons.eqn.stretch(.9, .9)

        buttons.retry.stretch(.5, .5)
        buttons.retry.topat(bg.top)
        buttons.retry.rightat(colorSelectorBG.right)
        buttons.retry.txt = "Give up"



            ;
        [...Object.values(guidance), ...Object.values(buttons)].forEach(b => {
            b.fontSize = 32
            b.stretch(1, .8)
        })
        buttons.eqn.fontSize = 56

        this.add_drawable(colorButtons)
        this.add_drawable(Object.values(buttons))
        this.add_drawable(Object.values(guidance))



        Object.assign(game, { COLORS, points, level, plt, colorButtons, guidance, buttons })
        this.selectColor(0)

        bg.on_hover = (pos) => {
            let { x, y } = plt.pointerPosToCoord(pos)
            x = Math.round(x)
            y = Math.round(y)
            const u = plt.coordToScreenPos(x, y)
            const px = plt.coordToScreenPos(x, 0)
            const py = plt.coordToScreenPos(0, y)

            //plt.pltMore[game.index].highlightedPoints.push([x, y])
            game.extras_temp.push(
                () => {
                    const C = COLORS[game.index]
                    const screen = this.screen
                    MM.drawCircle(screen, u.x, u.y, 10, { color: null, outline: 2, outline_color: C })
                    //MM.drawCircle(screen, px.x, px.y, 6, { color: C })
                    //MM.drawCircle(screen, py.x, py.y, 6, { color: C })
                    MM.drawLine(screen, bg.left, u.y, bg.right, u.y, { color: C, width: 1 })
                    MM.drawLine(screen, u.x, bg.top, u.x, bg.bottom, { color: C, width: 1 })
                }
            )
        }

        bg.on_release = (pos) => {
            let { x, y } = plt.pointerPosToCoord(pos)
            x = Math.round(x)
            y = Math.round(y)
            this.addPoint(x, y)
        }


        game.hasWonAlready = false
        buttons.retry.on_click = () => {
            if (!game.hasWonAlready) {
                buttons.retry.txt = "New puzzle"
                game.hasWonAlready = true
                const sol = { color: "fuchsia" }
                plt.pltMore[COLORS.length + 1] = sol
                const { a, b, s, t } = level
                this.animator.add_anim(Anim.setter(buttons.retry, 1500, "interactable", [false]))
                this.animator.add_anim(Anim.custom(sol, 1000, function (time) {
                    sol.func = MM.functionTransformation(plt.func,
                        Anim.interpol(1, a, time), 1 / Anim.interpol(1, 1 / b, time),
                        Anim.interpol(0, s, time), Anim.interpol(0, t, time))
                    sol.highlightedPoints = level.pts.map(p =>
                        MM.pointTransformation(p[0], p[1],
                            Anim.interpol(1, a, time), 1 / Anim.interpol(1, 1 / b, time),
                            Anim.interpol(0, s, time), Anim.interpol(0, t, time))
                    )

                }, "", {
                    on_end: () => {
                        sol.func = MM.functionTransformation(plt.func, a, b, s, t)
                        sol.highlightedPoints = level.pts.map(p => MM.pointTransformation(p[0], p[1], a, b, s, t))

                    }
                }))
            } else {
                main()
            }
        }


    }
    //#region randomSquiggly
    randomSquiggly(numberOfTransformations) {
        /*
        if (stgs.level) {
            const level = stgs.level
            stgs.level = null
            return level
        }*/
        stgs.numberOfTransformations = null
        stgs.generationAttemptcount++
        const { minX, maxX, minY, maxY } = stgs.plt
        let [a, b, s, t, ra, rb] = [1, 1, 0, 0, [1, 1], [1, 1]]
        const transOpts = [
            () => { ra = MM.choice([[2, 1], [3, 1], [4, 1], [1, 2], [1, 3], [3 / 2], [2 / 3]]) },
            () => { rb = MM.choice([[2, 1], [3, 1], [4, 1], [1, 2], [1, 3], [3 / 2], [2 / 3]]) },
            () => { s = MM.choice([...MM.range(minX + 1, maxX)].filter(x => x != 0)) },
            () => { t = MM.choice([...MM.range(minY + 1, maxY)].filter(x => x != 0)) },
            () => {
                const r = MM.choice([0, 1, 2])
                if (r == 0) { ra[0] *= -1 }
                if (r == 1) { rb[0] *= -1 }
                if (r == 2) { ra[0] *= -1; rb[0] *= -1; }
            },
        ]
        console.log({ transOpts, numberOfTransformations })
        MM.choice(transOpts, numberOfTransformations).forEach(x => x.call())
        a = ra[0] / ra[1]
        b = rb[0] / rb[1]
        const ptsXOpts = [...MM.range(minX + 1, maxX)].filter(x => Math.abs(x % Math.abs(a)) < 0.01).filter(x => MM.between(x, minX + 1, maxX - 1))
        const ptsYopts = [...MM.range(minY + 1, maxY)].filter(y => Math.abs(y % Math.abs(1 / b)) < 0.01).filter(y => MM.between(y, minY + 1, maxY - 1))
        const ptsPreTransform = [...MM.cartesianProduct(ptsXOpts, ptsYopts)]
        const ptsAll = ptsPreTransform.map(p => {
            return {
                pre: p,
                mid: MM.pointTransformation(p[0], p[1], a, b, 0, 0),
                post: MM.pointTransformation(p[0], p[1], a, b, s, t)
            }
        }).filter(p => {
            return MM.isNearInteger(p.post[0])
                && MM.isNearInteger(p.post[1])
                && MM.between(p.post[0], minX + 1, maxX - 1)
                && MM.between(p.post[1], minY + 1, maxY - 1)
                && MM.between(p.mid[0], minX + 1, maxX - 1)
                && MM.between(p.mid[1], minY + 1, maxY - 1)

        })
        const myXvals = [...new Set(ptsAll.map(p => p.pre[0]))]
        const selectedXvals = MM.choice(myXvals, MM.choice([4, 4, 4, 5, 5]))
        const selectedPoints = selectedXvals.map(x =>
            MM.choice(ptsAll.filter(p => p.pre[0] == x))
        ).sort((u, w) => u.pre[0] - w.pre[0])
        if (selectedPoints.length < 4) {
            return this.randomSquiggly(numberOfTransformations)
            console.error({ a, b, s, t, ptsAll, myXvals, selectedXvals, selectedPoints })
            throw "could not generate points with the given criteria"
        }
        let ta, tb, tmbs, tt, ts
        if (a == 1) { ta = "" }
        else if (a == -1) { ta = "-" }
        else if (ra[1] == 1) { ta = ra[0] }
        else { ta = `${ra[0] > 0 ? "" : "-"}\\frac{${Math.abs(ra[0])}}{${ra[1]}}` }
        if (b == 1) { tb = "x" }
        else if (b == -1) { tb = "-x" }
        else if (rb[1] == 1) { tb = `${rb[0]}x` }
        else { tb = `${rb[0] > 0 ? "" : "-"}\\frac{${Math.abs(rb[0]) == 1 ? "" : Math.abs(rb[0])}x}{${rb[1]}}` }
        tt = t == 0 ? "" : t > 0 ? `+${t}` : t
        const numer = -rb[0] * s
        const denom = rb[1]
        const gcd = Math.abs(MM.gcd(Math.abs(numer), denom))
        const numersimp = numer / gcd
        const denomsimp = denom / gcd
        if (numersimp == 0) { ts = "" }
        else if (denomsimp == 1) { ts = numersimp > 0 ? `+${numersimp}` : numersimp }
        else { ts = `${numersimp > 0 ? "+" : "-"}\\frac{${Math.abs(numersimp)}}{${denomsimp}}` }
        const eqn = `y = ${ta}f\\left(${tb}${ts}\\right)${tt}`
        const oldeqn = (() => {
            if (a == 1) { ta = "" }
            else if (a == -1) { ta = "-" }
            else {
                ta = ra[0]
                if (ra[1] != 1) { ta = `(${ra[0]}/${ra[1]})` }
            }
            if (b == 1) { tb = "" }
            else if (b == -1) { tb = "-" }
            else {
                tb = rb[0]
                if (rb[1] != 1) { tb = `(${rb[0]}/${rb[1]})` }
            }
            if (t == 0) { tt = "" }
            else { tt = t > 0 ? `+${t}` : t }
            if (s == 0) { tmbs = "" }
            else {
                const numer = -rb[0] * s
                const denom = rb[1]
                const gcd = Math.abs(MM.gcd(Math.abs(numer), denom))
                const simplified = [numer / gcd, denom / gcd]
                tmbs = simplified[0]
                if (simplified[1] != 1) {
                    tmbs = `${tmbs}/${simplified[1]}`
                }
                if (simplified[0] > 0) tmbs = `+${tmbs}`
            }
            return `y = ${ta}f(${tb}x${tmbs})${tt}`
        })()

        const ret = {
            a, b, s, t,
            pts: selectedPoints.map(p => p.pre), transPts: selectedPoints.map(p => p.post).sort((u, w) => u[0] - w[0]),
            eqn: eqn,
            oldeqn: oldeqn
        }
        if (stgs.logSolution) { console.log(ret) }
        console.log(`Generation successful after ${stgs.generationAttemptcount} attempt(s).`)
        return ret
    }
    //#endregion
    //#region Controls
    selectColor(index) {
        game.index = index

        game.colorButtons.forEach(
            /**@param {Button} x */
            (x, i) => {
                //x.outline = i == index ? 16 : 0
                const size = (i == index ? 1.2 : .6) * game.colorButtonsDefaultSize
                x.resize(size, size)
            })
    }
    addPoint(x, y) {
        const point = [x, y]
        const existing = game.plt.pltMore[game.index].highlightedPoints
        const samePointIndex = existing.findIndex(arr => arr[0] == x && arr[1] == y)
        if (samePointIndex != -1) {
            existing.splice(samePointIndex, 1)
        } else {
            const sameXPoint = existing.find(arr => arr[0] == x)
            if (sameXPoint) {
                sameXPoint[1] = y
            } else {
                existing.push(point)
            }
        }
        if (existing.length >= 2) {
            game.plt.pltMore[game.index].func = MM.brokenLineFunction(...existing.sort((u, w) => u[0] - w[0]).flat())
        } else {
            game.plt.pltMore[game.index].func = null
        }
        //this.checkVictory()
    }

    clearAll(index) {
        game.plt.pltMore[index].highlightedPoints.length = 0
        game.plt.pltMore[index].func = null
    }

    checkVictory(index) {
        const attempt = game.plt.pltMore[index].highlightedPoints.sort((u, w) => u[0] - w[0]).flat()
        const correct = game.level.transPts.flat()
        if (MM.arrayEquals(attempt, correct)) {
            this.victory()
            return true
        }

        return false

    }

    victory() {
        if (!game.hasWonAlready) {
            game.hasWonAlready = true
            GameEffects.fireworksShow()
            game.buttons.retry.txt = "New puzzle"
            game.buttons.submit.txt = "Victory!!!"
            game.buttons.submit.interactable = false
            game.animator.add_anim(Anim.delay(500, {
                on_end: () => {
                    game.animator.add_anim(Anim.stepper(game.buttons.retry, 500, "rad", 0, TWOPI, { noLock: true, repeat: 3 }))
                    //game.animator.add_anim(new Anim(game.buttons.retry, 500, Anim.f.scaleThroughFactor, { scaleFactor: .6, noLock: true, repeat: 3 }))
                }
            }))
        }
    }
    //#endregion
    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {




    }
    //#endregion
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region draw_more
    draw_more(screen) {









    }
    #end
    ///end draw_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                            ^^^^DRAW^^^^                                                      ///
    ///                                                                                                              ///
    ///                                              NEXT_LOOP                                                       ///
    ///start next_loop_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region next_loop_more
    next_loop_more() {




    }//#endregion
    ///end next_loop_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                          ^^^^NEXT_LOOP^^^^                                                   ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////



} //this is the last closing brace for class Game

//#region dev options
/// dev options
const dev = {
    redefineBounds: (minX, maxX, minY, maxY) => {
        Object.assign(stgs.plt, { minX, maxX, minY, maxY })
    }


}/// end of dev
//#endregion

/**@type {HTMLImageElement[]} */
const files = {}

/**@type {customFont} */
const myFont = new customFont()
//*@type {Cropper}*/
const cropper = new Cropper()
/** @type {Game}*/
var game



