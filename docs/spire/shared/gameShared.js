class GameShared extends GameCore {
    initShared() {
        const spotMall = this.spotMall = new Malleable()
        /**@type {Spot[]} */
        spotMall.components = Spot.ALL
        spotMall.isBlocking = true
        this.add_drawable(spotMall, 4)
        this.initData()
        this.initSpire()
        this.initBossfight()
        this.initEditor()
        this.initFake()
        this.bot = new Button({
            width: this.WIDTH, height: GRAPHICS.BOTTOM,
            x: 0, y: this.HEIGHT - GRAPHICS.BOTTOM,
            outline: 0,
            dynamicText: () => `Stage ${sm.currentKey}: ${sm.current.txt}`,
            fontSize: GRAPHICS.FONT_BIG,
            isBlocking: true
        })
        this.add_drawable(this.bot, 7)

        const lineDrawable = this.lineDrawable = {
            draw: (ctx) => {
                const drawFn = MM.drawArrow
                Spot.ALL.forEach(x =>
                    x.above.forEach(y =>
                        drawFn(ctx,
                            x.button.centerX, x.button.top,
                            y.button.centerX, y.button.bottom,
                            { color: "black", outline: 16, size: 32 })
                    )

                )
            }
        }
        this.add_drawable(lineDrawable, 6) //arrows for now?

        const circleDrawable = this.circleDrawable = {
            draw: (ctx) => {
                Spot.ALL.forEach(x => {
                    if (x.canMoveTo && !x.done) MM.drawEllipseOnRect(
                        ctx, x.button, {
                        gentleSin: this.gentleSin, outline_color:
                            x.isHydra ? "blue" : "green"
                    })
                })
            }
        }
        this.add_drawable(circleDrawable, 6)

        const sinteract = this.sinteract = new Clickable(this.rect)
        sinteract.draw = null
        this.canDrag = true
        sinteract.on_drag = (pos) => {
            if (!this.canDrag) return
            Spot.moveAll((pos.y - sinteract.last_held.y) * (GRAPHICS.DRAG_COEFF || 1))
            if (Math.abs(sinteract.last_clicked.y - pos.y) > GRAPHICS.DRAG_BUT_NO_CLICK_THRESHOLD)
                this.mouser.blockNextRelease()
        }
        this.add_drawable(sinteract, 1)

        const detail = new Button({
            width: 600, height: 120, y: 0, txt: "You solved this problem already.",
            color: GRAPHICS.SPOT_COLOR_SOLVED_OPAQUE, fontSize: GRAPHICS.FONT_SMALL
        })
        detail.rightat(this.WIDTH)
        detail.deactivate()
        /**@type {Button&{spot:Spot,close:Function(),open:Function(Spot),closesOnRelease:boolean}} */
        const fullViewer = this.fullViewer = Button.fromRectShallow(this.rect, {
            isBlocking: false,
            outline: 0,
            interactable: false,
            visible: false,
            isBlocking: true,
            height: this.HEIGHT - GRAPHICS.BOTTOM,
            color: GRAPHICS.SPOT_COLOR,
            /**@param {Spot} spot  */
            open(spot) {
                this.spot = spot, this.img = spot.button.img; this.activate();
                Anim.stepper(fullViewer, GRAPHICS.FULLVIEW_BRINGUP_TIME, "opacity", 1, 0, { ditch: true, add: game })
                if (spot.done) detail.activate()
                else if (spot.canMoveTo && !spot.mask) calculaAnimate()
            },
            close() {
                this.deactivate(); calcula.deactivate(); detail.deactivate(); offerer.deactivate(); this.spot = null;
                calcula.ans.txt = ""
                calculaShowHide.txt = "Hide buttons"
            },
            closesOnRelease: true,
            on_release() { if (this.closesOnRelease) this.close() },
        })
        fullViewer.spot = null
        this.add_drawable(fullViewer, 7)
        this.add_drawable(detail, 7)

        const calculaBG = new Rect(0, 0, 300, 600)
        // calculaBG.rightat(this.WIDTH - 20)
        calculaBG.rightat(this.WIDTH)
        // calculaBG.bottomat(this.HEIGHT - GRAPHICS.BOTTOM - 20)
        calculaBG.bottomat(this.HEIGHT)
        const calcula = this.calcula = new CalculatorButtons(calculaBG, undefined, { scaleFactor: .9 })
        calcula.verifyAnswer = async (guess) => {
            if (!fullViewer.spot.canMoveTo) { throw new Error("invalid submission?") }
            return { correct: fullViewer.spot.attempt(guess) }
        }
        calcula.ans.color = GRAPHICS.ANSWER_SPACE_COLOR
        this.add_drawable(calcula, 8)//just below the popups

        const calculaShowHide = this.calculaShowHide = Button.fromRectShallow(calcula.ans)
        calculaShowHide.on_release = () => {
            if (calcula.submit.visible) {
                calcula.deactivate()
                calculaShowHide.txt = "Show buttons"
            }
            else {
                calcula.activate()
                calculaShowHide.txt = "Hide buttons"
            }
            calculaShowHide.activate()
        }
        calculaShowHide.width *= 0.6
        calculaShowHide.rightat(calcula.calculatorButtons[0].left - (calcula.calculatorButtons[1].left - calcula.calculatorButtons[0].right))
        calculaShowHide.txt = "Hide buttons"
        calcula.push(calculaShowHide)

        calcula.deactivate()

        const origCalculaPos = calcula.calculatorButtons.map(x => ({ x: x.x, y: x.y }))
        const calculaAnimate = this.calculaAnimate = () => {
            calcula.activate()
            calcula.calculatorButtons.forEach(x => x.interactable = false)
            Anim.custom(calcula.calculatorButtons, GRAPHICS.CALCULA_BRINGUP_TIME, (t, obj) => {
                obj.forEach((x, i) => {
                    // x.x = Anim.interpol(calcula.ans.x, origCalculaPos[i].x, t)
                    x.y = Anim.interpol(calcula.ans.y, origCalculaPos[i].y, t)

                })
            }, "", {
                add: this,
                ditch: true,
                on_end: calcula.calculatorButtons.forEach(x => x.interactable = true)
            })
        }

        const offerer = this.offerer = new Button({
            height: GRAPHICS.BOTTOM, width: 500,
            x: this.WIDTH * .05, txt: "Fight this head!", fontSize: GRAPHICS.FONT_BIG,
            isBlocking: true,
        })
        offerer.topat(this.bot.top - 30)
        offerer.deactivate()
        this.add_drawable(offerer, 8)
        const offererAnimate = this.offererAnimate = () => {
            offerer.activate()
            Anim.custom(offerer, GRAPHICS.OFFERER_WAVE_TIME, t => {
                offerer.rad = this.dtSin * .5
            }, "rad", {
                ditch: true, add: game,
            })
        }



        if (RULES.SCROLLWHEEL_SPEED) {
            this.mouser.on_wheel = (mouser) => {
                let howmuch = RULES.SCROLLWHEEL_SPEED
                howmuch *= (mouser.wheel > 0 ? -1 : 1)
                Spot.moveAll(howmuch)
            }
        }

        em.on("correct", () => GameEffects.popup("Correct!", { moreButtonSettings: { color: "lightgreen" } }))
        em.on("incorrect", (guess) => GameEffects.popup(`Your solution of ${guess} is incorrect.`,
            GameEffects.popupPRESETS.bigYellow
        ))
        em.on("wait", () => { sm.skipTo(0) })
        em.on("plan", () => { sm.skipTo(1) })
        em.on("climb", () => { sm.skipTo(2) })
        em.on("boss", () => { sm.skipTo(3); this.startBossfight() })
        em.on("noboss", () => { if (sm.currentKey >= 3) this.cancelBossfight() })
        em.on("correct", () => {
            if (!this.canDrag) {//means in bossfight}

            }
        })
        em.emit("hide")
        sm.states.get(0).on_enter = () => {
            em.emit("hide")
            em.emit("wait")
            this.bot.color = "lightpink"
            GameEffects.popup("Please wait for the game to begin!", {
                sizeFrac: [.6, .15], moreButtonSettings: {
                    fontSize: GRAPHICS.FONT_MEDIUM, floatTime: 3000,
                    color: "lightpink"
                }
            })
        }
        sm.states.get(1).on_enter = () => {
            em.emit("show")
            em.emit("plan")
            this.bot.color = "gold"
            GameEffects.popup("You can start planning.\nSolving questions immediately would be poor strategy.", {
                sizeFrac: [.6, .15], moreButtonSettings: {
                    fontSize: GRAPHICS.FONT_MEDIUM, floatTime: 3000,
                    color: "gold"
                }
            })

        }
        sm.states.get(2).on_enter = () => {
            fullViewer.close()
            em.emit("show")
            em.emit("climb")
            this.bot.color = "lightgreen"
            GameEffects.popup("Climb! Climb! Climb!", {
                sizeFrac: [.6, .15], moreButtonSettings: {
                    fontSize: GRAPHICS.FONT_MEDIUM, floatTime: 1000,
                    color: "lightgreen"
                }
            })
            if (!Spot.ALL.length) return
            const targetY = this.HEIGHT * 0.5
            this.isAcceptingInputs = false
            const lowestSpot = Math.max(...Spot.ALL.map(x => x.button.y))
            const dist = targetY - lowestSpot
            console.log({ lowestSpot, targetY })
            let lastT = 0
            Anim.custom(null, GRAPHICS.SLIDE_TIME, t => {
                if (!this.canDrag) return
                Spot.moveAll((t - lastT) * dist)
                lastT = t
            }, "", { add: game, on_end: () => this.isAcceptingInputs = true })
        }
        sm.states.get(3).on_enter = () => {
            em.emit("show")
            em.emit("boss")
            this.bot.color = "lightblue"
            /*GameEffects.popup("Defeat the Hydra! Cut off as many heads as you can!", {
                sizeFrac: [.6, .15], moreButtonSettings: {
                    fontSize: GRAPHICS.FONT_MEDIUM, floatTime: 1000,
                    color: "lightblue"
                }
            })*/
        }
    }


    importALL(data) {
        const doit = data => Spot.fromJSONall(data)
        data ? doit(data) : MM.importJSON().then(doit)
    }

    exportALL() {
        const out = JSON.stringify(Spot.ALL)
        MM.downloadFile(out, "spire" + MM.lettersAndNumberOnly(MM.dateAndTime()) + ".json")
    }
    exportAsHeads() {
        const out = JSON.stringify(Spot.ALL)
        MM.downloadFile(out, "heads" + MM.lettersAndNumberOnly(MM.dateAndTime()) + ".json")
    }

    /**@returns {Spot} */
    findSpotOnMouse() {
        return Spot.ALL.find(s => s.button.collidepoint(this.mouser.x, this.mouser.y))
    }
    initEditor() {
        if (!RULES.EDITOR) return
        this.keyboarder.on_keyupDict["a"] = () =>
            new Spot(null, this.mouser.x, this.mouser.y)
        this.keyboarder.on_keyupDict["q"] = async () => {
            const spot = this.findSpotOnMouse()
            if (!spot) return
            MM.filePicker(".png").then(x => {
                spot.setIMG(x.name)
                GameEffects.popup("Imported successfully.", GameEffects.popupPRESETS.bigBlue)
            }).catch((err) => GameEffects.popup("Failure: " + err, GameEffects.popupPRESETS.bigRed))
        }
        this.keyboarder.on_keyupDict["p"] = async () => {
            const spot = this.findSpotOnMouse()
            if (!spot) return
            MM.filePicker(".png").then(x => {
                spot.setMaskIMG(x.name)
                GameEffects.popup("Imported successfully.", GameEffects.popupPRESETS.bigBlue)
            }).catch((err) => GameEffects.popup("Failure: " + err, GameEffects.popupPRESETS.bigRed))
        }
        this.keyboarder.on_keyupDict["s"] = () => {
            this.findSpotOnMouse()?.setSol(+prompt())
        }
        /**@type {?Spot} */
        let conn = null
        this.keyboarder.on_keydownDict["c"] = () =>
            conn = this.findSpotOnMouse()
        this.keyboarder.on_keyupDict["c"] = () => {
            if (!conn) return
            let end = this.findSpotOnMouse()
            if (!end) return
            if (end === conn) { conn = null; return }
            conn.above.add(end)
            end.below.add(conn)
            conn = null
        }
        this.keyboarder.on_keyupDict["d"] = () =>
            this.findSpotOnMouse()?.disconnect()
        this.keyboarder.on_keyupDict["r"] = () =>
            this.findSpotOnMouse()?.remove()
        this.keyboarder.on_keyupDict["l"] = () => {
            const spot = this.findSpotOnMouse()
            if (!spot) return
            const cy = spot.button.centerY
            const ct = spot.button.top
            const cb = spot.button.bottom
            Spot.ALL.forEach((x, i) => {
                const b = x.button
                if (MM.between(b.bottom, ct, cb) || MM.between(b.top, ct, cb)) {
                    x.button.centeratY(cy)
                    x.label.centeratY(cy)
                }
            })
        }
        this.keyboarder.on_keyupDict["t"] = () =>
            this.findSpotOnMouse()?.onInteract()
        this.keyboarder.on_keyupDict["o"] = () =>
            this.exportALL()
        this.keyboarder.on_keyupDict["i"] = () =>
            this.importALL()
        this.keyboarder.on_keyupDict["g"] = () => {
            const canClick = sm.currentKey >= 2;
            em.emit("climb"); if (canClick) this.findSpotOnMouse()?.attempt(+prompt())
        }
        this.keyboarder.on_keyupDict["b"] = () =>
            this.findSpotOnMouse()?.makeHydra()
        this.keyboarder.on_keyupDict["x"] = () =>
            this.editorHelper.visible ^= 1
        this.keyboarder.on_keyupDict["0"] = () => {
            Spot.ALL.length = 0
        }
        this.keyboarder.on_keyupDict["h"] = () =>
            this.exportAsHeads()
        this.keyboarder.on_keyupDict["m"] = () => {
            const spot = this.findSpotOnMouse(); if (!spot) return
            if (MM.between(this.rect.cx, spot.button.left, spot.button.right)) {
                spot.button.centeratX(this.rect.cx)
                spot.label.centeratX(this.rect.cx)
                return
            }
            const other = new Spot(null, spot.button.x, spot.button.y)
            const where = this.WIDTH - spot.button.centerX
            other.button.centeratX(where)
            other.label.centeratX(where)
        }


        const e = this.editorHelper = new Button()
        e.width = 400
        e.height = 800
        e.rightat(this.rect.right)
        e.y = 0
        e.transparent = true
        e.textSettings = { textAlign: "left", textBaseLine: "top" }
        e.font_font = "myMonospace"
        e.txt = ("A:add,Q:question,S:solution,C:connect(drag),L:level(row),M:middle/mirror,"
            + "T:tap(mimic user input),G:guess(mimic user guess),"
            + "D:disconnect,R:remove,B:boss(mark as the hydra),,"
            + "I:input(import),O:output(export),H:heads(export as heads),0:null(erase all),X:show/hide these hints")
            .split(",").join("\n")
        this.add_drawable(e, 9)
        const s = this.editorStats = Button.fromButton(e)
        s.height = GRAPHICS.BOTTOM
        s.bottomat(this.rect.bottom)
        s.dynamicText = () => `Spots: ${Spot.ALL.filter(x => !x.isHydra).length}`
            + `\nHas hydra: ${Spot.ALL.some(x => x.isHydra) ? "yes" : "no"}`
        this.add_drawable(s, 9)
    }
    initFake() {
        if (!RULES.FAKE) return
        const fake = new Button({ width: 150, height: 80, txt: "fakeServer", isBlocking: true })
        fake.topat(0)
        fake.rightat(this.WIDTH)
        fake.on_release = () => {
            const arr = ["wait", "plan", "climb", "boss", "noboss", "show", "hide"]
            const parr = []
            parr.push(...arr.map(x => [x, () => em.emit(x)]))
            parr.push(["Import", () => this.importALL()])
            parr.push(["wDiv", wDiv.toggle])

            const ddm = GameEffects.dropDownMenu(parr)
            this.mouser.on_release_once = () => this.once(ddm.close)
        }
        this.add_drawable(fake)
    }

    async initData() {
        if (!RULES.EDITOR) {
            await fetch(RULES.DEMOHEADS).then(x => x.json())
                .then(x => this.importALL(x))
                .then(() => this.heads = [].concat(Spot.ALL))
                .then(() => {
                    fetch(RULES.DEMO).then(x => x.json())
                        .then(x => {
                            Spot.ALL.length = 0
                            this.importALL(x)
                        })
                        .then(() => this.spire = [].concat(Spot.ALL))
                        .then(() => {
                            console.log({ spire: this.spire, heads: this.heads })
                            game.once(() => sm.skipTo(0))
                        })
                })
            return
        }
        return
    }

    initSpire() {

    }

    initBossfight() {


        /*const bossBG = this.bossBG = Button.fromRectShallow(this.rect, {
            isBlocking: true
        })*/

    }

    hotswap(spotArr) {
        // this.remove_drawable(this.spotMall)
        this.fullViewer.close()
        Spot.ALL.length = 0
        Spot.ALL.push(...spotArr)
        // this.mouser.blockNextRelease()
        // this.add_drawable(this.spotMall, 4)
        // this.spotMall.components = Spot.ALL
    }

    startBossfight() {
        this.hotswap(this.heads)
        this.canDrag = false
    }

    cancelBossfight() {
        this.hotswap(this.spire)
        this.canDrag = true
    }
    minutes = Array.from(RULES.MINUTES)
    /**@param {Spot} spot  */
    offerToCutHead(spot) {
        if (spot.done) return
        this.offererAnimate()
        const cleanup = () => {
            this.offerer.deactivate()
            this.offerer.on_release = null
            this.fullViewer.closesOnRelease = true
        }
        const minutes = this.minutes
        this.offerer.on_release = () => {
            this.fullViewer.closesOnRelease = false
            let str =
                `You will have ${minutes[0]} minutes to fight this head.`
                + `\nIf you fail, you CANNOT try again.`
            str += `\nAfter this fight, you will have`
            if (minutes.slice(1, -1).length == 1)
                str += minutes.slice(1, -1).join(", ") + " minutes for the next head, then"
            if (minutes.slice(1, -1).length > 1)
                str += minutes.slice(1, -1).join(", ") + " minutes for the next heads respectively, then"
            str += `${minutes.at(-1)} minutes for each head afterwards.`
            str += `\nSo choose which head to fight wisely.`
            str += `\n\nFight this head?`
            GameEffects.confirmBox(str, { sizeFrac: [.8, .6] }).promise()
                .then(() => { cleanup(); this.acceptToCutHead(spot) })
                .catch(() => { this.fullViewer.closesOnRelease = true })

        }

    }
    /**@param {Spot} spot  */
    acceptToCutHead(spot) {
        if (this.minutes.length > 1) this.minutes.shift()
        this.fullViewer.open(spot)
        this.fullViewer.img = spot.maskIMG
        this.fullViewer.interactable = false
    }


}