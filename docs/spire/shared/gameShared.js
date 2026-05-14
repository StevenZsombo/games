class GameShared extends GameCore {
    initShared() {
        this.initSpire()
        this.initBossfight()
        this.initEditor()
        this.initFake()
        const spotMall = this.spotMall = new Malleable()
        spotMall.components = Spot.ALL
        spotMall.isBlocking = true
        this.add_drawable(spotMall, 4)
        this.bot = new Button({
            width: this.WIDTH, height: GRAPHICS.BOTTOM,
            x: 0, y: this.HEIGHT - GRAPHICS.BOTTOM,
            outline: 0,
            dynamicText: () => `Stage ${sm.currentKey}: ${sm.current.txt}`,
            fontSize: GRAPHICS.FONT_BIG,
            isBlocking: true
        })
        this.add_drawable(this.bot, 7)

        this.playerSpot = Spot.ALL[0]

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
                        ctx, x.button, { gentleSin: this.gentleSin, outline_color: "green" })
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


        /**@type {Button&{spot:Spot,close:Function(),open:Function(Spot)}} */
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
                if (spot.canMoveTo) calcula.activate()
            },
            close() {
                this.deactivate(); calcula.deactivate(); this.spot = null;
                calcula.ans.txt = ""
                calculaShowHide.txt = "Hide buttons"
            },
            on_release() { this.close() },
        })
        fullViewer.spot = null
        this.add_drawable(fullViewer, 7)

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
        em.emit("hide")
        sm.states.get(0).on_enter = () => {
            em.emit("hide")
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
            this.bot.color = "gold"
            GameEffects.popup("You can start planning.\nBest not to solve the questions yet.", {
                sizeFrac: [.6, .15], moreButtonSettings: {
                    fontSize: GRAPHICS.FONT_MEDIUM, floatTime: 3000,
                    color: "gold"
                }
            })

        }
        sm.states.get(2).on_enter = () => {
            this.bot.color = "lightgreen"
            GameEffects.popup("Climb! Climb! Climb!", {
                sizeFrac: [.6, .15], moreButtonSettings: {
                    fontSize: GRAPHICS.FONT_MEDIUM, floatTime: 1000,
                    color: "lightgreen"
                }
            })
            console.log("SLIDE")
            em.emit("show")
            if (!Spot.ALL.length) return
            const targetY = this.HEIGHT * 0.5
            this.isAcceptingInputs = false
            const lowestSpot = Math.max(...Spot.ALL.map(x => x.button.y))
            const dist = targetY - lowestSpot
            console.log({ lowestSpot, targetY })
            let lastT = 0
            Anim.custom(null, GRAPHICS.SLIDE_TIME, t => {
                Spot.moveAll((t - lastT) * dist)
                lastT = t
            }, "", { add: game, on_end: () => this.isAcceptingInputs = true })
        }
        sm.states.get(3).on_enter = () => {
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
        this.keyboarder.on_keyupDict["p"] = () => {
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
            + "T:tap(mimic user input),P:progress(start or guess),"
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
            const arr = ["wait", "plan", "climb", "show", "hide"]
            const parr = []
            parr.push(...arr.map(x => [x, () => em.emit(x)]))
            parr.push(["Import", () => this.importALL()])
            parr.push(["wDiv", wDiv.toggle])

            const ddm = GameEffects.dropDownMenu(parr)
            this.mouser.on_release_once = () => this.once(ddm.close)
        }
        this.add_drawable(fake)
    }

    initSpire() {
        if (RULES.DEMO) {
            fetch(RULES.DEMO).then(x => x.json())
                .then(x => this.importALL(x))
                .then(() => game.once(() => sm.skipTo(0)))
        }
    }

    initBossfight() {
        this.spire = Spot.ALL
        em.emit("hide")
        Spot.ALL.length = 0
        if (RULES.DEMOHEADS) {
            fetch(RULES.DEMO).then(x => x.json())
                .then(x => this.importALL(x))
                .then(() => game.once(() => sm.skipTo(0)))
        }


        const bossBG = this.bossBG = Button.fromRectShallow(this.rect, {
            isBlocking: true
        })

    }

    startBossfight() {
        this.fullViewer.close()
        this.spotMall.deactivate()
        this.canDrag = false
    }

    cancelBossfight() {
        this.spotMall.activate()
        this.canDrag = true
    }

}