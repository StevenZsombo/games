var univ = {
    isOnline: true,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 30,
    denybuttons: false,
    showFramerate: false,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "smooth",
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    filesList: "", //space-separated
    on_each_start: () => {
        /*if (contest.isActive) {
            game.isAcceptingInputs = true
        } else {
            game.isAcceptingInputs = false
            const waitingForContestStart = setInterval(
                () => {
                    if (contest.isActive) {
                        game.isAcceptingInputs = true
                        clearInterval(waitingForContestStart)
                    }
                }
                , 200)
        }*/ //crappy logic
    },
    on_first_run: () => {
        //chat.sendSecure({ inquire: "contest.isActive" })
        //chat.inquire("contest.isActive", true)
    },
    on_next_game: null,
    stgs: stgs
}

class Game extends GameCore {
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



        this.leaderboard = []

        this.showRules = () => {
            const t = `You gain points for winning in the game.
            
            Winning on easy gives you ${stgs.scoreForFirstTry.easy} point.

            First submit on medium: ${stgs.scoreForFirstTry.medium} points.
            More than one submit on medium: ${stgs.scoreForNonFirstTry.medium} points.
            First submit on hard: ${stgs.scoreForFirstTry.hard} points.
            More than one submit on hard: ${stgs.scoreForNonFirstTry.hard} points.
            
            Using the green buttons to move the green curve does NOT cost you any points,
            so feel free to experiment.

            The contest will begin shortly. Good luck and have fun!`
            game.isAcceptingInputs = false
            GameEffects.popup(t,
                {
                    posFrac: [.5, .5], sizeFrac: [.9, .9], moreButtonSettings: { color: "lightblue" },
                    travelTime: 1000, floatTime: stgs.showRulesTimeSeconds * 1000, on_end: () => { game.isAcceptingInputs = true }
                })

        }

        //#region makeLevel
        const makeLevel = (funcData, ptsX = [], a = 1, b = 1, s = 0, t = 0, reorient = true) => {
            game.levelData = [funcData, ptsX, a, b, s, t]
            let func
            if (typeof funcData === "function") {
                !stgs.isOnline && console.error("outdated structure, funcData should be provided instead of a function")
                func = funcData
            } else {
                if (funcData.type === "squiggly") {
                    const { xs, ys } = funcData
                    func = MM.brokenLineFunction(...xs.map((x, i) => [x, ys[i]]).flat())
                } else if (funcData.type === "trig") {
                    func = TRIGFUNCTIONS[funcData.chosenFunctionIndex][0]
                } else if (funcData.type === "poly") {
                    const { xs, ys } = funcData
                    func = MM.lagrange(xs, ys)
                }
                chat?.sendSecure({ level: [funcData, ptsX, a, b, s, t] })
            }
            //stgs.randomLevelData = null
            stgs.stage = -1
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
            plt.axes_width = 3
            plt.label_highlighted = stgs.labelPoints
            plt.label_highlighted_font = "30px Times"
            plt.show_axes_labels = false
            plt.show_grid = true
            if (funcData.type === "trig") {
                plt.dottingDistance = [PI / 2, 1]
            }


            plt.addControls(game.mouser)
            const zoomIn = new Button({ txt: "+", fontSize: 60 })
            const zoomOut = new Button({ txt: "-", fontSize: 60 })
            const zoomReset = new Button({ txt: "\u21B6", fontSize: 60 })//"@"
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
                x.fontSize = 48
                //x.font_color = "blue"
                x.stretch(1, .5)
                x.transparent = true
            })
            inputSpaces[0].txt = "y="
            inputSpaces[2].txt = "f("
            inputSpaces[4].txt = "x"
            inputSpaces[6].txt = ")"
            game.add_drawable(inputSpaces)



            const fields = [1, 3, 5, 7].map(i => inputSpaces[i]).map(x => new Field(x))
            fields[0].defaultValue = 1
            fields[1].defaultValue = 1
            fields[0].isACoefficient = true
            fields[1].isACoefficient = true
            fields[2].isATerm = true
            fields[3].isATerm = true
            fields.forEach(field => field.stretch(1.4, 1))
            const board = new InputBoard(inputButtonsBackground, fields, { animationTime: stgs.sendFancyTime })
            board.on_reset = () => {
                if (!greenCurrentlyInteracting) {
                    if (plt.pltMore[2]) { plt.pltMore[2] = undefined }
                    GameEffects.sendFancy(board.inputButtons[12], plt.rect)
                }
            }
            const inputButtons = board.inputButtons
            this.add_drawable(board.fields)
            this.add_drawable(board.inputButtons)
            /**@type {typeof game &  {board: InputBoard}} */
            game.board = board


            const guidance = Button.fromRect(inputButtonsBackground.copy.move(0, -50).splitRow(1, 6)[0])
            game.add_drawable(guidance)
            guidance.stretch(1, .7)
            guidance.topat(backGround.top)
            guidance.rightat(inputSpaces.at(-1).right)
            guidance.transparent = transFunc
            guidance.txt_default = "Find the equation of the red curve \nas a function of the black curve y=f(x)."
            guidance.txt = guidance.txt_default
            guidance.fontSize = 36



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

            const announceVictory = () => {
                const score = game.isFirstAttempt ? stgs.scoreForFirstTry[stgs.difficulty] : stgs.scoreForNonFirstTry[stgs.difficulty]
                chat?.sendSecure({ victory: score })
                stgs.difficulty = "other"
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
                    announceVictory()
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
            game.levelSelectButton = levelSelectButton
            levelSelectButton.fontSize = 24
            levelSelectButton.width = 250
            levelSelectButton.height = 80
            levelSelectButton.color = "lightgray"
            levelSelectButton.bottomat(backGround.bottom)
            levelSelectButton.rightat(inputSpaces.at(-1).right)
            levelSelectButton.on_click = () => { stgs.stage = -1; stgs.randomLevelData = null; main() }
            game.add_drawable(levelSelectButton)
            if (stgs.animationsEnabled) {
                /**@param {Button} b @param {Button} tgt*/
                const sendFancy = (b, tgt, time = stgs.sendFancyTime) => {
                    GameEffects.sendFancy(b, tgt, time)
                }

                game.sendFancy = sendFancy

            }
            const getStringFromCoeffs = (a, b, s, t) => {
                return `y=${a == 1 ? "" : a}f(${b == 1 ? "" : b}x${-b * s > 0 ? "+" : ""}${-b * s != 0 ? -b * s : ""})${t > 0 ? "+" : ""}${t != 0 ? t : ""}`
            }
            //adds game.solution

            game.solution = getStringFromCoeffs(a, b, s, t)


            const submitButton = new Button()
            game.OKavailable = null
            game.submitButton = submitButton
            this.add_drawable(submitButton)
            submitButton.leftat(inputButtons[0].left)
            submitButton.rightstretchat(inputButtons[1].right)
            submitButton.topat(levelSelectButton.top)
            submitButton.bottomstretchat(levelSelectButton.bottom)
            submitButton.centerat(inputButtons[1].centerX, submitButton.centerY)
            submitButton.txt = "Submit"
            submitButton.fontSize = inputButtons[0].fontSize
            submitButton.color = "lightblue"
            levelSelectButton.deg = -90
            levelSelectButton.centerat(fields.at(-1).right, submitButton.bottom)
            levelSelectButton.move(-levelSelectButton.height / 2, -levelSelectButton.width / 2)
            const plotTheirInput = () => {
                const [vA, vB, vmBS, vT] = fields.map(x => x.getValue())
                plt.pltMore[2] = {
                    color: "blue",
                    func: MM.functionTransformation(game.func, vA, vB, -vmBS / vB, vT),
                    highlightedPoints: game.pts.map(p => MM.pointTransformation(p[0], p[1], vA, vB, -vmBS / vB, vT))
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
                                    func: game.func,
                                    color: "blue",
                                    highlightedPoints: game.pts
                                }
                                const targetCurve = plt.pltMore[2]
                                const origF = game.func
                                const origP = game.pts

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
                                            //getCurrentField()?.selected?.on_click?.()
                                            game.board.focusField(0)
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
                if (greenCurrentlyInteracting) { return }
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
                b.fontSize = inputButtons[0].fontSize
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
            bTransformReset.fontSize = zoomReset.fontSize
            bTransforms.push(bTransformReset)

            guidance.transparent = false
            guidance.color = null
            guidance.outline = 0
            guidance.stretch(1, 1.2)

            const greenCurve = {}
            const greenCurveHistory = []
            const greenHistory = []
            let greenCurrentlyInteracting = false
            const greenHistoryButton = new Button()
            //greenHistoryButton.transparent = true
            this.add_drawable(greenHistoryButton)
            greenHistoryButton.topleftatV(plt.rect.topleft)
            greenHistoryButton.bottomrightstretchatV(plt.rect.bottomright)
            greenHistoryButton.transparent = true
            Object.defineProperty(greenHistoryButton, "txt", { get: () => greenHistory.map((x, i) => `${i + 1}. ${x}`).join("\n") })
            greenHistoryButton.textSettings.color = "green"
            greenHistoryButton.textSettings.textAlign = "left"
            greenHistoryButton.textSettings.textBaseline = "top"
            Object.defineProperty(greenHistoryButton, "height", { get: () => greenHistory.length * 24 })
            /*greenHistoryButton.draw_text = function (screen) {
                MM.drawTextSingle(screen, greenHistory.map((x, i) => `${i}. ${x}`).join("\n"),
                    this.x, this.y, { textAlign: "left", textBaseline: "top", color: "green", opacity: .5 })
                console.log("yay")
            }
            greenHistoryButton.txt = "overriden"
            */


            const greenCurveReset = () => {
                if (greenCurveHistory.length > 1) {
                    greenCurveHistory.pop()
                    const previous = greenCurveHistory.at(-1)
                    greenCurve.func = previous.func
                    greenCurve.highlightedPoints = previous.highlightedPoints
                    greenCurve.color = previous.color
                    greenHistory.pop()

                } else {
                    plt.pltMore[1] = undefined
                    greenCurve.func = game.func
                    greenCurve.highlightedPoints = game.pts
                    greenCurve.color = "green"
                    greenCurveHistory.length = 0
                    greenHistory.length = 0
                }
            }
            game.greenCurveReset = greenCurveReset
            game.greenCurveHistory = greenCurveHistory
            greenCurveReset()
            bTransformReset.on_click = () => {
                greenCurrentlyInteracting = false
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
                greenCopy.fontSize = 30
                greenCopy.color = "lightgreen"
                greenCopy.txt = message
                greenHistory.push(message)
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
                            game.board.redefineFields(fields)
                            game.board.unfreezeFields()

                        }
                    }))
            }

            game.tempdrawies = []
            const resetTransformButtons = (drawies) => {
                game.OKavailable = null
                greenCurrentlyInteracting = false
                drawies ??= game.tempdrawies
                game.tempdrawies = []
                drawies.forEach(x => game.remove_drawable(x))
                bTransforms.forEach(x => x.color = "lightgreen")
                plt.pltMore[1] = greenCurve
                if (game.currentField) {
                    board.redefineFields(fields)
                    board.unfreezeFields()
                }
            }
            game.resetTransformButtons = resetTransformButtons

            //#region bStretch
            bStretch.on_click = () => {
                resetTransformButtons()
                greenCurrentlyInteracting = true
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
                    b.fontSize = 30
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
                    const field = new Field()
                    field.centeratV(panel[4].center)
                    game.tempdrawies.push(field)
                    game.add_drawable(field)
                    field.resize(fields[0].width, fields[0].height)
                    field.fontSize = fields[0].fontSize
                    field.outline = 0
                    field.color = "lightblue"
                    board.freezeFields()
                    board.redefineFields([field])
                    field.defaultValue = 1
                    field.isACoefficient = true
                    field.txtRefresh()
                    field.allowNegative = false


                    const ok = new Button()
                    ok.centeratV(panel[5].center)
                    ok.resize(panel[5].height * .5, panel[5].height * .5)
                    ok.txt = "OK"
                    game.OKavailable = ok
                    ok.hover_color = "purple"
                    ok.on_click = () => {
                        let val = field.getValue()
                        if (val == 0) { val = 1 }
                        let [a, b] = [1, 1]
                        if (direction == "y") { a = val }
                        if (direction == "x") { b = val }
                        /*greenCurve.func = MM.functionTransformation(greenCurve.func, a, b, 0, 0)
                        greenCurve.highlightedPoints = greenCurve.highlightedPoints.map(
                            p => MM.pointTransformation(p[0], p[1], a, b, 0, 0))
                            */
                        animatedTransform(a, b, 0, 0,
                            `Strech in the ${direction}-direction by scale factor ${(field.txt == "" || !field.txt) ? 1 : field.txt}`
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
                greenCurrentlyInteracting = true
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
                    b.fontSize = submitButton.fontSize//30
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
                greenCurrentlyInteracting = true
                bTransforms.forEach(x => x.color = "gray")
                bTranslate.color = "lightgreen"
                game.sendFancy(bTranslate, guidance)
                const panel = guidance.splitCol(.25, 2, .25, 1, .25, 1, .25, .5, .25).map(Button.fromRect)
                panel[1].txt = "Translate by vector"
                const drawies = [...panel]
                drawies.forEach(b => {
                    b.color = "lightgreen"
                    b.outline = 0
                    b.fontSize = 30
                })

                game.add_drawable(drawies)
                game.tempdrawies.push(...drawies)


                const STf = [new Field(), new Field()]

                board.freezeFields()
                board.redefineFields(STf)
                STf.forEach(field => {
                    game.tempdrawies.push(field)
                    game.add_drawable(field)
                    field.resize(fields[0].width, fields[0].height)
                    field.outline = 0
                    field.color = "lightgray"
                    field.hover_color = "purple"
                    field.selected_color = "lightblue"
                    field.hover_selected_color = null
                    field.fontSize = fields[0].fontSize
                    field.defaultValue = 0
                    field.isATerm = false
                    field.txtRefresh()

                })
                panel[2].txt = "("
                STf[0].centeratV(panel[3].center)
                panel[4].txt = ","
                STf[1].centeratV(panel[5].center)
                panel[6].txt = ")"


                const ok = new Button()
                ok.centeratV(panel.at(-2).center)
                ok.resize(panel.at(-2).height * .5, panel.at(-2).height * .5)
                ok.txt = "OK"
                game.OKavailable = ok
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
                    animatedTransform(1, 1, s, t, `Translate by vector (${STf[0].txt == "" ? 0 : STf[0].txt},${STf[1].txt == "" ? 0 : STf[1].txt}).`)
                }
                game.tempdrawies.push(ok)
                game.add_drawable(ok)

            }






            game.buttonsDict = board.getButtonsDict()








        }
        //#endregion
        //#region levelSelector
        const levelSelector = () => {
            stgs.difficulty = "other"
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
            levelInfo.fontSize = 48
            levelButtons.forEach((x, i) => {
                x.deflate(20, 20)
                x.txt = i + 1
                x.fontSize = 48
                x.on_click = () => {
                    stgs.stage = i
                    main()
                }
                if (stgs.victories.includes(i)) { x.color = "lightgreen" }
            })
            this.add_drawable(levelButtons)
            this.add_drawable(levelInfo)

            const leaderboardButton = levelInfo.copy
            this.leaderboardButton = leaderboardButton
            leaderboardButton.dynamicText = () => {
                const availableLeaderboard = contest?.leaderboard ?? this.leaderboard
                return availableLeaderboard.join("\n")
            }
            leaderboardButton.textSettings = { textAlign: "left", textBaseline: "top" }
            //leaderboardButton.transparent = false
            leaderboardButton.bottomstretchat(700)
            leaderboardButton.fontSize = 36
            game.add_drawable(leaderboardButton)

            const compressionsFix = (funcData, xs, a, b, s, t) => {
                if (!stgs.compressionsFixDesired) { return [funcData, xs, a, b, s, t] }
                const func = funcData
                if (-1 < a && a < 1) { func = MM.functionTransformation(game.func, Math.abs(1 / a), 1, 0, 0) }
                if (b < -1 || b > 1) {
                    func = MM.functionTransformation(func, 1, Math.abs(1 / b), 0, 0)
                    xs = xs.map(x => Math.abs(b) * x)
                    //s = Math.abs(b) * s
                }
                funcData.xs = xs
                return [funcData, xs, a, b, s, t]
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
                /*setTimeout( 
                    () => { stgs.randomLevelData = null }
                    , stgs.minimumTimePerLevel)
                    */
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
                    () => { a *= MM.randomInt(2, 4); a = Math.random() > .6 ? 1 / a : a },
                    //stretch in x
                    () => { b *= MM.randomInt(2, 4); b = Math.random() > .6 ? 1 / b : b },
                    //reflect in y
                    () => { a *= -1 },
                    //reflect in x
                    () => { b *= -1 },
                    //translate
                    () => {
                        //s = MM.choice([-10, -8, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 10])
                        //t = MM.choice([-10, -8, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 10])
                        s = MM.choice([...MM.range(-5, 6)].filter(x => x))
                    },
                    () => { t = MM.choice([...MM.range(-5, 6)].filter(x => x)) }
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
                const levelData = [{ type: "poly", xs, ys }, xs, a, b, s, t]
                return compressionsFix(...levelData)
            }
            const makeRandomTrig = (numberOfTransformations) => {
                let [a, b, s, t] = [1, 1, 0, 0]
                const transformOptions = [
                    () => { a = MM.choice([2, 3, 1 / 2, 1 / 3, 2 / 3, 3 / 2]) },
                    () => { b = MM.choice([2, 3, 1 / 2, 1 / 3, 2 / 3, 3 / 2]) },
                    () => { s = MM.choice([PI / 4, -PI / 4, PI / 2, -PI / 2, PI / 3, -PI / 3, 2 * PI / 3]) },
                    () => { t = MM.choice([-3, -2, -1, 1, 2, 3, 3 / 2, -3 / 2, 1 / 2, -1 / 2]) },
                    () => { a *= -1 },
                    () => { b *= -1 }
                ]
                MM.choice(transformOptions, numberOfTransformations).forEach(x => x.call())
                const chosenFunctionIndex = MM.randomInt(0, TRIGFUNCTIONS.length - 1)
                let [func, xs] = TRIGFUNCTIONS[chosenFunctionIndex]
                if (xs[0] == 666) {
                    if (a != 1) { a = MM.choice([1, 2, 1 / 2]) * Math.sign(a) }
                    if (b != 1) { b = MM.choice([1, 2, 1 / 2]) * Math.sign(b) }
                    xs = [PI / 4, 0, PI / 4, PI]
                }

                return [{ type: "trig", chosenFunctionIndex }, xs, a, b, s, t, true] //reorient
            }
            const makeRandomSquiggly = (numberOfTransformations = 1) => {
                let [a, b, s, t] = getRandomTransformABST(numberOfTransformations)
                if (Math.abs(a) != 1 && Math.random() < .1) { a = MM.choice([3 / 2, 3 / 2, 5 / 2]) * Math.sign(a) }
                if (Math.abs(b) != 1 && Math.random() < .1) { b = MM.choice([3 / 2, 3 / 2, 5 / 2]) * Math.sign(b) }
                const [xs, ys] = getRandomPoints(MM.choice([4, 4, 4, 5, 5, 6]))
                const levelData = [{ type: "squiggly", xs, ys },
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
                x.fontSize = levelButtons[0].fontSize
            })

            this.add_drawable(rButs)
            rButs[0].on_click = () => {
                stgs.difficulty = "easy"
                makeRandom(1)
            }
            rButs[1].on_click = () => {
                makeRandom(MM.choice([2, 2, 3]))
                stgs.difficulty = "medium"
            }
            rButs[2].on_click = () => {
                makeRandom(MM.choice([4, 4, 4, 4, 5]))
                stgs.difficulty = "hard"
            }


            const rInfo = new Button()
            rInfo.txt = "Generate a level:"
            rInfo.fontSize = levelInfo.fontSize
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
            rTypes.forEach(x => x.interactable = stgs.canChangeRandomType)


            rTypes.slice(1, 5).forEach(b => b.on_click = function () { stgs.randomType = b.txt })
            const typeRadio = Button.make_radio(rTypes.slice(1, 5), true)
            rTypes.slice(1, 5).find(x => x.txt == stgs.randomType).on_click()
            this.add_drawable(rTypes)

            let changelogButton = new Button()
            changelogButton.width = rTypes.at(-1).width
            changelogButton.height = rTypes.at(-1).height
            //this.add_drawable(changelogButton)
            changelogButton.bottomat(rTypes.at(-1).bottom)
            changelogButton.leftat(rButs[0].left)
            changelogButton.on_click = () => changelogGlobal.split("$").forEach(x => setTimeout(() => alert(x), 100))
            changelogButton.fontSize = 16
            changelogButton.txt = "Changelog"




            if (stgs.firstRun && stgs.animationsEnabled && stgs.levelSelectorAnimation) {

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
        /*
        if (game.buttonsDict) {
            for (let [k, b] of Object.entries(game.buttonsDict)) {
                if (this.keyboarder.pressed[k] == true) {
                    if (b && b.interactable && b.clickable) { b.on_click() }
                }

            }
            if (this.keyboarder.pressed["Backspace"]) {
                const b = game.buttonsDict.Delete
                if (b && b.interactable && b.clickable) { b.on_click() }
            }

            if (this.keyboarder.pressed["ArrowRight"]) {
                game.board.nextField()
            }
            if (this.keyboarder.pressed["ArrowLeft"]) {
                game.board.previousField()
            }
            if (this.keyboarder.pressed["Enter"]) {
                let b = game.submitButton
                if (game.OKavailable) { b = game.OKavailable }
                if (game.hasWonAlready) { b = game.levelSelectButton }
                if (b && b.interactable && b.clickable) { b.on_click() }
            }
        }
        */



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

    startContest = contest?.startContest



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
        game.resetTransformButtons()
        game.greenCurveReset()

    },
    set highlightedPointsX(arrayX) {
        const pts = arrayX.map(x => [x, game.plt.func(x)])
        game.plt.highlightedPoints = pts
        game.pts = pts
    },
    brokenLineFunction(...XYXYXY) {
        game.func = MM.brokenLineFunction(...XYXYXY)
        game.plt.func = game.func
        game.pts = MM.XYXYXYListToPairs(...XYXYXY)
        game.plt.highlightedPoints = game.pts
        game.resetTransformButtons()
        game.greenCurveReset()
        game.plt.pltMore.splice(0, 1)

    },
    polyFunction(...XYXYXY) {
        game.func = MM.lagrange(...MM.XYXYXYListToTwoArrays(...XYXYXY))
        game.plt.func = game.func
        game.pts = MM.XYXYXYListToPairs(...XYXYXY)
        game.plt.highlightedPoints = game.pts
        game.resetTransformButtons()
        game.greenCurveReset()
        game.plt.pltMore.splice(0, 1)

    }


}/// end of dev


