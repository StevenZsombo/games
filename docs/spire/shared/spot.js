const em = new EventManager()
const EVENTS = {
    correct: "correct", //spot
    incorrect: "incorrect", //guess
    head: "head",//spot
    save: "save",//
    fail: "fail", //spot
    plan: "plan",//()
    climb: "climb",//()
    boss: "boss",//()
    noboss: "noboss",//()
    fin: "fin",//(),
    win: "win",//()
    startHead: "startHead",//spot
    wait: "wait",//()
    hide: "hide",//()
    show: "show",//()
    full: "full",//()
}
/**@type {StateManager & {skipTo:Function(i):void}} */
const sm = new StateManager()
sm.create(-1).txt = "Connecting"
sm.trans(-1)
sm.create(0).txt = "Waiting"
sm.create(1).txt = "Planning"
sm.create(2).txt = "Climbing"
sm.create(3).txt = "Bossfight!"
sm.create(4).txt = "Finished"
sm.create(5).txt = "Flawless victory!"
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
            isBlocking: RULES.EDITOR,
            spot: this
        })
        const label = this.label = Button.fromButton(button, {
            transparent: true,
            outline: 0,
            color: GRAPHICS.SPOT_COLOR_HIDDEN,
            fontSize: GRAPHICS.FONT_BIG,
            isBlocking: false,
            spot: this
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

        this.isHydra = false

        this.canMoveTo = false
        em.on("correct", spot => {
            if (this.below.has(spot)) this.canMoveTo = true
        })
        em.on("climb", () => { if (this.below.size == 0) this.canMoveTo = true })
        em.on("hide", () => this.onHide())
        em.on("show", () => this.onShow())

        this.sol = 666666
        this.done = false
        this.failed = false
        this.isHidden = true
        if (RULES.EDITOR) { this.label.txt = this.getEditorText() }
        else { this.button.on_release = () => this.onInteract() }
    }
    attempt(guess) {
        const correct = RULES.ACCURACY_FUNCTION(guess, this.sol)
        correct ? this.onCorrectGuess() : this.onIncorrectGuess(guess)
        return correct

    }
    onCorrectGuess() {
        this.done = true
        this.label.txt = "SOLVED"
        this.label.color = GRAPHICS.SPOT_COLOR_SOLVED_OPAQUE
        this.label.transparent = false
        game.fullViewer.close()
        // this.button.color = GRAPHICS.SPOT_COLOR_SOLVED
        em.emit("correct", this)
        if (this.mask) em.emit("head", this)
    }
    onIncorrectGuess(guess) {
        em.emit("incorrect", guess)
    }
    onFail() {
        this.failed = true
        this.done = true
        this.button.visible ? this.onShow() : this.onHide()
        game.fullViewer.close()
        game.timer?.cleanup?.()
        em.emit("show")
        em.emit("fail", this)
    }

    goFullscreen() {
        if (this.isHidden) return
        const fullViewer = game.fullViewer
        fullViewer.open(this)
        if (this.mask) game.offerToCutHead(this)

    }

    onShow() {
        this.isHidden = false
        if (this.isHydra) { this.label.txt = "Hydra"; return }
        this.label.txt = RULES.EDITOR ? this.getEditorText() : this.done ? (this.failed ? "FAILED" : "SOLVED") : ""
        this.label.transparent = !this.done //some weird logic thing
        if (this.failed) this.label.color = GRAPHICS.SPOT_COLOR_FAILED_OPAQUE
    }
    onHide() {
        this.isHidden = true
        if (this.isHydra) { this.label.txt = "Hydra"; return }
        this.label.txt = "HIDDEN"
        this.label.transparent = false
    }
    onInteract() {
        if (this.isHydra) { this.onInteractHydra(); return }
        if (!this.canMoveTo) this.goFullscreen()
        else this.goFullscreen()
    }
    setIMG(file) {
        if (file.endsWith(".png")) file = file.slice(0, -4)
        this.button.img = cropper.load_img(RULES.QUESTION_FOLDER + file + ".png")
        this.file = file
    }
    setMaskIMG(mask) {
        if (mask.endsWith(".png")) mask = mask.slice(0, -4)
        this.maskIMG = cropper.load_img(RULES.QUESTION_FOLDER + mask + ".png")
        this.mask = mask
        if (RULES.EDITOR) this.label.txt = this.getEditorText()
    }
    setSol(value) {
        this.sol = +value
        if (RULES.EDITOR) this.label.txt = this.getEditorText()
    }

    makeHydra() {
        Spot.ALL.forEach(x => {
            x.isHydra = false
        })
        this.isHydra = true
        this.isHidden ? em.emit("hide") : em.emit("show")

    }
    onInteractHydra() {
        if (this.isHidden) return
        if (!this.canMoveTo) {
            GameEffects.popup("Ascend the spire to fight the Hydra.", { moreButtonSettings: { color: "lightblue" } })
            return
        }
        game.once(() => em.emit("boss"))
    }

    toJSON() {
        return {
            id: this.id,
            x: this.button.x,
            y: this.button.y,
            sol: this.sol,
            file: this.file,
            mask: this.mask,
            isHydra: this.isHydra,
            above: Array.from(this.above).map(x => x.id),
            below: Array.from(this.below).map(x => x.id),
        }
    }
    /** @param {ReturnType<this['toJSON']>[]} data */
    static fromJSONall(data) {
        Spot.ALL.length = 0
        data.forEach(x => new Spot(x.id, x.x, x.y))
        data.forEach(x => {
            const spot = Spot.ALL[x.id]
            spot.sol = x.sol
            x.file && spot.setIMG(x.file)
            x.mask && spot.setMaskIMG(x.mask)
            x.above.forEach(k => spot.above.add(Spot.ALL[k]))
            x.below.forEach(k => spot.below.add(Spot.ALL[k]))
            if (x.isHydra) spot.makeHydra()
        })
        if (RULES.EDITOR) Spot.ALL.forEach(x => x.label.txt = x.isHydra ? "Hydra" :
            "" + x.sol + (x.mask ? `\n[${x.mask}]` : ""))
    }
    getEditorText() {
        return this.isHydra ? "Hydra"
            : "" + this.sol + (this.mask ? `\n[${this.mask}]` : "")
    }
    static moveAll(byHowMuch) {
        if (!byHowMuch) return
        Spot.ALL.forEach(x => x.forEach(y => y.move(0, byHowMuch)))

    }
    disconnect() {
        this.below.clear()
        this.above.clear()
        Spot.ALL.forEach(x => {
            x.below.delete(this)
            x.above.delete(this)
        })
    }
    remove() {
        this.disconnect()
        const ind = Spot.ALL.indexOf(this)
        if (ind == -1) throw new Error("Somehow the spot is not found...")
        Spot.ALL.splice(ind, 1)
        Spot.ALL.forEach((x, i) => x.id = i)
    }
}