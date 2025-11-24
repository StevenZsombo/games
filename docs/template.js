//should import scripts.js, gui.js, MM.js, animations.js, stgs.js
const framerateUnlocked = false
const dtUpperLimit = 1000 / 30
const denybuttons = false
const showFramerate = false
const imageSmoothingEnabled = true
const imageSmoothingQuality = "high" // options: "low", "medium", "high"
const canvasStyleImageRendering = "smooth"
const fontFile = null//"resources/victoriabold.png" //set to null otherwise
const filesList = null //space-separated //Cropper must be revised

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
        //this.cropper = new Cropper()

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
    //#region initialize_more
    initialize_more() {
        //#region makeLevel
        const makeLevel = (func, ptsX = [], a = 1, b = 1, s = 0, t = 0, reorient = true) => {
            const backGround = Button.fromRect(this.rect.copy.splitCol(5, 4)[0].stretch(.9, .9).shrinkToSquare())
            const inputButtonsBackground = this.rect.copy.splitCol(5, 4)[1].stretch(.9, .9)
            backGround.color = "white"
            backGround.leftat(backGround.left / 2)
            let pts
            if (ptsX) {
                pts = ptsX.map(x => [x, func(x)])
            }
            game.pts = pts
            let transFunc, transPts
            transPts ??= pts.map(p => MM.pointTransformation(p[0], p[1], a, b, s, t))
            //transFunc ??= MM.brokenLineFunction(...transPts.flat())
            transFunc ??= MM.functionTransformation(func, a, b, s, t)
            game.func = func
            /**@type {Plot} plt */
            const plt = new Plot(func, backGround)
            game.plt = plt
            plt.pltMore[0] = { func: transFunc, color: "red", highlightedPoints: transPts }
            plt.width = 3
            if (reorient) {
                /*const minX = Math.min(...pts.map(x => x[0]), ...transPts.map(x => x[0]), 1) * 1.2 - 2
                const maxX = Math.max(...pts.map(x => x[0]), ...transPts.map(x => x[0]), -1) * 1.2 + 2
                const minY = Math.min(...pts.map(x => x[1]), ...transPts.map(x => x[1]), 1) * 1.2 - 2
                const maxY = Math.max(...pts.map(x => x[1]), ...transPts.map(x => x[1]), -1) * 1.2 + 2*/
                plt.minX = 0; plt.maxX = 0; plt.minY = 0; plt.maxY = 0;
                plt.reorient([...pts.map(p => p[0]), ...transPts.map(p => p[0])], [...pts.map(p => p[1]), ...transPts.map(p => p[1])])
                if (stgs.matchedAxesDesired) { plt.matchAxesScaling() }
                game.plotDefaultBounds = { minX: plt.minX, minY: plt.minY, maxX: plt.maxX, maxY: plt.maxY }
                //Object.assign(plt, game.plotDefaultBounds)

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
            const zoomReset = new Button({ txt: "\u21B6", fontsize: 60 })//"@"
            const zoomies = [zoomIn, zoomOut, zoomReset]
            game.add_drawable(zoomies)
            zoomies.forEach(x => {
                x.resize(80, 80)
                x.color = "white"
            })
            zoomOut.leftat(backGround.right + 10)
            zoomOut.bottomat(backGround.bottom)
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
                game.sendFancy(zoomReset, plt.rect)
                //plt.pltMore.splice(1, 1)
            }
            //plt.density *= 2


            game.add_drawable(backGround)
            game.add_drawable(plt)
            inputButtonsBackground.move(-50, 0)
            inputButtonsBackground.stretch(1.15, 1).move(-10, 0)
            const inputSpaces = inputButtonsBackground.copy.move(0, 100).splitRow(1, 6)[0].splitCol(...Array(8).fill(1)).map(Button.fromRect)
            inputSpaces.forEach(x => {
                x.fontsize = 48
                //x.font_color = "blue"
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
                    //game.checkVictory?.() //has been replaced with submit button
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
            const getCurrentField = () => {
                if (game.currentField) {
                    return game.currentField
                } else {
                    return radio_group.selected

                }
            }
            const toField = function (value) {
                const curr = getCurrentField()
                if (curr.fraction) {
                    curr.denominator = addnum(curr.denominator, value)
                } else {
                    curr.numerator = addnum(curr.numerator, value)
                }
                curr.txtRefresh()
            }







            const inputButtons = inputButtonsBackground.copy.
                splitRow(1, 6)[1].
                stretch(.55, .7).
                move(-50, 0).
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
                x.color = "lightblue"
            })
            inputButtons[10].txt = 0
            inputButtons[10].on_click = () => { toField(0) }
            inputButtons[9].txt = "+"
            inputButtons[9].on_click = () => {
                getCurrentField().negative = false
                getCurrentField().txtRefresh()
            }
            inputButtons[11].txt = "-"
            inputButtons[11].on_click = () => {
                getCurrentField().negative = true
                getCurrentField().txtRefresh()
            }
            inputButtons[13].txt = "/"
            inputButtons[13].on_click = () => {
                if (getCurrentField().numerator != 0) {
                    getCurrentField().fraction = true
                    getCurrentField().txtRefresh()
                }
            }
            inputButtons[12].txt = "Reset"
            inputButtons[12].fontsize = 30
            game.fieldsToReset = fields
            const resetButtonFunction = () => {
                game.fieldsToReset.forEach(x => x.reset())
                if (game.fieldsToReset.length == 4) {
                    game.plt.pltMore[2] = undefined
                    game.sendFancy(inputButtons[12], plt.rect)
                }
            }
            inputButtons[12].on_click = () => { resetButtonFunction() }
            inputButtons[14].txt = "Delete"
            inputButtons[14].fontsize = 30
            inputButtons[14].on_click = () => { getCurrentField().reset() }

            const guidance = Button.fromRect(inputButtonsBackground.copy.move(0, -50).splitRow(1, 6)[0])
            game.add_drawable(guidance)
            guidance.stretch(1, .7)
            guidance.topat(backGround.top)
            guidance.rightat(inputSpaces.at(-1).right)
            guidance.transparent = transFunc
            guidance.txt_default = "Find the equation of the red curve \nas a function of the black curve y=f(x)."
            guidance.txt = guidance.txt_default
            guidance.fontsize = 36



            const winCondition = function (checkfor = "blue") {
                if (checkfor == "blue") {
                    const [vA, vB, vmBS, vT] = fields.map(x => x.getValue())
                    const byParam = [[vA, a], [vB, b], [vmBS, -b * s], [vT, t]].every(x => Math.abs(x[0] - x[1]) < stgs.tolerance)
                    return byParam
                }
                if (checkfor == "green") {
                    const byPoints = greenCurve.highlightedPoints.flat().map((x, i) =>
                        [x, transPts.flat()[i]]
                    ).every(x => Math.abs(x[0] - x[1]) < stgs.tolerance)
                    return byPoints
                }
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
            game.hasWonAlready = false
            game.isFirstAttempt = true
            const checkVictory = (forced = false) => {
                if (game.hasWonAlready) { return }
                if (forced || winCondition()) {
                    GameEffects.fireworksShow()
                    game.hasWonAlready = true
                    levelSelectButton.color = "lightblue"
                    guidance.txt = "Victory!"
                    if (!stgs.victories.includes(stgs.stage)) {
                        stgs.victories.push(stgs.stage)
                        localStorage.setItem("functionvictories", MM.arrToStr(stgs.victories))
                    }
                    return true
                }
                return false
            }

            game.checkVictory = checkVictory

            const levelSelectButton = Button.fromRect(inputButtons.at(-1).rect)
            levelSelectButton.txt = "Back to level select"
            levelSelectButton.fontsize = 24
            levelSelectButton.width = 250
            levelSelectButton.height = 80
            levelSelectButton.color = "lightgray"
            levelSelectButton.bottomat(backGround.bottom)
            levelSelectButton.rightat(inputSpaces.at(-1).right)
            levelSelectButton.on_click = () => { stgs.stage = -1; main() }
            game.add_drawable(levelSelectButton)
            if (stgs.animationsEnabled) {
                /**@param {Button} b @param {Button} tgt*/
                const sendFancy = (b, tgt, time = stgs.sendFancyTime) => {
                    /** @type {Button} cp */
                    const cp = b.copy
                    cp.clickable = false
                    game.add_drawable(cp)
                    this.animator.add_anim(cp, time, "moveTo", {
                        x: tgt.centerX - cp.width / 4,
                        y: tgt.centerY - cp.height / 4,
                        on_end: () => { game.remove_drawable(cp) },
                        noLock: true
                    })
                    this.animator.add_anim(cp, time, Anim.f.scaleToFactor, { scaleFactor: .5, noLock: true })
                    this.animator.add_anim(Anim.stepper(cp, time, "fontsize", cp.fontsize, cp.fontsize / 2, { noLock: true }))
                }
                game.sendFancy = sendFancy
                inputButtons.forEach((b, i) => {
                    if (i != 12) {
                        b.on_click = MM.extFunc(b.on_click, () => sendFancy(b, getCurrentField()))
                    } else {
                        b.on_click = MM.extFunc(b.on_click, () => {
                            game.fieldsToReset.forEach(x => sendFancy(b, x))
                        })
                    }
                })
            }
            const getStringFromCoeffs = (a, b, s, t) => {
                return `y=${a == 1 ? "" : a}f(${b == 1 ? "" : b}x${-b * s > 0 ? "+" : ""}${-b * s != 0 ? -b * s : ""})${t > 0 ? "+" : ""}${t != 0 ? t : ""}`
            }
            //adds game.solution

            game.solution = getStringFromCoeffs(a, b, s, t)


            const submitButton = new Button()
            this.add_drawable(submitButton)
            submitButton.leftat(inputButtons[0].left)
            submitButton.rightstretchat(inputButtons[1].right)
            submitButton.topat(levelSelectButton.top)
            submitButton.bottomstretchat(levelSelectButton.bottom)
            submitButton.centerat(inputButtons[1].centerX, submitButton.centerY)
            submitButton.txt = "Submit"
            submitButton.fontsize = inputButtons[0].fontsize
            submitButton.color = "lightblue"
            levelSelectButton.deg = -90
            levelSelectButton.centerat(fields.at(-1).right, submitButton.bottom)
            levelSelectButton.move(-levelSelectButton.height / 2, -levelSelectButton.width / 2)
            const plotTheirInput = () => {
                const [vA, vB, vmBS, vT] = fields.map(x => x.getValue())
                plt.pltMore[2] = {
                    color: "blue",
                    func: MM.functionTransformation(func, vA, vB, -vmBS / vB, vT),
                    highlightedPoints: pts.map(p => MM.pointTransformation(p[0], p[1], vA, vB, -vmBS / vB, vT))
                }
            }


            const plotTheirInputAnimated = (callback) => {
                if (stgs.animationsEnabled) {
                    submitButton.color = "blue"
                    fields.forEach(b => b.color = "blue")
                    fields.forEach(b => b.selected_color = "blue")
                    submitButton.clickable = false
                    this.animator.add_staggered([...fields, new Button], 200,
                        new Anim(null, 0, Anim.f.delay, {
                            on_end: function () { game.sendFancy(this.obj, backGround) }
                        })
                        , {
                            on_final: () => {
                                const [vA, vB, vmBS, vT] = fields.map(x => x.getValue())
                                const [toA, toB, toS, toT] = [vA, 1 / vB, -vmBS / vB, vT]
                                plt.pltMore[2] = {
                                    func: func,
                                    color: "blue",
                                    highlightedPoints: pts
                                }
                                const targetCurve = plt.pltMore[2]
                                const origF = func
                                const origP = pts

                                game.animator.add_sequence(
                                    //new Anim(null, stgs.transformSendFancyTime, "delay"),
                                    Anim.custom(targetCurve, stgs.transformAnimationTime, (t) => {
                                        const A = Anim.interpol(1, toA, t)
                                        const B = 1 / Anim.interpol(1, toB, t)
                                        const S = Anim.interpol(0, toS, t)
                                        const T = Anim.interpol(0, toT, t)
                                        targetCurve.func = MM.functionTransformation(origF, A, B, S, T)
                                        targetCurve.highlightedPoints = origP.map(
                                            p => MM.pointTransformation(p[0], p[1], A, B, S, T))
                                    }, null, {
                                        on_end: () => {
                                            bTransforms.forEach(x => x.interactable = true)
                                            targetCurve.func = MM.functionTransformation(origF, toA, 1 / toB, toS, toT)
                                            targetCurve.highlightedPoints = origP.map(
                                                p => MM.pointTransformation(p[0], p[1], toA, 1 / toB, toS, toT))

                                            submitButton.color = "lightblue"
                                            fields.forEach(b => b.color = "lightgray")
                                            fields.forEach(b => b.selected_color = "lightblue")
                                            getCurrentField()?.selected?.on_click?.()
                                            submitButton.clickable = true
                                            callback?.()
                                        }
                                    }))
                            }
                        })
                }
                else { plotTheirInput() }
            }


            submitButton.on_click = () => {
                //resetTransformButtons()
                if (plt.pltMore[2]) { plt.pltMore[2] = undefined }
                const win = winCondition()
                if (win) { //victory
                    plotTheirInputAnimated(checkVictory)
                } else {//loss
                    game.isFirstAttempt = false
                }
                if ((!win) && (!game.isFirstAttempt)) { plotTheirInputAnimated() }

            }

            const bStretch = new Button()
            const bReflect = new Button()
            const bTranslate = new Button()
            const bTransforms = [bStretch, bReflect, bTranslate]
            bTransforms.forEach((b, i) => {
                b.leftat(inputButtons[2].right + 50)
                b.width = 200
                b.height = submitButton.height
                b.txt = "Stretch Reflect Translate".split(" ")[i]
                b.fontsize = inputButtons[0].fontsize
                b.color = "lightgreen"
            })
            game.add_drawable(bTransforms)
            bStretch.centerat(bStretch.centerX, (inputButtons[0].bottom + inputButtons[3].top) / 2)
            bReflect.centerat(bStretch.centerX, (inputButtons[3].bottom + inputButtons[6].top) / 2)
            bTranslate.centerat(bStretch.centerX, (inputButtons[6].bottom + inputButtons[9].top) / 2)
            const bTransformReset = new Button()
            bTransformReset.resize(zoomReset.width, zoomReset.height)
            bTransformReset.leftat(bTranslate.left)
            bTransformReset.topat(bTranslate.top)
            bTransformReset.move(0, bTranslate.top - bReflect.top)
            game.add_drawable(bTransformReset)
            bTransformReset.color = "lightgreen"
            bTransformReset.txt = "\u21B6" //"@"
            bTransformReset.fontsize = zoomReset.fontsize
            bTransforms.push(bTransformReset)

            guidance.transparent = false
            guidance.color = null
            guidance.outline = 0
            guidance.stretch(1, 1.2)

            const greenCurve = {}
            const greenCurveHistory = []
            const greenCurveReset = () => {
                if (greenCurveHistory.length > 1) {
                    greenCurveHistory.pop()
                    const previous = greenCurveHistory.at(-1)
                    greenCurve.func = previous.func
                    greenCurve.highlightedPoints = previous.highlightedPoints
                    greenCurve.color = previous.color

                } else {
                    plt.pltMore[1] = undefined
                    greenCurve.func = game.func
                    greenCurve.highlightedPoints = game.pts
                    greenCurve.color = "green"
                    greenCurveHistory.pop()
                }
            }
            game.greenCurveReset = greenCurveReset
            game.greenCurveHistory = greenCurveHistory
            greenCurveReset()
            bTransformReset.on_click = () => {
                const isResettingNotUndoing = bTransformReset.color == "gray"
                resetTransformButtons()
                if (isResettingNotUndoing) {
                    game.sendFancy(bTransformReset, guidance)
                    if (greenCurveHistory.length == 0) {
                        plt.pltMore[1] = undefined
                    }
                } else {
                    game.sendFancy(bTransformReset, plt.rect)
                    greenCurveReset()

                }

            }

            const animatedTransform = (toA, toB, toS, toT, message = null, targetCurve = greenCurve) => {
                bTransforms.forEach(x => x.interactable = false)
                game.tempdrawies.forEach(x => x.interactable = false)
                const origF = targetCurve.func
                const origP = targetCurve.highlightedPoints
                const greenCopy = guidance.copy
                greenCopy.fontsize = 30
                greenCopy.color = "lightgreen"
                greenCopy.txt = message
                game.sendFancy(greenCopy, plt.rect, stgs.transformSendFancyTime)
                this.animator.add_sequence(
                    new Anim(null, stgs.transformSendFancyTime, "delay"),
                    Anim.custom(targetCurve, stgs.transformAnimationTime, (t) => {
                        const A = Anim.interpol(1, toA, t)
                        const B = 1 / Anim.interpol(1, toB, t)
                        const S = Anim.interpol(0, toS, t)
                        const T = Anim.interpol(0, toT, t)
                        targetCurve.func = MM.functionTransformation(origF, A, B, S, T)
                        targetCurve.highlightedPoints = origP.map(
                            p => MM.pointTransformation(p[0], p[1], A, B, S, T))
                    }, null, {
                        on_end: () => {
                            bTransforms.forEach(x => x.interactable = true)
                            targetCurve.func = MM.functionTransformation(origF, toA, 1 / toB, toS, toT)
                            targetCurve.highlightedPoints = origP.map(
                                p => MM.pointTransformation(p[0], p[1], toA, 1 / toB, toS, toT))
                            resetTransformButtons()
                            greenCurveHistory.push({ ...targetCurve })
                        }
                    }))
            }

            game.tempdrawies = []
            const resetTransformButtons = (drawies) => {
                drawies ??= game.tempdrawies
                game.tempdrawies = []
                drawies.forEach(x => game.remove_drawable(x))
                bTransforms.forEach(x => x.color = "lightgreen")
                plt.pltMore[1] = greenCurve
                if (game.currentField) {
                    game.currentField = null
                    radio_group.selected = game.previousField
                    game.fieldsToReset = fields
                    game.previousField.on_click()
                    radio_group.buttons.forEach(x => x.interactable = true)
                }
            }
            game.resetTransformButtons = resetTransformButtons

            //#region bStretch
            bStretch.on_click = () => {
                resetTransformButtons()
                bTransforms.forEach(x => x.color = "gray")
                bStretch.color = "lightgreen"
                game.sendFancy(bStretch, guidance)
                const panel = guidance.splitCol(.5, 2, 2, 2, 2, 1).map(Button.fromRect)
                panel[1].txt = "Stretch..."
                const [up, down] = panel[2].splitRow(1, 1).map(Button.fromRect)
                const drawies = [up, down, ...panel]
                drawies.forEach(b => {
                    b.color = "lightgreen"
                    b.outline = 0
                    b.fontsize = 30
                })
                up.txt = "in x-direction"
                down.txt = "in y-direction"
                up.outline = 3
                down.outline = 3
                up.hover_color = "purple"
                down.hover_color = "purple"

                game.add_drawable(drawies)
                game.remove_drawable(up)
                game.remove_drawable(down)
                game.add_drawable(up, 6)
                game.add_drawable(down, 6)
                game.tempdrawies.push(...drawies)

                const buildScaleFactorField = (direction) => {
                    panel[2].txt = `in ${direction} direction`
                    panel[2].visible = true
                    this.remove_drawable(up)
                    this.remove_drawable(down)
                    panel[3].txt = "by scale factor"
                    const field = new Button()
                    field.centeratV(panel[4].center)
                    game.tempdrawies.push(field)
                    game.add_drawable(field)
                    field.resize(fields[0].width, fields[0].height)
                    field.fontsize = fields[0].fontsize
                    field.outline = 0
                    field.color = "lightblue"
                    field.fraction = false
                    field.negative = false
                    field.numerator = 0
                    field.denominator = 0
                    game.currentField = field
                    game.previousField = radio_group.selected
                    game.fieldsToReset = [field]
                    radio_group.selected.selected = false
                    radio_group.selected = null
                    radio_group.buttons.forEach(x => x.interactable = false)

                    field.txtRefresh = () => {
                        if (field.numerator == 0) {
                            field.txt = null
                        } else {
                            field.txt = field.fraction ? field.numerator + "/" + (field.denominator) : field.numerator
                        }

                    }
                    field.reset = function () {
                        this.numerator = 0
                        this.denominator = ""
                        this.fraction = false
                        this.negative = false
                        field.txtRefresh()
                    }
                    field.reset()
                    field.getValue = () => {
                        if (x.numerator == 0 && (x == bA || x == bB)) { return x.negative ? -1 : 1 }
                        return (x.fraction ? x.numerator / x.denominator : x.numerator) * (x.negative ? -1 : 1)
                    }

                    const ok = new Button()
                    ok.centeratV(panel[5].center)
                    ok.resize(panel[5].height * .5, panel[5].height * .5)
                    ok.txt = "OK"
                    ok.hover_color = "purple"
                    ok.on_click = () => {
                        const num = field.numerator
                        const den = field.denominator != 0 ? field.denominator : 1
                        let val = num / den
                        if (val == 0) { val = 1 }
                        let [a, b] = [1, 1]
                        if (direction == "y") { a = val }
                        if (direction == "x") { b = val }
                        /*greenCurve.func = MM.functionTransformation(greenCurve.func, a, b, 0, 0)
                        greenCurve.highlightedPoints = greenCurve.highlightedPoints.map(
                            p => MM.pointTransformation(p[0], p[1], a, b, 0, 0))
                            */
                        animatedTransform(a, b, 0, 0,
                            `Strech in the ${direction} direction by scale factor ${field.txt}`
                        )
                        //resetTransformButtons()
                    }
                    game.tempdrawies.push(ok)
                    game.add_drawable(ok)

                }
                up.on_click = () => {
                    buildScaleFactorField("x")
                }

                down.on_click = () => {
                    buildScaleFactorField("y")

                }

            }

            bReflect.on_click = () => {
                resetTransformButtons()
                //guidance.color = "lightgreen"
                bTransforms.forEach(x => x.color = "gray")
                bReflect.color = "lightgreen"
                game.sendFancy(bReflect, guidance)
                const panel = guidance.splitCol(1, 2, 2, 1).map(Button.fromRect)
                panel[1].txt = "Reflect..."
                const [up, down] = panel[2].splitRow(1, 1).map(Button.fromRect)
                const drawies = [panel[0], panel[1], panel[3], up, down]
                drawies.forEach(b => {
                    b.color = "lightgreen"
                    b.outline = 0
                    b.fontsize = submitButton.fontsize//30
                })
                up.txt = "in x-axis"
                down.txt = "in y-axis"
                up.outline = 3
                down.outline = 3
                up.hover_color = "purple"
                down.hover_color = "purple"

                up.on_click = () => {
                    /*resetTransformButtons()
                    greenCurve.func = MM.functionTransformation(greenCurve.func, -1, 1, 0, 0)
                    greenCurve.highlightedPoints = greenCurve.highlightedPoints.map(
                        p => MM.pointTransformation(p[0], p[1], -1, 1, 0, 0))*/
                    animatedTransform(-1, 1, 0, 0, "Reflect in the x-axis.")

                }
                down.on_click = () => {
                    animatedTransform(1, -1, 0, 0, "Reflect in the y-axis.")
                    /*resetTransformButtons()
                    greenCurve.func = MM.functionTransformation(greenCurve.func, 1, -1, 0, 0)
                    greenCurve.highlightedPoints = greenCurve.highlightedPoints.map(
                        p => MM.pointTransformation(p[0], p[1], 1, -1, 0, 0))*/
                }
                game.tempdrawies.push(...drawies)
                this.add_drawable(drawies)
            }

            bTranslate.on_click = () => {
                resetTransformButtons()
                bTransforms.forEach(x => x.color = "gray")
                bTranslate.color = "lightgreen"
                game.sendFancy(bTranslate, guidance)
                const panel = guidance.splitCol(.25, 2, .25, 1, .25, 1, .25, .5, .25).map(Button.fromRect)
                panel[1].txt = "Translate by vector"
                const drawies = [...panel]
                drawies.forEach(b => {
                    b.color = "lightgreen"
                    b.outline = 0
                    b.fontsize = 30
                })

                game.add_drawable(drawies)
                game.tempdrawies.push(...drawies)


                const STf = [new Button(), new Button()]
                STf.forEach(field => {
                    game.tempdrawies.push(field)
                    game.add_drawable(field)
                    field.resize(fields[0].width, fields[0].height)
                    field.outline = 0
                    field.color = "lightgray"
                    field.hover_color = "purple"
                    field.selected_color = "lightblue"
                    field.hover_selected_color = null
                    field.fraction = false
                    field.negative = false
                    field.numerator = 0
                    field.denominator = 0
                    field.fontsize = fields[0].fontsize
                })
                panel[2].txt = "("
                STf[0].centeratV(panel[3].center)
                panel[4].txt = ","
                STf[1].centeratV(panel[5].center)
                panel[6].txt = ")"

                game.currentField = STf[0]
                game.previousField = radio_group.selected
                game.fieldsToReset = STf
                radio_group.selected.selected = false
                radio_group.selected = null
                radio_group.buttons.forEach(x => x.interactable = false)
                STf[0].on_click = () => {
                    game.currentField = STf[0]
                }
                STf[1].on_click = () => {
                    game.currentField = STf[1]
                }

                const STfradio = Button.make_radio(STf, true)

                STf.forEach(field => {
                    field.txtRefresh = (first) => {
                        if (!first) { field.untouched = false }
                        if (field.numerator == 0) {
                            field.txt = field.untouched ? null : "0"
                        } else {
                            field.txt = field.fraction ? field.numerator + "/" + (field.denominator) : field.numerator
                            if (field.negative) { field.txt = `-${field.txt}` }
                        }

                    }
                    field.reset = function () {
                        this.numerator = 0
                        this.denominator = ""
                        this.fraction = false
                        this.negative = false
                        field.untouched = true
                        field.txtRefresh(true)
                    }

                    field.reset()
                    field.getValue = () => {
                        return (field.fraction ? field.numerator / field.denominator : field.numerator) * (field.negative ? -1 : 1)
                    }
                })

                const ok = new Button()
                ok.centeratV(panel.at(-2).center)
                ok.resize(panel.at(-2).height * .5, panel.at(-2).height * .5)
                ok.txt = "OK"
                ok.hover_color = "purple"
                ok.on_click = () => {
                    if (STf[0].denominator == 0) { STf[0].denominator = 1 }
                    const s = (STf[0].numerator / STf[0].denominator) * (STf[0].negative ? -1 : 1)
                    if (STf[1].denominator == 0) { STf[1].denominator = 1 }
                    const t = (STf[1].numerator / STf[1].denominator) * (STf[1].negative ? -1 : 1)
                    /*greenCurve.func = MM.functionTransformation(greenCurve.func, 1, 1, s, t)
                    greenCurve.highlightedPoints = greenCurve.highlightedPoints.map(
                        p => MM.pointTransformation(p[0], p[1], 1, 1, s, t))
                    resetTransformButtons()*/
                    animatedTransform(1, 1, s, t, `Translate by vector (${STf[0].txt},${STf[1].txt}).`)
                }
                game.tempdrawies.push(ok)
                game.add_drawable(ok)

            }













        }
        //#endregion
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

            const compressionsFix = (func, xs, a, b, s, t) => {
                if (!stgs.compressionsFixDesired) { return [func, xs, a, b, s, t] }
                if (-1 < a && a < 1) { func = MM.functionTransformation(game.func, Math.abs(1 / a), 1, 0, 0) }
                if (b < -1 || b > 1) {
                    func = MM.functionTransformation(func, 1, Math.abs(1 / b), 0, 0)
                    xs = xs.map(x => Math.abs(b) * x)
                    //s = Math.abs(b) * s
                }
                return [func, xs, a, b, s, t]
            }
            /**@returns {void} */
            const makeRandom = (numberOfTransformations = 1) => {
                const levelMakers = {
                    "Squiggly": makeRandomSquiggly,
                    "Poly": makeRandomPoly,
                    "Trig": makeRandomTrig,
                }
                let maker
                if (typeRadio.selected.txt == "Any") {
                    maker = MM.choice([
                        makeRandomSquiggly, makeRandomSquiggly, makeRandomPoly, makeRandomPoly, makeRandomTrig
                    ])
                } else {
                    maker = levelMakers[typeRadio.selected.txt]
                }
                let levelData = maker(numberOfTransformations)
                stgs.randomLevelData = levelData
                main() // Restart is called here, nowhere else
            }

            const getRandomPoints = (numberOfPoints,
                {
                    minStartX = -8, maxStartX = 8,
                    minStartY = -10, maxStartY = 10,
                    minDiffX = 1, maxDiffX = 5,
                    minDiffY = -8, maxDiffY = 8
                } = {}) => {
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
                    () => { a *= MM.randomInt(2, 5); a = Math.random() > .6 ? 1 / a : a },
                    //stretch in x
                    () => { b *= MM.randomInt(2, 5); b = Math.random() > .6 ? 1 / b : b },
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
                const [xs, ys] = getRandomPoints(MM.choice([3, 4, 4, 4, 5, 5]),
                    { minDiffX: 2, minDiffY: -4, maxDiffY: 4 })
                const [a, b, s, t] = getRandomTransformABST(numberOfTransformations)
                if (xs.length == 3 && xs[1] - xs[0] == xs[2] - xs[1] && ys[1] - ys[0] == ys[2] - ys[1]) {
                    xs[2] = xs[2] + 1
                }
                const levelData = [MM.lagrange(xs, ys), xs, a, b, s, t]
                return compressionsFix(...levelData)
            }
            const makeRandomTrig = (numberOfTransformations) => {
                let [a, b, s, t] = [1, 1, 0, 0]
                const transformOptions = [
                    () => { a = MM.choice([2, 3, 1 / 2, 1 / 3, 2 / 3, 3 / 2, 4, 1 / 4]) },
                    () => { b = MM.choice([2, 3, 1 / 2, 1 / 3, 2 / 3, 3 / 2, 4, 1 / 4]) },
                    () => { s = MM.choice([PI / 4, PI / 3, - 1, 1, -2, 2]) },
                    () => { t = MM.choice([-3, -2, -1, 1, 2, 3]) },
                    () => { a *= -1 },
                    () => { b *= -1 }
                ]
                MM.choice(transformOptions, numberOfTransformations).forEach(x => x.call())
                let [func, xs] = MM.choice([
                    [Math.sin, [0, PI / 2, PI, 3 * PI / 2]],
                    [Math.sin, [0, PI / 2, PI, 3 * PI / 2]],
                    [Math.cos, [-PI, 0, PI, TWOPI]],
                    [Math.cos, [-PI, 0, PI, TWOPI]],
                    [Math.tan, [666]],
                    [Math.tan, [666]],
                    //[Math.atan, [-PI, 0, PI, TWOPI]],
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
            const makeRandomSquiggly = (numberOfTransformations = 1) => {
                let [a, b, s, t] = getRandomTransformABST(numberOfTransformations)
                if (Math.abs(a) != 1 && Math.random() < .1) { a = MM.choice([3 / 2, 3 / 2, 5 / 2]) * Math.sign(a) }
                if (Math.abs(b) != 1 && Math.random() < .1) { b = MM.choice([3 / 2, 3 / 2, 5 / 2]) * Math.sign(b) }
                const [xs, ys] = getRandomPoints(MM.choice([4, 4, 4, 5, 5, 6]))
                const levelData = [MM.brokenLineFunction(...xs.map((x, i) => [x, ys[i]]).flat()),
                    xs, a, b, s, t]
                return compressionsFix(...levelData)
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
            const rInfo = new Button()
            rInfo.txt = "Or generate one:"
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

            let changelogButton = new Button()
            changelogButton.width = rTypes.at(-1).width
            changelogButton.height = rTypes.at(-1).height
            this.add_drawable(changelogButton)
            changelogButton.bottomat(rTypes.at(-1).bottom)
            changelogButton.leftat(rButs[0].left)
            changelogButton.on_click = () => stgs.changelog.split("$").forEach(x => setTimeout(() => alert(x), 100))
            changelogButton.fontsize = 16
            changelogButton.txt = "Changelog"


            if (stgs.firstRun && stgs.animationsEnabled) {
                stgs.firstRun = false
                this.animator.add_anim(levelInfo, 1000, Anim.f.typingCentered)
                const everyBody = [...levelButtons, ...rTypes, ...rButs, rInfo, changelogButton]
                everyBody.forEach(x => x.opacity = 1)

                this.animator.add_staggered(levelButtons, 200, Anim.stepper(
                    null, 1000, "opacity", 1, 0, { on_end: function () { this.obj.opacity = 0 } }
                ), { initialDelay: 1000 })
                this.animator.add_staggered([rInfo], 0, new Anim(null, 1000, Anim.f.typingCentered)
                    , { initialDelay: 3000, on_each_start: () => { rInfo.opacity = 0 } })
                this.animator.add_staggered([...rTypes, ...rButs, changelogButton], 0, Anim.stepper(
                    null, 1000, "opacity", 1, 0, { on_end: function () { this.obj.opacity = 0 } }
                ), { initialDelay: 4000 })


            }


            //game.layers.flat().forEach(b => b = Button.make_circle(b))
        }
        //#endregion
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
    get solution() { return game.solution },
    /** @param {boolean} torf */
    set animations(torf) { stgs.animationsEnabled = torf },
    set func(callable) {
        game.func = callable
        game.plt.func = callable
        game.plt.highlightedPoints = []
        game.plt.pltMore = []
        dev.highlightedPointsX = []
        game.greenCurveReset()
        game.resetTransformButtons()

    },
    set highlightedPointsX(arrayX) {
        const pts = arrayX.map(x => [x, game.plt.func(x)])
        game.plt.highlightedPoints = pts
        game.pts = pts
    }


}/// end of dev
//#endregion

/**@type {HTMLImageElement[]} */
const files = {}


/**@type {customFont} */
//const myFont = new customFont()
//*@type {Cropper}*/
//const cropper = new Cropper()

/** @type {Game}*/
var game



