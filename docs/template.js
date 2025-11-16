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
        this.update_more(dt)

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
    initialize_more() {
        //#region makeLevel
        const makeLevel = (func, ptsX = [], a = 1, b = 1, s = 0, t = 0, reorient = true) => {
            const bg = Button.fromRect(this.rect.copy.splitCol(5, 4)[0].stretch(.9, .9).shrinkToSquare())
            const ig = this.rect.copy.splitCol(5, 4)[1].stretch(.9, .9)
            bg.color = "white"
            bg.leftat(bg.left / 2)
            let pts
            if (ptsX) {
                pts = ptsX.map(x => [x, func(x)])
            }
            let transFunc, transPts
            transPts ??= pts.map(p => MM.pointTransformation(p[0], p[1], a, b, s, t))
            //transFunc ??= MM.brokenLineFunction(...transPts.flat())
            transFunc ??= MM.functionTransformation(func, a, b, s, t)
            game.func = func
            /**@type {Plot} plt */
            const plt = new Plot(func, bg)
            game.plt = plt
            plt.pltMore.push({ func: transFunc, color: "red", highlightedPoints: transPts })
            plt.width = 3
            if (reorient) {
                const minX = Math.min(...pts.map(x => x[0]), ...transPts.map(x => x[0]), 1) * 1.2 - 2
                const maxX = Math.max(...pts.map(x => x[0]), ...transPts.map(x => x[0]), -1) * 1.2 + 2
                const minY = Math.min(...pts.map(x => x[1]), ...transPts.map(x => x[1]), 1) * 1.2 - 2
                const maxY = Math.max(...pts.map(x => x[1]), ...transPts.map(x => x[1]), -1) * 1.2 + 2
                game.plotDefaultBounds = { minX, minY, maxX, maxY }
                Object.assign(plt, game.plotDefaultBounds)

            }
            plt.show_border_values_font = "36px Times"
            plt.show_border_values_dp = 2
            plt.show_border_values = false
            plt.highlightedPoints = pts
            plt.highlightedPointsMore = transPts
            plt.axes_width = 2
            plt.label_highlighted = stgs.labelPoints
            plt.label_highlighted_font = "24px Times"
            plt.dottingDistance = 1

            plt.addControls(game.mouser)
            const zoomIn = new Button({ txt: "+", fontsize: 60 })
            const zoomOut = new Button({ txt: "-", fontsize: 60 })
            const zoomReset = new Button({ txt: "@", fontsize: 60 })
            const zoomies = [zoomIn, zoomOut, zoomReset]
            game.add_drawable(zoomies)
            zoomies.forEach(x => {
                x.resize(80, 80)
                x.color = "white"
            })
            zoomOut.leftat(bg.right + 10)
            zoomOut.bottomat(bg.bottom)
            zoomIn.bottomat(zoomOut.top - 10)
            zoomIn.leftat(zoomOut.left)
            zoomReset.leftat(zoomOut.left)
            zoomReset.bottomat(zoomIn.top - 10)
            zoomIn.on_click = () => {
                plt.zoomAtCenter(1.2)
            }
            zoomOut.on_click = () => {
                plt.zoomAtCenter(1 / 1.2)
            }
            zoomReset.on_click = () => {
                Object.assign(plt, game.plotDefaultBounds)
            }
            //plt.density *= 2


            game.add_drawable(bg)
            game.add_drawable(plt)
            ig.move(-50, 0)
            ig.stretch(1.15, 1).move(-10, 0)
            const inputSpaces = ig.copy.move(0, 100).splitRow(1, 6)[0].splitCol(...Array(8).fill(1)).map(Button.fromRect)
            inputSpaces.forEach(x => {
                x.fontsize = 48
                x.stretch(1, .5)
                x.transparent = true
            })
            inputSpaces[0].txt = "y="
            inputSpaces[2].txt = "f("
            inputSpaces[4].txt = "x"
            inputSpaces[6].txt = ")"
            game.add_drawable(inputSpaces)


            const fields = [1, 3, 5, 7].map(i => inputSpaces[i])
            const [bA, bB, bmBS, bT] = fields
            fields.forEach(x => {
                x.color = "lightgray"
                x.transparent = false
                x.outline = 0
                x.stretch(1.4, 1)
                x.selected_color = "lightblue"
                x.hover_color = "purple"
                x.txtRefresh = () => {
                    if (x.numerator == 0) {
                        x.txt = null
                    } else {
                        x.txt = x.fraction ? x.numerator + "/" + (x.denominator) : x.numerator
                        if ((x == bA || x == bB) && x.negative) { x.txt = "-" + x.txt }
                        if (x == bmBS || x == bT) { x.txt = (x.negative ? "-" : "+") + x.txt }
                    }
                    if ((x == bA || x == bB) && x.numerator == 0 && x.negative) { x.txt = "-" }
                    game.checkVictory?.()
                }
                x.reset = function () {
                    this.numerator = 0
                    this.denominator = ""
                    this.fraction = false
                    this.negative = false
                    x.txtRefresh()
                }
                x.reset()
                x.getValue = () => {
                    if (x.numerator == 0 && (x == bA || x == bB)) { return x.negative ? -1 : 1 }
                    return (x.fraction ? x.numerator / x.denominator : x.numerator) * (x.negative ? -1 : 1)
                }
            })
            const radio_group = Button.make_radio(fields, false)
            const addnum = (oldVal, addVal) => {
                if (oldVal == 0 && addVal == 0) { return 0 }
                //const sgn = oldVal >= 0 ? 1 : -1
                //oldVal *= sgn
                return Number(String(oldVal) + String(addVal))
            }
            const toField = function (value) {
                const curr = radio_group.selected
                if (curr.fraction) {
                    curr.denominator = addnum(curr.denominator, value)
                } else {
                    curr.numerator = addnum(curr.numerator, value)
                }
                curr.txtRefresh()
            }
            const inputButtons = ig.
                splitRow(1, 6)[1].
                stretch(.7, .7).
                splitGrid(5, 3).
                flat().map(x => x.deflate(10, 10)).
                map(Button.fromRect)
            game.add_drawable(inputButtons)
            const inputButtonsNumbers = [...inputButtons.slice(0, 9), inputButtons[10]]
            inputButtonsNumbers.forEach((x, i) => {
                x.txt = i + 1
                x.on_click = () => { toField(x.txt) }
            })
            inputButtons.forEach(x => {
                x.fontsize = 48
            })
            inputButtons[10].txt = 0
            inputButtons[10].on_click = () => { toField(0) }
            inputButtons[9].txt = "+"
            inputButtons[9].on_click = () => {
                radio_group.selected.negative = false
                radio_group.selected.txtRefresh()
            }
            inputButtons[11].txt = "-"
            inputButtons[11].on_click = () => {
                radio_group.selected.negative = true
                radio_group.selected.txtRefresh()
            }
            inputButtons[13].txt = "/"
            inputButtons[13].on_click = () => {
                if (radio_group.selected.numerator != 0) {
                    radio_group.selected.fraction = true
                    radio_group.selected.txtRefresh()
                }
            }
            inputButtons[12].txt = "Reset"
            inputButtons[12].on_click = () => { fields.forEach(x => x.reset()) }
            inputButtons[14].txt = "Delete"
            inputButtons[14].on_click = () => { radio_group.selected.reset() }

            const guidance = Button.fromRect(ig.copy.move(0, -50).splitRow(1, 6)[0])
            game.add_drawable(guidance)
            guidance.stretch(1, .7)
            guidance.topat(bg.top)
            guidance.rightat(inputSpaces.at(-1).right)
            guidance.transparent = transFunc
            guidance.txt = "Find the equation of the red curve \nas a function of the black curve y=f(x)."
            guidance.fontsize = 36


            const winCondition = () => {
                const [vA, vB, vmBS, vT] = fields.map(x => x.getValue())
                //console.log(vA, vB, vmBS, vT)
                const byParam = [[vA, a], [vB, b], [vmBS, -b * s], [vT, t]].every(x => Math.abs(x[0] - x[1]) < stgs.tolerance)
                return byParam
                /*
                //if (byParam) { return true }
                if (!stgs.allowVictoryByAlternateValues) { return false }
                const userPts = pts.map(x => MM.pointTransformation(x[0], x[1], vA, vB, -vmBS / vB, vT))
                const byPoints = userPts.flat().map((x, i) =>
                    [x, transPts.flat()[i]]
                ).every(x => Math.abs(x[0]-x[1]) < stgs.tolerance)
                console.log(byPoints)
                return byPoints
                */

            }
            const checkVictory = (forced = false) => {
                if (forced || winCondition()) {
                    GameEffects.fireworksShow()
                    levelSelectButton.color = "lightblue"
                    guidance.txt = "Victory!"
                    if (!stgs.victories.includes(stgs.stage)) {
                        stgs.victories.push(stgs.stage)
                        localStorage.setItem("functionvictories", MM.arrToStr(stgs.victories))
                    }
                }
            }

            game.checkVictory = checkVictory

            const levelSelectButton = Button.fromRect(inputButtons.at(-1).rect)
            levelSelectButton.txt = "Back to level select"
            levelSelectButton.fontsize = 24
            levelSelectButton.width = 250
            levelSelectButton.height = 80
            levelSelectButton.color = "lightgray"
            levelSelectButton.bottomat(bg.bottom)
            levelSelectButton.rightat(inputSpaces.at(-1).right)
            levelSelectButton.on_click = () => { stgs.stage = -1; main() }
            game.add_drawable(levelSelectButton)
            if (stgs.animationsEnabled) {
                /**@param {Button} b @param {Button} tgt*/
                const sendFancy = (b, tgt, time = 500) => {
                    /** @type {Button} cp */
                    const cp = b.copy
                    cp.clickable = false
                    game.add_drawable(cp)
                    this.animator.add_anim(cp, time, "moveTo", {
                        x: tgt.centerX,
                        y: tgt.centerY,
                        on_end: () => { game.remove_drawable(cp) },
                        noLock: true
                    })
                    this.animator.add_anim(cp, time, Anim.f.scaleToFactor, { scaleFactor: .5, noLock: true })
                }
                game.sendFancy = sendFancy
                inputButtons.forEach((b, i) => {
                    if (i != 12) {
                        b.on_click = MM.extFunc(b.on_click, () => sendFancy(b, radio_group.selected))
                    } else {
                        b.on_click = MM.extFunc(b.on_click, () => {
                            radio_group.buttons.forEach(x => sendFancy(b, x))
                        })
                    }
                })
            }
        }
        //#region levelSelector
        const levelSelector = () => {
            if (localStorage.getItem("functionvictories")) {
                stgs.victories = MM.strToArr(localStorage.getItem("functionvictories"))
            }
            const levelButtons = this.rect.copy.
                stretch(.8, .8).
                move(0, 100).
                splitGrid(5, 5).
                flat().map(Button.fromRect).
                slice(0, Object.keys(levels).length)
            const levelInfo = Button.fromRect(this.rect.copy.stretch(.8, .8)).deflate(20, 20)
            levelInfo.height = levelButtons[0].top
            levelInfo.topat(0 + 25)
            levelInfo.txt = "Select level:"
            levelInfo.transparent = true
            levelInfo.fontsize = 48
            levelButtons.forEach((x, i) => {
                x.deflate(20, 20)
                x.txt = i + 1
                x.fontsize = 48
                x.on_click = () => {
                    stgs.stage = i
                    main()
                }
                if (stgs.victories.includes(i)) { x.color = "lightgreen" }
            })
            this.add_drawable(levelButtons)
            this.add_drawable(levelInfo)
            /**@returns {void} */
            const makeRandom = (numberOfTransformations = 1) => {
                const levelMakers = {
                    "Squiggly": makeRandomSquiggly,
                    "Poly": makeRandomPoly,
                    "Trig": makeRandomTrig,
                }
                let maker
                if (typeRadio.selected.txt == "Any") {
                    maker = MM.choice([makeRandomSquiggly, makeRandomPoly, makeRandomTrig])
                } else {
                    maker = levelMakers[typeRadio.selected.txt]
                }
                const levelData = maker(numberOfTransformations)
                stgs.randomLevelData = levelData
                main() // Restart is called here, nowhere else
            }

            const getRandomPoints = (numberOfPoints,
                minStartX = -8, maxStartX = 8, minStartY = -10, maxStartY = 10,
                minDiffX = 1, maxDiffX = 5, minDiffY = -8, maxDiffY = 8) => {
                const xs = [MM.randomInt(minStartX, maxStartX)]
                const ys = [MM.randomInt(minStartY, maxStartY)]
                for (let i = 0; i < numberOfPoints - 1; i++) {
                    xs.push(xs.at(-1) + MM.randomInt(minDiffX, maxDiffX))
                    ys.push(ys.at(-1) + MM.randomInt(minDiffY, maxDiffY))
                }
                return [xs, ys]
            }
            const getRandomTransformABST = (numberOfTransformations) => {
                let [a, b, s, t] = [1, 1, 0, 0]
                const transformOptions = [
                    //stretch in y
                    () => { a *= MM.randomInt(2, 5); a = Math.random() > .7 ? 1 / a : a },
                    //stretch in x
                    () => { b *= MM.randomInt(2, 5); b = Math.random() > .7 ? 1 / b : b },
                    //reflect in y
                    () => { a *= -1 },
                    //reflect in x
                    () => { b *= -1 },
                    //translate
                    () => {
                        s = MM.choice([-10, -8, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 10])
                        t = MM.choice([-10, -8, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 10])
                    }
                ]
                MM.choice(transformOptions, numberOfTransformations).forEach(x => x.call())
                return [a, b, s, t]
            }

            const makeRandomPoly = (numberOfTransformations) => {
                const [xs, ys] = getRandomPoints(MM.choice([3, 4, 4, 4, 5, 5]))
                const [a, b, s, t] = getRandomTransformABST(numberOfTransformations)
                return [MM.lagrange(xs, ys), xs, a, b, s, t]
            }
            const makeRandomTrig = (numberOfTransformations) => {
                let [a, b, s, t] = [1, 1, 0, 0]
                const transformOptions = [
                    () => { a = MM.choice([2, 3, 1 / 2, 1 / 3, 2 / 3, 3 / 2, 4, 1 / 4]) },
                    () => { b = MM.choice([2, 3, 1 / 2, 1 / 3, 2 / 3, 3 / 2, 4, 1 / 4]) },
                    () => { s = MM.choice([PI / 2, PI / 3, PI / 4, -1, 1, -2, 2]) },
                    () => { t = MM.choice([-3, -2, -1, 1, 2, 3]) },
                    () => { a *= -1 },
                    () => { b *= -1 }
                ]
                MM.choice(transformOptions, numberOfTransformations).forEach(x => x.call())
                let [func, xs] = MM.choice([
                    [Math.sin, [-PI / 2, 0, PI / 2, 3 * PI / 2]],
                    [Math.cos, [-PI, 0, PI, TWOPI]],
                    [Math.tan, [666]],
                    [Math.atan, [-PI, 0, PI, TWOPI]],
                    [x => 1 / Math.cos(x), [-PI, 0, PI, TWOPI]],
                    [x => 1 / Math.sin(x), [-PI / 2, PI / 2, 3 * PI / 2, 5 * PI / 2]]
                ])
                if (xs[0] == 666) {
                    if (a != 1) { a = MM.choice([1, 2, 1 / 2]) * Math.sign(a) }
                    if (b != 1) { b = MM.choice([1, 2, 1 / 2]) * Math.sign(b) }
                    xs = [PI / 4, 0, PI / 4, PI]
                }

                return [func, xs, a, b, s, t, true] //reorient
            }
            /**@returns {void} */
            const makeRandomSquiggly = (numberOfTransformations = 1) => {
                const [a, b, s, t] = getRandomTransformABST(numberOfTransformations)
                const [xs, ys] = getRandomPoints(MM.choice([3, 3, 3, 4, 4, 5]))
                return [MM.brokenLineFunction(...xs.map((x, i) => [x, ys[i]]).flat()),
                    xs, a, b, s, t]
            }
            game.makeRandom = makeRandom

            const rBG = new Button({
                color: "pink", x: levelButtons[0].left, width: levelButtons[4].right - levelButtons[0].left
            })
            rBG.bottomat(this.rect.height - 150)
            const rButs = rBG.splitCol(4, 1, 4, 1, 4).filter((_, i) => [0, 2, 4].includes(i)).map(Button.fromRect)
            rButs[0].txt = "Random easy"
            rButs[1].txt = "Random medium"
            rButs[2].txt = "Random hard"
            rButs.forEach(x => {
                x.fontsize = levelButtons[0].fontsize
            })

            this.add_drawable(rButs)
            rButs[0].on_click = () => makeRandom(1)
            rButs[1].on_click = () => makeRandom(MM.choice([2, 2, 3]))
            rButs[2].on_click = () => makeRandom(MM.choice([4, 4, 4, 4, 5]))
            const rInfo = new Button({ txt: "Or generate one:" })
            rInfo.fontsize = levelInfo.fontsize
            rInfo.width = levelInfo.width
            rInfo.leftat(levelInfo.left)
            rInfo.bottomat(rButs[0].top)
            rInfo.move(0, -50)
            rInfo.transparent = true
            this.add_drawable(rInfo)
            rBG.move(0, 120)
            rBG.stretch(.395, .6)
            rBG.rightat(rButs.at(-1).right)
            const rTypes = rBG.splitCol(1.5, 1, 1, 1, 1).map(Button.fromRect)
            rTypes[0].transparent = true
            rTypes.forEach((x, i) => x.txt = ["Type:", "Squiggly", "Poly", "Trig", "Any"][i])
            rTypes.slice(1, 5).forEach(b => b.on_click = function () { stgs.randomType = b.txt })
            const typeRadio = Button.make_radio(rTypes.slice(1, 5), true)
            rTypes.slice(1, 5).find(x => x.txt == stgs.randomType).on_click()
            this.add_drawable(rTypes)

            if (stgs.firstRun && stgs.animationsEnabled) {
                stgs.firstRun = false
                this.animator.add_anim(levelInfo, 1000, Anim.f.typingCentered)
                const everyBody = [...levelButtons, ...rTypes, ...rButs, rInfo]
                everyBody.forEach(x => x.opacity = 1)

                this.animator.add_staggered(levelButtons, 200, Anim.stepper(
                    null, 1000, "opacity", 1, 0, { on_end: function () { this.obj.opacity = 0 } }
                ), { initialDelay: 1000 })
                this.animator.add_staggered([rInfo], 0, new Anim(null, 1000, Anim.f.typingCentered)
                    , { initialDelay: 3000, on_each_start: () => { rInfo.opacity = 0 } })
                this.animator.add_staggered([...rTypes, ...rButs], 0, Anim.stepper(
                    null, 1000, "opacity", 1, 0, { on_end: function () { this.obj.opacity = 0 } }
                ), { initialDelay: 4000 })


            }
        }

        if (stgs.randomLevelData) {
            makeLevel(...stgs.randomLevelData)
            stgs.randomLevelData = null
        }
        else if (stgs.stage == -1) {
            levelSelector()
        } else {
            makeLevel(...levels[stgs.stage])
        }









    }
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    update_more(dt) {







    }
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    draw_more(screen) {









    }
    ///end draw_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                            ^^^^DRAW^^^^                                                      ///
    ///                                                                                                              ///
    ///                                              NEXT_LOOP                                                       ///
    ///start next_loop_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    next_loop_more() {




    }
    ///end next_loop_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                          ^^^^NEXT_LOOP^^^^                                                   ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////



} //this is the last closing brace

//#region dev options
/// dev options
const dev = {

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



