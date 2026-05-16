class GameShared extends GameCore {
    initShared() {
        const w = this.w = new GameWorld(this.rect.copy)
        const spotMall = this.spotMall = new Malleable()
        /**@type {Spot[]} */
        spotMall.components = Spot.ALL
        spotMall.isBlocking = true
        this.add_drawable(w, 4)
        w.add_drawable(spotMall)
        this.initData()
        this.initEditor()
        this.initFake()
        this.initZoom()
        this.bot = new Button({
            width: this.WIDTH, height: GRAPHICS.BOTTOM,
            x: 0, y: this.HEIGHT - GRAPHICS.BOTTOM,
            outline: 0,
            dynamicText: () => `${game.me || ""}Stage ${sm.currentKey}: ${sm.current.txt}`,
            fontSize: GRAPHICS.FONT_BIG,
            isBlocking: true
        })
        let botClicks = 0
        this.bot.on_click = () => {
            if (botClicks == 0) setTimeout(() => botClicks = 0, 5000)
            botClicks++
            if (botClicks > 3) wDiv.hide()
            if (botClicks > 10) {
                botClicks = 0
                if (+prompt("Password:") !== 8774) return
                if (confirm("Go offline?")) {
                    localStorage.hash += "offline"
                    chat.delayedReload()
                    return
                }
                if (confirm("Disable error logs?")) {
                    wDiv.hide()
                    location.hash += "noerror"
                }
                if (confirm("Full flush?")) location.hash += "flush"
                if (confirm("Reload?")) chat.delayedReload()
            }
        }
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
        w.add_drawable(lineDrawable, 6) //arrows for now?

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
        w.add_drawable(circleDrawable, 6)

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
        /**@type {Button&{open:Function(spot)}} */
        const detail = new Button({
            width: 600, height: 120, y: 0, txt: "Detail goes here",
            color: "yellow", fontSize: GRAPHICS.FONT_SMALL,
            /**@param {Spot} spot  */
            open(spot) {
                this.activate()
                this.txt = spot.failed ? "You failed this problem already." : "You solved this problem already."
                this.color = spot.failed ? GRAPHICS.SPOT_COLOR_FAILED_OPAQUE : GRAPHICS.SPOT_COLOR_SOLVED_OPAQUE
            }
        })
        detail.rightat(this.WIDTH)
        detail.deactivate()
        this.lastVisitedID = null
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
                this.spot = spot
                this.img = spot.button.img; this.activate(); sp.deactivate(); this.zoomSlider?.deactivate()
                game.lastVisitedID = spot.id
                em.emit("full", spot)
                Anim.stepper(fullViewer, GRAPHICS.FULLVIEW_BRINGUP_TIME, "opacity", 1, 0, { ditch: true, add: game })
                if (spot.done) detail.open(spot)
                else if (spot.canMoveTo && !spot.mask) calculaAnimate()
            },
            close() {
                this.spot = null
                this.deactivate(); calcula.deactivate(); detail.deactivate(); offerer.deactivate(); sp.activate(); this.zoomSlider?.activate()
                calcula.ans.txt = ""
                calculaShowHide.txt = "Hide buttons"
            },
            closesOnRelease: true,
            on_release() { if (this.closesOnRelease) this.close() },
        })
        fullViewer.spot = null
        this.add_drawable(fullViewer, 7)
        this.add_drawable(detail, 7)

        const calculaBG = new Rect(0, 0, 400, 800)
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
                // calcula.deactivate()
                calcula.forEach(x => x.deactivate())
                calculaShowHide.txt = "Show buttons"
            }
            else {
                // calcula.activate()
                calcula.forEach(x => x.activate())
                calculaShowHide.txt = "Hide buttons"
            }
            calculaShowHide.activate()
        }
        calculaShowHide.width *= 0.6
        calculaShowHide.rightat(calcula.calculatorButtons[0].left - (calcula.calculatorButtons[1].left - calcula.calculatorButtons[0].right))
        calculaShowHide.height = GRAPHICS.BOTTOM
        calculaShowHide.bottomat(this.HEIGHT)
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


        const sp = this.showPlayers = new Button({
            width: GRAPHICS.SHOW_PLAYERS_RIGHT, height: this.HEIGHT, y: 0,
            fontSize: GRAPHICS.FONT_TINY,
            transparent: true
        })
        sp.textSettings.textAlign = "left"
        sp.textSettings.textBaseline = "top"
        sp.rightat(this.rect.right)
        this.add_drawable(sp, 7)



        if (RULES.SCROLLWHEEL_SPEED) {
            this.mouser.on_wheel = (mouser) => {
                if (!this.canDrag) return
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
        em.on("fin", () => { sm.skipTo(4) })
        em.on("win", () => { sm.skipTo(5) })
        em.on("correct", () => {
            if (!this.canDrag) {//means in bossfight}

            }
        })
        em.on("fail", () => {
            const p = GameEffects.popup(
                "Out of time. You failed to cut off this head." +
                (Spot.ALL.filter(x => !x.done).length ?
                    "\nTry another, but mind that you will have less time." : "")
                ,
                {
                    sizeFrac: [.8, .15],
                    moreButtonSettings: { color: GRAPHICS.SPOT_COLOR_FAILED, fontSize: GRAPHICS.FONT_MEDIUM },
                    floatTime: RULES.BEFORE_BOSS_WAIT_TIME, close_on_release: false,
                })
            const c = () => { p?.close(); em.off("full", c) }
            em.on("full", c)
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
            const startZoom = this.zoomLevel
            const targetY = this.HEIGHT - GRAPHICS.BOTTOM - GRAPHICS.SPOT_HEIGHT * 1.5
            this.isAcceptingInputs = false
            const lowestSpot = Math.max(...Spot.ALL.map(x => x.button.y))
            const dist = targetY - lowestSpot
            console.log({ lowestSpot, targetY })
            let lastT = 0
            Anim.custom(null, GRAPHICS.SLIDE_TIME, t => {
                if (!this.canDrag) return
                Spot.moveAll((t - lastT) * dist)
                lastT = t
                this.zoomSlider && this.setZoom(Anim.interpol(startZoom, 1, t))
            }, "", {
                add: game, on_end: () => {
                    this.isAcceptingInputs = true
                    this.zoomSlider && this.setZoom(1)

                }
            })
        }
        this.bossShownFirstMessage = false
        sm.states.get(3).on_enter = () => {
            em.emit("show")
            em.emit("boss")
            this.bot.color = "lightblue"
            if (this.bossShownFirstMessage) return
            let str = ""
            str += `You will only have `
                + `${Spot.ALL.map((_, i) => RULES.MINUTES[i] ?? RULES.MINUTES.at(-1)).join(", ")}`
                + ` minutes to fight each head.`
                + `\n\nIf you run out of time, you CANNOT try that question again.`
                + `\nSo choose the order in which you fight the heads carefully.`
                + `\n\n(The fight will begin shortly.)`
            const p = GameEffects.popup(str, {
                sizeFrac: [.8, .6], posFrac: [.5, .575], floatTime: RULES.BEFORE_BOSS_WAIT_TIME,
                travelTime: 500,
                moreButtonSettings: { fontSize: GRAPHICS.FONT_MEDIUM, color: "lightblue" },
                on_end: () => { this.bossShownFirstMessage = true; em.emit("show"); em.emit("save") }
            })
            // p.bottomstretchat(this.bot.top)
            em.emit("hide")
            /*p.on_release = () => {
                clickCount++
                if (clickCount > 5) p.close()
            }*/

        }
        sm.states.get(4).on_enter = () => {
            em.emit("fin")
            this.bot.color = "yellow"
            const swapper = Button.fromButton(offerer)
            swapper.dynamicColor = null
            swapper.txt = "Back to Spire"
            swapper.fontSize = GRAPHICS.FONT_MEDIUM
            swapper.stretch(.6, .6)
            swapper.eraseClickables()
            swapper.color = "blue"
            swapper.on_release = () => {
                if (Spot.ALL.some(x => x.isHydra)) { em.emit("boss"); swapper.txt = "Back to Spire" }
                else { em.emit("noboss"); swapper.txt = "Back to Hydra" }
            }
            swapper.activate()
            this.add_drawable(swapper, 8)
        }
        sm.states.get(5).on_enter = () => {
            em.emit("win")
            this.bot.color = "purple"
            GameEffects.fireworksShow()
        }
    }


    importALL(data) {
        const doit = data => Spot.fromJSONall(data)
        new Promise(resolve =>
            data ? resolve(data) : MM.importJSON().then(resolve)
        ).then(data => {
            doit(data)
            if (!RULES.ALLOW_BACKGROUND) return
            const bg = data.find(x => x.bg != null)
            if (bg) this.loadBackground(bg)
        })

    }
    async loadBackground({ bg, x = 0, y = 0 }) {
        if (!bg) return
        if (bg.endsWith(".png")) bg = bg.slice(0, -4)
        this.w.remove_drawable(this.background) //if any.
        const img = await Cropper.loadImageToNewCanvasPromise(RULES.QUESTION_FOLDER + bg + ".png")
        this.background = new Button({
            transparent: true, interactable: false,
            x, y,
            imgScale: 1, width: img.width, height: img.height,
            tag: bg
        })
        this.background.img = img
        this.w.add_drawable(this.background, 2)
    }

    exportALL(name = "spire") {
        const others = []
        if (this.background) others.push({
            bg: this.background.tag, x: this.background.x, y: this.background.y
        })
        const out = JSON.stringify(others.concat(Spot.ALL))
        MM.downloadFile(out, name + MM.lettersAndNumberOnly(MM.dateAndTime()) + ".json")
    }
    exportAsHeads() {
        this.exportALL("heads")
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
        this.keyboarder.on_keyupDict["u"] = async () => {
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
                    // x.label.centeratY(cy)
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
        this.keyboarder.on_keyupDict["b"] = () => { this.findSpotOnMouse()?.makeHydra(); em.emit("show") }
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
                // spot.label.centeratX(this.rect.cx)
                return
            }
            const other = new Spot(null, spot.button.x, spot.button.y)
            const where = this.WIDTH - spot.button.centerX
            other.button.centeratX(where)
            // other.label.centeratX(where)
        }

        this.keyboarder.on_keydownDict["1"] = async () => {
            MM.filePicker(".png").then(x => this.loadBackground({ bg: x.name }))

        }
        let lastTwo = null
        this.keyboarder.on_keyheldDict["2"] = () => {
            if (!lastTwo) return lastTwo = this.mouser.pos
            if (!this.background) return
            this.background.move(this.mouser.pos.x - lastTwo.x, this.mouser.pos.y - lastTwo.y)
            lastTwo = this.mouser.pos
        }
        this.keyboarder.on_keyupDict["2"] = () => lastTwo = null
        this.keyboarder.on_keyupDict["8"] = () => {
            if (!this.background) return
            this.w.remove_drawable(this.background)
            this.background = null
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
            + "D:disconnect,R:remove,B:boss(mark as the hydra),U:uncovered(bossfight question),,"
            + "I:input(import),O:output(export),H:heads(export as heads),"
            + "1:set BG,2:move BG,8:remove BG,0: null(erase all), X: show / hide these hints")
            .split(",").map(x => x.trim()).join("\n")
        e.visible = false
        this.add_drawable(e, 9)
        const s = this.editorStats = Button.fromButton(e)
        s.fontSize = 16
        s.height = GRAPHICS.BOTTOM
        s.leftat(this.WIDTH * .65)
        s.bottomat(this.rect.bottom)
        s.dynamicText = () => {
            return `Spots: ${Spot.ALL.filter(x => !x.isHydra).length}`

            //unused.
            const hasHydra = Spot.ALL.some(x => x.isHydra)
            const noMasks = !Spot.ALL.some(x => x.mask)
            const allMasks = Spot.ALL.every(x => x.mask)
            const allSolSet = Spot.ALL.every(x => x.isHydra || x.sol !== GRAPHICS.DEFAULT_SOLUTION)
            let spireCond = Spot.ALL.length && hasHydra && noMasks && allSolSet
            if (spireCond) spireCond = "yes"
            else {
                spireCond = "no\nwhy: "
                !hasHydra && (spireCond += "missing hydra;")
                !noMasks && (spireCond += "some questions covered;")
                !allSolSet && (spireCond += "\nsome solutions missing;")
            }
            let hydraCond = Spot.ALL.length && !hasHydra && allMasks & allSolSet
            if (hydraCond) hydraCond = "yes"
            else {
                hydraCond = "no\nwhy: "
                hasHydra && (hydraCond += "can't have a hydra;")
                !allMasks && (hydraCond += "missing uncovered copies;")
                !allSolSet && (hydraCond += "some solutions missing;")
            }

            return `Spots: ${Spot.ALL.filter(x => !x.isHydra).length}`
                + `\nIs a valid spire?:  ${spireCond}`
                + `\nIs a valid hydra?:  ${hydraCond}`
        }
        s.activate()
        this.add_drawable(s, 9)
    }
    initFake() {
        if (!RULES.FAKE) return
        const fake = this.fake = new Button({ width: 150, height: 80, txt: "fakeServer", isBlocking: true })
        fake.topat(0)
        fake.rightat(this.WIDTH)
        fake.on_release = () => {
            const arr = ["wait", "plan", "climb", "fin", "win", "boss", "noboss", "show", "hide"]
            const parr = []
            parr.push(...arr.map(x => [x, () => em.emit(x)]))
            parr.push(["Import", () => this.importALL()])
            parr.push(["wDiv", wDiv.toggle])
            // parr.push([["noTime"], () => game.timer && (game.timer.secondsLeft = 2)])

            const ddm = GameEffects.dropDownMenu(parr)
            this.mouser.on_release_once = () => this.once(ddm.close)
        }
        this.add_drawable(fake)
    }
    /**@type {Spot[]}*/
    spire
    /**@type {Spot[]}*/
    heads
    initData() {
        this.hasRetrievedData = (async () => {
            if (!RULES.EDITOR) {
                try {
                    const headsData = await fetch(RULES.DEMOHEADS).then(x => x.json())
                    this.importALL(headsData)
                    this.heads = [].concat(Spot.ALL)

                    const spireData = await fetch(RULES.DEMO).then(x => x.json())
                    Spot.ALL.length = 0
                    this.importALL(spireData)
                    this.spire = [].concat(Spot.ALL)

                    console.log({ spire: this.spire, heads: this.heads })
                    this.once(() => sm.skipTo(0))

                    return
                } catch (err) {
                    console.error("Failed to load data:", err)
                }
            }
        })()
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
    zoomLevel = 1
    setZoom(val) {
        this.zoomLevel = val
        this.w.worldRect.putOver(this.rect)
        const origT = this.w.screenToWorldRect(this.bot).top
        this.w.worldRect.stretch(val, val)
        const newT = this.w.screenToWorldRect(this.bot).top
        this.w.worldRect.move(0, origT - newT)

    }
    /**@type {?Slider} */
    zoomSlider = null
    initZoom() {
        // if (RULES.EDITOR) return
        if (!GRAPHICS.ALLOW_ZOOM_SLIDER) return
        const z = this.zoomSlider = new Slider(new Button({
            width: 90, height: 36, rad: -NINETYDEG,
            txt: "Zoom"
        }))
        z.lineSettings.width = 5
        z.min = 1
        z.max = GRAPHICS.ZOOM_MAXIMUM
        z.leftX = z.rightX = this.WIDTH - GRAPHICS.ZOOM_SLIDER_RIGHT - z.movingButton.height / 2
        z.leftY = this.HEIGHT - GRAPHICS.BOTTOM - 20 - z.movingButton.width / 2
        z.rightY = 600
        z.value = 1
        z.isBlocking = true
        z.on_value_change = (v) => this.setZoom(v)
        this.add_drawable(z, 7)
        em.on("boss", () => z.deactivate())
        em.on("noboss", () => z.activate())
    }


    startBossfight() {
        this.hotswap(this.heads)
        this.w.worldRect.putOver(this.rect)
        this.canDrag = false
    }

    cancelBossfight() {
        this.hotswap(this.spire)
        this.setZoom(this.zoomLevel)
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
        let cb = null
        this.offerer.on_release = () => {
            if (cb) return
            this.fullViewer.closesOnRelease = false
            const headsLeft = Spot.ALL.filter(x => !x.done).length - 1
            let str =
                `You will have ${minutes[0]} minutes to fight this head.`
                + `\nIf you fail, you CANNOT try again.`
                + `,\nYou will have less time for the following heads.`
            /*
            str += `\nAfter this fight, you will have `
            if (minutes.slice(1, -1).length == 1)
                str += minutes.slice(1, -1).join(", ") + " minutes for the next head, then\n"
            if (minutes.slice(1, -1).length > 1)
                str += minutes.slice(1, -1).join(", ") + " minutes for the next heads respectively, then\n"
            str += `${minutes.at(-1)} minutes for each head afterwards.`
            */
            str += `\n\nFight this head?`
            cb = GameEffects.confirmBox(str, { sizeFrac: [.8, .5] }).promise()
                .then(() => { cleanup(); this.acceptToCutHead(spot) })
                .catch(() => { this.fullViewer.closesOnRelease = true })
                .finally(() => cb = null)
        }

    }
    /**@param {Spot} spot  */
    acceptToCutHead(spot, doNotRemoveMinutes = false) {
        em.emit("startHead", spot)
        if (this.timer) { console.error("Already cutting a head..."); return }
        const secVal = this.minutes[0] * 60
        if (!doNotRemoveMinutes && (this.minutes.length > 1)) this.minutes.shift()
        this.fullViewer.open(spot)
        this.fullViewer.img = spot.maskIMG
        this.fullViewer.closesOnRelease = false
        this.calculaAnimate()
        /**@type {Button & {cleanup:Function(),renew():Function(),secondsLeft:number}} */
        const timer = this.timer = Button.fromRectShallow(this.offerer)
        timer.bottomat(this.HEIGHT)
        timer.dynamicColor = () => `rgba(20,20,150,${.7 * (1 + (this.gentleSin - 1) * 2)})`
        timer.fontSize = GRAPHICS.FONT_BIG
        timer.secondsLeft = secVal
        timer.renew = () =>
            timer.txt = `Time left: `
            + `${[Math.floor(timer.secondsLeft / 60), timer.secondsLeft % 60].map(x => ("" + x).padStart(2, "0")).join(":")}`

        timer.renew()
        const cleanup = () => {
            this.remove_drawable(timer)
            this.timer = null
            clearInterval(int)
            this.checkVictory()
            this.fullViewer.closesOnRelease = true
            em.off("correct", cleanup)
        }
        timer.cleanup = () => cleanup
        this.add_drawable(timer, 8)
        const int = setInterval(() => {
            timer.secondsLeft -= 1
            timer.renew()
            if (timer.secondsLeft <= 0) { spot.onFail(); cleanup() }
            em.emit("save")
        }, 1000)
        em.on("correct", cleanup) //will be removed!
    }
    checkVictory() {
        if (Spot.ALL.every(x => x.done)) sm.skipTo(4)//Defeat
        if (Spot.ALL.every(x => x.done && !x.failed)) {
            sm.skipTo(5) //also victory
        }
    }




    emosToLines(emos) {
        return MM.reshape([...emos], GRAPHICS.EMOS_BREAK).map(x => x.join("")).join("\n")
    }
    initBCreceive(doNotAddEggs = false) {
        this.spire.concat(this.heads).forEach((x, _) => {
            x.emos = ""
            const b = x.emoButton = Button.fromRectShallow(x.button)
            b.textSettings.textAlign = "left"
            b.textSettings.textBaseline = "top"
            b.transparent = true
            b.fontSize = GRAPHICS.EMOS_FONTSIZE
            b.topat(x.button.bottom)
            x.button.anchor_list.push(b)
            b.dynamicText = () => x.emos
            x.push(b)
        })
        !doNotAddEggs && chat.eggs("bc", bc => this.receiveBroadcast(bc))
    }

    receiveBroadcast(bc) {
        bc.s.forEach((x, i) => this.spire[i].emos = this.emosToLines(x))
        bc.h.forEach((x, i) => this.heads[i].emos = this.emosToLines(x))
        this.showPlayers.txt = "Players:\n" + bc.n.join("\n")
        this.receiveBroadcastClientExtras?.(bc)
    }
}