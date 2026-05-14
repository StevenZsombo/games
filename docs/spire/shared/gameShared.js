const em = new EventManager()
const EVENTS = {
    solve: "solve",
    plan: "plan",
    climb: "climb",
    hide: "hide",
    show: "show",
}
/**@type {StateManager & {skipTo:Function(i):void}} */
const sm = new StateManager()
sm.create(-1).txt = "Connecting"
sm.trans(-1)
sm.create(0).txt = "Waiting"
sm.create(1).txt = "Planning"
sm.create(2).txt = "Climbing"
sm.create(3).txt = "Bossfight!"
sm.create(4).txt = "Victory"
sm.skipTo = (i) => {
    while (sm.currentKey < i) {
        sm.trans(sm.currentKey + 1)
    }
}
/*stages:
-1 connecting
0 waiting to start
1 planning
2 climb
3 bossfight
4 victory
 */

class Spot extends Malleable {
    isBlocking = true
    /**@type {Spot[]} */
    static ALL = []
    constructor(id = null, x = MM.random(200, 1700), y = MM.random(200, 800)) {
        super()
        if (id != null && Spot.ALL[id]) throw new Error(`Spot with id ${id} already exists.`)
        this.id = id ?? Spot.ALL.length
        Spot.ALL.push(this)

        const button = this.button = new Button({
            x, y,
            width: GRAPHICS.SPOT_WIDTH, height: GRAPHICS.SPOT_HEIGHT,
            imgScale: 0,
            color: GRAPHICS.SPOT_COLOR,
            isBlocking: true, spot: this
        })
        const label = this.label = Button.fromButton(button, {
            transparent: true,
            fontSize: GRAPHICS.FONT_MEDIUM,
            isBlocking: false, spot: this
        })
        if (RULES.EDITOR) {
            Button.make_draggable(button)
            Button.make_draggable(label)
        }
        this.push(button, label)

        /**@type {Set<Spot>} */
        this.above = new Set()
        /**@type {Set<Spot>} */
        this.below = new Set()

        this.canMoveTo = false
        em.on("solve", spot => { if (this.below.has(spot)) this.canMoveTo = true })
        em.on("climb", () => { if (this.below.size == 0) this.canMoveTo = true })
        em.on("hide", () => { this.label.txt = "HIDDEN"; this.label.transparent = false })
        em.on("show", () => {
            this.label.txt = RULES.EDITOR ? this.sol : this.done ? "SOLVED" : ""
            this.label.transparent = true
        })

        this.sol = 1234567890
        this.done = false
        if (RULES.EDITOR) { this.label.txt = this.sol }
        else { this.button.on_release = () => this.onInteract() }
    }
    attempt(guess) {
        guess == this.sol ? this.correctGuess() : this.incorrectGuess()
    }
    correctGuess() {

    }
    incorrectGuess() {

    }
    goFullscreen() {
        const fullViewer = game.fullViewer
        fullViewer.img = this.button.img
        fullViewer.activate()

    }
    onInteract() {
        if (!this.canMoveTo) this.goFullscreen()
        else { GameEffects.popup("interaction placeholder") }
    }
    setIMG(file) {
        if (file.endsWith(".png")) file = file.slice(0, -4)
        this.button.img = cropper.load_img(RULES.QUESTION_FOLDER + file + ".png")
    }
    setSol(value) {
        this.sol = +value
        if (RULES.EDITOR) this.label.txt = this.sol
    }

    toJSON() {
        return {
            id: this.id,
            x: this.button.x,
            y: this.button.y,
            sol: this.sol,
            above: Array.from(this.above).map(x => x.id),
            below: Array.from(this.above).map(x => x.id),
        }
    }
    /** @param {ReturnType<this['toJSON']>[]} data */
    static fromJSONall(data) {
        game?.remove_drawables_batch(Spot.ALL)
        Spot.ALL.length = 0
        data.forEach(x => new Spot(x.id, x.x, x.y))
        data.forEach(x => {
            const spot = Spot.ALL[x.id]
            spot.sol = x.sol
            x.below.forEach(k => spot.below.add(Spot.ALL[k]))
            x.above.forEach(k => spot.above.add(Spot.ALL[k]))
        })
    }
}

class GameShared extends GameCore {
    initShared() {
        this.initEditor()
        this.layers[4] = Spot.ALL
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
        this.add_drawable(lineDrawable, 7) //arrows for now?

        const circleDrawable = this.circleDrawable = {
            draw: (ctx) => {
                Spot.ALL.forEach(x => {
                    if (x.canMoveTo) MM.drawEllipseOnRect(ctx, x.button, { gentleSin: this.gentleSin })
                })
            }
        }
        this.add_drawable(circleDrawable, 6)

        const sinteract = this.sinteract = new Clickable(this.rect)
        sinteract.draw = null
        sinteract.on_drag = (pos) => {
            Spot.ALL.flatMap(x => [x.button, x.label]).forEach(b =>
                b.move(
                    0,
                    //pos.x - sinteract.last_held.x,
                    pos.y - sinteract.last_held.y))
        }
        this.add_drawable(sinteract, 1)



        const fullViewer = this.fullViewer = Button.fromRectShallow(this.rect, {
            isBlocking: false,
            outline: 0,
            interactable: false,
            visible: false,
            isBlocking: true,
            height: this.HEIGHT - GRAPHICS.BOTTOM,
            color: GRAPHICS.SPOT_COLOR,
            on_release: () => fullViewer.deactivate()
        })
        this.add_drawable(fullViewer, 7)
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
            this.keyboarder.held["s"] = false
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
        this.keyboarder.on_keyupDict["d"] = () => {
            const spot = this.findSpotOnMouse()
            if (!spot) return
            Spot.ALL.forEach(x => {
                x.below.delete(spot)
                x.above.delete(spot)
            })
        }
        this.keyboarder.on_keyupDict["t"] = () =>
            this.findSpotOnMouse()?.onInteract()
        this.keyboarder.on_keyupDict["o"] = () =>
            this.exportALL()
        this.keyboarder.on_keyupDict["i"] = () =>
            this.importALL()

    }


}