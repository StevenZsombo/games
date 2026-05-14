class GameShared extends GameCore {
    initShared() {
        this.initEditor()
        this.initFake()
        const spotMall = new Malleable()
        spotMall.components = Spot.ALL
        spotMall.isBlocking = true
        this.add_drawable(spotMall, 4)
        this.bot = new Button({
            width: this.WIDTH, height: GRAPHICS.BOTTOM,
            x: 0, y: this.HEIGHT - GRAPHICS.BOTTOM,
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
                            { color: "black", outline: 10, size: 50 })
                    )

                )
            }
        }
        this.add_drawable(lineDrawable, 6) //arrows for now?

        const circleDrawable = this.circleDrawable = {
            draw: (ctx) => {
                Spot.ALL.forEach(x => {
                    if (x.canMoveTo && !x.done) MM.drawEllipseOnRect(ctx, x.button, { gentleSin: this.gentleSin })
                })
            }
        }
        this.add_drawable(circleDrawable, 6)

        const sinteract = this.sinteract = new Clickable(this.rect)
        sinteract.draw = null
        sinteract.on_drag = (pos) => {
            Spot.moveAll(pos.y - sinteract.last_held.y)
        }
        this.add_drawable(sinteract, 1)


        /**@type {Button&{close:Function()}} */
        const fullViewer = this.fullViewer = Button.fromRectShallow(this.rect, {
            isBlocking: false,
            outline: 0,
            interactable: false,
            visible: false,
            isBlocking: true,
            height: this.HEIGHT - GRAPHICS.BOTTOM,
            color: GRAPHICS.SPOT_COLOR,
            close() { this.deactivate(); this.spot = null },
            on_release() { this.close() },
        })
        fullViewer.spot = null
        this.add_drawable(fullViewer, 7)

        if (RULES.SCROLLWHEEL_SPEED) {
            this.mouser.on_wheel = (mouser) => {
                let howmuch = RULES.SCROLLWHEEL_SPEED
                howmuch *= (mouser.wheel > 0 ? -1 : 1)
                Spot.moveAll(howmuch)
            }
        }

        em.on("correct", () => GameEffects.popup("Correct!"))
        em.on("incorrect", (guess) => GameEffects.popup(`Your solution of ${guess} is incorrect.`,
            GameEffects.popupPRESETS.bigRed
        ))
        em.on("wait", () => { sm.skipTo(0) })
        em.on("plan", () => { sm.skipTo(1) })
        em.on("climb", () => { sm.skipTo(2) })
        em.emit("hide")
        sm.states.get(0).on_enter = () => em.emit("hide")
        sm.states.get(1).on_enter = () => em.emit("show")
        sm.states.get(2).on_enter = () => {
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
    }


    importALL() {
        MM.importJSON().then(data => Spot.fromJSONall(data))
    }

    exportALL() {
        const out = JSON.stringify(Spot.ALL)
        MM.downloadFile(out, "spire" + MM.lettersAndNumberOnly(MM.dateAndTime()) + ".json")
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
        this.keyboarder.on_keyupDict["x"] = () =>
            this.editorHelper.visible ^= 1

        const e = this.editorHelper = new Button()
        e.width = 400
        e.height = 800
        e.rightat(this.rect.right)
        e.y = 0
        e.transparent = true
        e.textSettings = { textAlign: "left", textBaseLine: "top" }
        e.font_font = "myMonospace"
        e.txt = ("A:add,Q:question,S:solution,C:connect(drag),L:level(row),"
            + "T:tap(mimic user input),P:progress(start or guess),"
            + "D:disconnect,R:remove,O:output(export),I:input(import),,X:show/hide these hints")
            .split(",").join("\n")
        this.add_drawable(e, 9)
    }
    initFake() {
        if (!RULES.FAKE) return
        const fake = new Button({ width: 150, height: 80, txt: "fakeServer", isBlocking: true })
        fake.topat(0)
        fake.rightat(this.WIDTH)
        fake.on_release = () => {
            const arr = ["show", "hide", "wait", "plan", "climb"]
            const parr = []
            parr.push(["Import", () => this.importALL()])
            parr.push(...arr.map(x => [x, () => em.emit(x)]))
            const ddm = GameEffects.dropDownMenu(parr)
            this.mouser.on_release_once = () => this.once(ddm.close)
        }
        this.add_drawable(fake)
    }


    initBossfight() {
        this.fullViewer.close()
        const bossBG = this.bossBG = Button.fromRectShallow(this.rect, {
            isBlocking: true
        })

    }

}