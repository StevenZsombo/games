//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: true,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "auto",
    //BROKEN
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    //BROKEN
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_first_run_blocking: null,
    on_first_run_async: null, //async function. overrides on_first_run_blocking
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: true,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}
//#endregion

let lineStart = null
let lineButton = null
/**@type {Set<[Button,Button]>} */
let lines = new Set()

class Poly {
    static universalFn = x =>
        Number.isFinite(x) ? (Number.isInteger(x) ? x : +x.toPrecision(3)) : x
    constructor(value, container) {
        this.value = value
        this.button = new Button({
            width: 120,
            height: 80,
            check: null,
            color: "yellow",
            txt: Poly.universalFn(value),
            fontSize: 48,
            // visible: false
        })
        this.where = this._container = container
    }
    get where() { return this._container }
    set where(but) { this._container = but; this.button.centerinRect(but); but.hold = this }
}

const em = new EventManager()
em.isLogging = false

const tobeadded = new Set()
const tobedeleted = new Set()

class Piece {
    constructor(type, fn, latex, props) {
        fn ??= Piece.TYPES[type][0]
        latex ??= Piece.TYPES[type][1]
        props ??= Piece.TYPES[type][2] ?? {}
        this.type = type
        /**@type {function(...number):number} */
        this.fn = fn
        this.button = Button.make_latex(new Button({
            width: 200,
            height: 120,
            isBlocking: true,
        }))
        if (props.x) this.button.x = props.x
        if (props.y) this.button.y = props.y
        this.tex = latex
        this.button.imgScale = 2.5
        const inputsNr = props.inputs ?? fn.length
        this.inputs = []
        for (let i = 0; i < inputsNr; i++) {
            const inB = new Button({
                width: 50,
                height: 50,
                isBlocking: true,
                txt: Piece.variableNames[i]
            })
            inB.centeratX(this.button.left)
            inB.tag = "in"
            inB.on_click = (pos) => {
                lineStart = pos
                lineButton = inB
            }
            inB.hold = null
            this.inputs.push(inB)
        }
        this.inputs.forEach((x, i) => {
            x.centeratY(Anim.interpol(this.button.top - 25, this.button.bottom + 25, (i + 1) / (1 + this.inputs.length)))
        })
        const outputsNr = props.outputs ?? 1
        this.outputs = []
        for (let i = 0; i < outputsNr; i++) {
            const outB = new Button({
                width: 50,
                height: 50,
                isBlocking: true
            })
            outB.centeratX(this.button.right)
            outB.tag = "out"
            outB.on_click = (pos) => {
                lineStart = pos
                lineButton = outB
            }
            outB.hold = null
            this.outputs.push(outB)
        }
        this.outputs.forEach((x, i) => {
            x.centeratY(Anim.interpol(this.button.top - 25, this.button.bottom + 25, (i + 1) / (1 + this.outputs.length)))
        })

        if (!props.nodrag) Button.make_draggable(this.button)
        const others = this.inputs.concat(this.outputs)
        others.concat(this.button).forEach(x => {
            x.piece = this
        })
        Button.make_anchor(this.button, [])
        Object.defineProperty(this.button, "anchor_list", {
            get() { return others.concat(others.map(x => x.hold?.button)).filter(x => x) }
        })
        this.panel = new Malleable(this.button, ...others)
        this.panel.isBlocking = true

    }
    set tex(v) { this.button.latex.tex = v }
    get tex() { return this.button.latex.tex }


    process() {
        //inB should be an array of buttons
        //when all are filled, have this run and process. 
        //thus needs reactor access
        //could make something fun out of this
        if (this.type == "in") return
        if (this.inputs.some(x => !x.hold)) return
        if (this.type == "out") return em.emit("submitted", this.inputs[0].hold)
        if (this.outputs.some(x => x.hold)) return
        const out = this.fn(...this.inputs.map(x => x.hold.value))
        if (!Array.isArray(out)) {
            em.emit("processed", out, this.outputs[0], this.inputs.map(x => x.hold))
        } else {
            out.forEach((u, i) => {
                em.emit("processed", u, this.outputs[i], this.inputs.map(x => x.hold))
            })
        }
    }

    static variableNames = ["x", "y", "z"]

    static TYPES = {
        in: [x => x, String.raw`\text{IN}`, { inputs: 0, nodrag: false, x: 30, y: 30 }],
        out: [x => x, String.raw`\text{OUT}`, { outputs: 0, nodrag: false, x: 1630, y: 950 }],
        square: [x => x ** 2, String.raw`x^2`],
        sqrt: [x => Math.sqrt(x), String.raw`\sqrt{x}`],
        triple: [x => 3 * x, String.raw`3 x`],
        halve: [x => x / 2, String.raw`\frac{x}{2}`],
        sgn: [x => Math.sign(x), String.raw`\text{sign}(x)`],
        copy: [x => [x, x], String.raw`\text{COPY}`, { outputs: 2 }],
        add: [x => x + 1, String.raw`x+1`],
        remove: [x => x - 1, String.raw`x-1`],
        floor: [x => Math.floor(x), String.raw`\lfloor x \rfloor`],
        sum: [(x, y) => x + y, String.raw`x+y`],
        diff: [(x, y) => x - y, String.raw`x-y`],
        prod: [(x, y) => x * y, String.raw`x \cdot y`]
    }
    static preset(type) {
        return new Piece(type)
    }
}


class Level {
    constructor(stage, instructions, outputsOrRule, inputsOrFunc) {
        this.STAGE = stage
        this.INSTRUCTIONS = instructions
        const INPUTS = Array.isArray(inputsOrFunc) ? inputsOrFunc : Array(30).fill().map(_ => inputsOrFunc?.() ?? MM.randomInt(-100, 100))
        const OUTPUTS = Array.isArray(outputsOrRule) ? outputsOrRule : INPUTS.map(x => outputsOrRule(x))
        this.INPUTS = INPUTS
        this.OUTPUTS = OUTPUTS.filter(x => Number.isFinite(x)).map(Poly.universalFn)
    }
}

class Game extends GameCore {
    /**@type {Set<Piece>}*/
    pieces = new Set()
    get piecesArr() { return Array.from(this.pieces) }
    getIDArrAll() { return this.piecesArr.flatMap(p => [p.type, ...p.inputs, ...p.outputs]) }
    getSaveData() {
        const pieces = this.piecesArr
        const types = pieces.map(x => x.type)
        const positions = pieces.map(x => [x.button.x, x.button.y].map(Math.round))
        const all = this.getIDArrAll()
        const linesID = Array.from(lines).map(x => x.map(u => all.indexOf(u)))
        return {
            stage: this.level.STAGE,
            types,
            positions,
            lines: linesID
        }
    }
    saveSave() {
        const saveData = this.getSaveData()
        const str = JSON.stringify(saveData)
        console.log(str)
        return str


    }
    loadSave(data) {
        const saveData = JSON.parse(data || prompt("Save data:"))
        if (this.level.STAGE !== saveData.stage) throw new Error(`badness: saveData has ${saveData.stage} isntead of ${this.level.STAGE}`)
        this.pieces.forEach(x => this.deletePiece(x))
        saveData.types.forEach(key =>
            this.addPiece(key))
        this.initLevel()
        const pieces = this.piecesArr
        saveData.positions.forEach(([x, y], i) => {
            pieces[i].button.x = x
            pieces[i].button.y = y
        })
        const all = this.getIDArrAll()
        lines.clear()
        saveData.lines.forEach(([i, j]) =>
            lines.add([all[i], all[j]])
        )
    }
    addPiece(key) {
        const p = Piece.preset(key)
        this.pieces.add(p)
        this.w.add_drawable(p.panel)
    }
    deletePiece(piece) {
        this.pieces.delete(piece)
        this.w.remove_drawable(piece.panel)
    }
    resetInputs() {
        this.polys?.forEach(x => x.where.hold = null)
        this.polys?.clear()
        tobeadded.clear()
        // tobedeleted.clear()

        this.RECEIVED = []
        this.SUBMITTED = []
    }
    initLevel() {
        this.resetInputs()
        this.input = this.piecesArr.find(x => x.type == "in")
        lines.clear()
    }

    //#region initialize_more
    async initialize_more() {
        const levels = {
            "square": ["Square each input", x => x ** 2],
            "abs": ["Take absolute value", x => Math.abs(x)],
            "noneg": ["Return the nonnegative inputs only", x => x >= 0 ? x : null],
            "double": ["Double each input.", x => 2 * x],
            "cube": ["Raise each input to the third power", x => x ** 3],
            "mulfive": ["Multiply by 5.", x => x * 5],
            "isint": ["Return 1 for integers, and 0 otherwise.", x => Number.isInteger(x) ? 1 : 0, () => +(MM.random(-100, 100).toPrecision(3))],
            "isodd": ["Return 1 for odd input, and 0 otherwise.", x => Math.abs(x % 2)],
        }
        let stage
        while (true) {
            stage = await GameEffects.nameSelect(["Tutorial message"].concat(Array.from(Object.keys(levels))), {
                topText: "Select level:",
                doNotConfirm: true
            }).promise()
            if (stage !== "Tutorial message") break
            else GameEffects.popup(`
IN produces inputs, OUT creates outputs.
All other modules map from left to right like a function.

You can drag the modules around, and you can connect them.
Connect the right side of any module to the left side of any other.
`,
                { close_on_release: true, floatTime: 8000 }, GameEffects.popupPRESETS.megaBlue)
        }
        const level = this.level = new Level(stage, ...levels[stage])
        this.initLevel()

        const game = this
        const w = this.w = new GameWorld(this.rect.copy)
        this.add_drawable(w, 4)
            /*
            this.underlay = Button.fromRect(w.screenRect, { visible: false })
            w.make_button_on_screen_drag_world(this.underlay)
            this.add_drawable(this.underlay, 2)
            */

            ;
        (() => {
            Object.keys(Piece.TYPES).concat("copy").forEach(x => this.addPiece(x))
            const pos =
                [[30, 30], [1710, 950], [62, 428], [67, 561], [37, 700], [117, 841], [342, 566], [350, 409], [377, 710], [378, 870], [613, 532], [743, 664], [645, 797], [740, 936], [689, 394]]
            pos.forEach((u, i) => this.piecesArr[i].button.topleftat(u[0], u[1]))

        })()

        this.mouser.on_release = (pos) => {
            if (!lineStart) return
            lineStart = null
            let match = this.piecesArr
                .flatMap(x => lineButton.tag == "in" ? x.outputs : x.inputs)
                .filter(x => x != null)
                .find(x => x.collidepoint(pos.x, pos.y))
            if (match && (match.piece !== lineButton.piece)) {
                const inOut = lineButton.tag == "out"
                    ? [lineButton, match]
                    : [match, lineButton]
                const existing = Array.from(lines).find(x => x[0] == inOut[0] && x[1] == inOut[1])
                if (existing) lines.delete(existing)
                else lines.add(inOut)
            }
            lineButton = null
        }
        const linesDrawable = {
            /**@param {RenderingContext} ctx  */
            draw(ctx) {
                if (lineStart) {
                    const { x, y } = game.mouser.pos
                    MM.drawLine(ctx, lineStart.x, lineStart.y, x, y)
                }
                lines.forEach(([a, b]) =>
                    MM.drawLine(ctx, a.cx, a.cy, b.cx, b.cy))
            }
        }
        w.add_drawable(linesDrawable, 6)

        this.input = this.piecesArr.find(x => x.type == "in")
        /**@type {Set<Poly>} */
        const polys = this.polys = new Set()
        em.on("processed", (value, target, toDeleteArr) => {
            tobeadded.add([value, target]);
            toDeleteArr && [].concat(toDeleteArr).forEach(p => tobedeleted.add(p))
        })
        em.on("submitted", poly => {
            tobedeleted.add(poly)
            this.SUBMITTED.push(Poly.universalFn(poly.value))
            console.log("Submitted", poly.value)
            if (this.level.OUTPUTS.length == this.SUBMITTED.length) this.checkVictory()
        })
        em.on("received", v => {
            console.log("Received", v)
        })
        this.tempAnimStorage = []
        const _move = (buttonWhat, buttonFrom, buttonTo) => {
            const cp = buttonWhat.copy
            cp.visible = true
            buttonWhat.visible = false
            w.add_drawable(cp)
            return Anim.custom(cp, stepTime, (t) => {
                cp.centerat(
                    Anim.interpol(buttonFrom.cx, buttonTo.cx, t),
                    Anim.interpol(buttonFrom.cy, buttonTo.cy, t),
                )
            }, "", {
                ditch: true, on_end: () => {
                    w.remove_drawable(cp)
                    buttonWhat.visible = true
                }
            })

        }
        const _away = (buttonWhat) => {
            const cp = buttonWhat.copy
            cp.visible = true
            buttonWhat.visible = false
            w.add_drawable(cp)
            return new Anim(
                cp, stepTime * .5, Anim.f.scaleToFactor,
                {
                    ditch: true, scaleFactor: 0, on_end: () => {
                        w.remove_drawable(cp)
                        buttonWhat.visible = true
                    }
                }
            )
        }
        em.on("move", (what, from, to) => {
            this.tempAnimStorage.push(_move(what, from, to))
        })
        em.on("away", (what) => {
            this.tempAnimStorage.push(_away(what))
        })
        let stepTime = 250
        // const INPUTS = Array(20).fill().map(x => MM.randomInt(-50, 50))
        // const OUTPUTS = INPUTS.map(x => Math.abs(x % 2))
        // const INSTRUCTIONS = "Output 1 for odd, 0 for even."
        const { INPUTS, OUTPUTS, INSTRUCTIONS } = level
        this.RECEIVED = []
        this.SUBMITTED = []
        this.isProducingInputs = false
        const step = () => {
            if (this.isProducingInputs && !this.input.outputs[0].hold && this.RECEIVED.length < INPUTS.length) {
                const v = INPUTS[this.RECEIVED.length]
                this.RECEIVED.push(v)
                tobeadded.add([v, this.input.outputs[0]])
                em.emit("received", v)
            }
            const newlyFilled = new Set()
            for (const [outB, inB] of lines) {
                if (!outB.hold) continue
                if (inB.hold) continue
                if (newlyFilled.has(inB)) continue
                tobeadded.add([outB.hold.value, inB])
                tobedeleted.add(outB.hold)
                newlyFilled.add(inB)
                // em.emit("move", outB.hold.button, outB, inB)
            }
            for (const p of this.pieces) {
                p.process()
            }

            this.tempAnimStorage.forEach(x => this.animator.add_anim(x))


            for (const [val, but] of tobeadded)
                if (Number.isFinite(val))
                    polys.add(new Poly(val, but))
            for (const p of tobedeleted) {
                polys.delete(p)
                p.where.hold = null
            }
            tobeadded.clear()
            tobedeleted.clear()

        }
        const polysDrawable = {
            draw(ctx) {
                for (const p of polys) {
                    p.button.draw(ctx)
                }
            }
        }
        w.add_drawable(polysDrawable, 7)
        const on_clockwork = []
        const clockwork = this.animator.createClockwork(stepTime, () => on_clockwork.forEach(fn => fn()))
        on_clockwork.push(step)


        const corner = new Button({ width: 400, height: this.HEIGHT, y: 0, transparent: true })
        corner.rightat(this.WIDTH)
        corner.textSettings.textAlign = "right"
        corner.textSettings.textBaseline = "top"
        corner.font_font = "myMonospace"
        corner.dynamicText = () => `${INSTRUCTIONS}\n${MM.tableStr(
            MM.transposeArray([INPUTS, INPUTS.map((x, i) => this.level.OUTPUTS[i] ?? ""), INPUTS.map((x, i) => this.SUBMITTED[i] ?? "")]),
            "INPUTS OUTPUTS SUBMITTED".split(" "),
            3
        )}`
        const stopStart = new Button({
            width: 600, height: 60,
            color: "yellow",
            y: 0, txt: "Connect modules, then click here to start."
        })
        stopStart.centeratX(this.rect.centerX)
        stopStart.on_click = () => {
            this.isProducingInputs = true
            stopStart.deactivate()
        }
        this.add_drawable(stopStart)
        this.add_drawable(corner)
        const tools = new Button({ width: 200, height: 100, txt: "Menu", x: 0 })
        tools.bottomat(this.HEIGHT)
        this.add_drawable(tools)
        this.keyboarder.on_copy = () => this.getSaveData()
        this.keyboarder.on_paste = val => this.loadSave(val)
        tools.on_release = () => {
            const ddm = GameEffects.dropDrownBetter(
                [
                    ["Reset", () => this.resetInputs()],
                    ["Erase", () => this.initLevel()],
                    [`stepTime = ${stepTime}`, () => stepTime = clockwork.interval = +prompt()],
                    ["hide errors", wDiv.hide],
                    ["Back to levels", () => main()],
                ]
            )
        }

    }
    //#endregion



    checkVictory = () => {
        if (this.SUBMITTED.every((x, i) =>
            x == this.level.OUTPUTS[i]
        )) {//win
            GameEffects.fireworksShow()
            GameEffects.popup("VICTORY!")
        } else {//lose
            GameEffects.popup("you lose")
        }
    }



    //#region update_more
    update_more(dt) {






    }
    //#endregion


    //#region draw_more
    draw_more(screen) {






    }
    //#endregion

    //#region next_loop_more
    next_loop_more() {




    }//#endregion



    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
