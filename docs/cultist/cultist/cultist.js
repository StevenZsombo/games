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
    constructor(value, container) {
        this.value = value
        this.button = new Button({
            width: 120,
            height: 80,
            check: null,
            color: "yellow",
            txt: value,
            fontSize: 48
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
            width: 280,
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
        in: [x => x, String.raw`\text{IN}`, { inputs: 0, nodrag: true, x: 30, y: 30 }],
        out: [x => x, String.raw`\text{OUT}`, { outputs: 0, nodrag: true, x: 1630, y: 950 }],
        square: [x => x ** 2, String.raw`x^2`],
        sqrt: [x => Math.sqrt(x), String.raw`\sqrt{x}`],
        double: [x => 2 * x, String.raw`2 x`],
        halve: [x => x / 2, String.raw`\frac{x}{2}`],
        sgn: [x => Math.sign(x), String.raw`\text{sign}(x)`],
        copy: [x => [x, x], String.raw`\text{COPY}`, { outputs: 2 }],
        add: [x => x + 1, String.raw`x+1`],
        remove: [x => x - 1, String.raw`x-1`],
        floor: [x => Math.floor(x), String.raw`\lfloor x \rfloor`],
        sum: [(x, y) => x + y, String.raw`x+y`],
        diff: [(x, y) => x - y, String.raw`x-y`]
    }
    static preset(type) {
        return new Piece(type)
    }
}



class Game extends GameCore {
    /**@type {Set<Piece>}*/
    pieces = new Set()
    get piecesArr() { return Array.from(this.pieces) }
    addPiece(key) {
        const p = Piece.preset(key)
        this.pieces.add(p)
        this.w.add_drawable(p.panel)
    }

    //#region initialize_more
    initialize_more() {
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
            Object.keys(Piece.TYPES).forEach(x => this.addPiece(x))
            const pos =
                [[30, 30], [1630, 950], [53, 388], [131, 542], [106, 701], [51, 875], [449, 392], [518, 551], [517, 720], [488, 878], [923, 572], [887, 743], [902, 917]]
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

        const input = this.input = this.piecesArr.find(x => x.type == "in")
        /**@type {Set<Poly>} */
        const polys = new Set()
        em.on("processed", (value, target, toDeleteArr) => {
            tobeadded.add([value, target]);
            toDeleteArr && [].concat(toDeleteArr).forEach(p => tobedeleted.add(p))
        })
        em.on("submitted", poly => {
            tobedeleted.add(poly)
            SUBMITTED.push(poly.value)
            console.log("Submitted", poly.value)
        })
        em.on("received", v => {
            console.log("Received", v)
        })
        const stepTime = 500
        const INPUTS = Array(20).fill().map(x => MM.randomInt(-50, 50))
        const OUTPUTS = INPUTS.map(x => Math.abs(x % 2))
        const INSTRUCTIONS = "Output 1 for odd, 0 for even."
        const SUBMITTED = []
        const step = () => {
            if (!input.outputs[0].hold && INPUTS.length) {
                const v = INPUTS.shift()
                tobeadded.add([v, input.outputs[0]])
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
            }
            for (const p of this.pieces) {
                p.process()
            }
            for (const [val, but] of tobeadded)
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


        const corner = new Button({ width: 400, height: this.HEIGHT, y: 0 })
        corner.rightat(this.WIDTH)
        corner.textSettings.textAlign = "right"
        corner.textSettings.textBaseline = "top"
        corner.font_font = "myMonospace"
        corner.dynamicText = () => `${INSTRUCTIONS}\n${MM.tableStr(
            MM.transposeArray([INPUTS, OUTPUTS, SUBMITTED]),
            "INPUTS OUTPUTS SUBMITTED".split(" "),
            3
        )}`

        this.add_drawable(corner)

        Object.assign(this, {
            polys, step, polysDrawable, input,
            INPUTS, SUBMITTED, OUTPUTS, INSTRUCTIONS
        })

    }
    //#endregion

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
