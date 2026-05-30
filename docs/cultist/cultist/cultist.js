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

class Piece {
    constructor(type, fn, latex, props) {
        fn ??= Piece.TYPES[type][0]
        latex ??= Piece.TYPES[type][1]
        props ??= Piece.TYPES[type][2] ?? {}
        this.type = type
        /**@type {function(number):number} */
        this.fn = fn
        this.button = Button.make_latex(new Button({
            width: 280,
            height: 120,
            // isBlocking: true,
        }))
        if (props.x) this.button.x = props.x
        if (props.y) this.button.y = props.y
        this.tex = latex
        this.button.imgScale = 2.5
        if (!props.noinB) {
            const inB = this.inB = new Button({
                width: 60,
                height: 60,
                isBlocking: true
            })
            inB.centeratX(this.button.left)
            inB.centeratY(this.button.centerY)
            inB.tag = "in"
            inB.on_click = (pos) => {
                lineStart = pos
                lineButton = inB
            }
        }
        if (!props.nooutB) {
            const outB = this.outB = new Button({
                width: 60,
                height: 60,
                isBlocking: true
            })
            outB.centeratX(this.button.right)
            outB.centeratY(this.button.centerY)
            outB.tag = "out"
            outB.on_click = (pos) => {
                lineStart = pos
                lineButton = outB
            }
        }
        if (!props.nodrag) Button.make_draggable(this.button)
        const others = [this.inB, this.outB].filter(x => x != null)
        others.concat(this.button).forEach(x => {
            x.piece = this
            x.isBlocking = true
        })
        Button.make_anchor(this.button, others)
        this.panel = new Malleable(this.button, ...others)
        this.panel.isBlocking = true

    }
    set tex(v) { this.button.latex.tex = v }
    get tex() { return this.button.latex.tex }


    static TYPES = {
        in: [x => x, String.raw`\text{IN}`, { noinB: true, nodrag: true, x: 30, y: 30 }],
        out: [x => x, String.raw`\text{OUT}`, { nooutB: true, nodrag: true, x: 1630, y: 950 }],
        square: [x => x ** 2, String.raw`x^2`],
        sqrt: [x => Math.sqrt(x), String.raw`\sqrt{x}`],
        double: [x => 2 * x, String.raw`2 x`],
        halve: [x => x / 2, String.raw`\frac{x}{2}`],
        sgn: [x => Math.sign(x), String.raw`\text{sign}(x)`],
        noop: [x => x, String.raw`x`],
        add: [x => x + 1, String.raw`x+1`],
        remove: [x => x - 1, String.raw`x-1`],
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
            this.piecesArr.slice(2).forEach((x, i) => x.button.move(i * 100, i * 50 + 200))
        })()

        this.mouser.on_release = (pos) => {
            if (!lineStart) return
            lineStart = null
            let match = this.piecesArr
                .map(x => lineButton.tag == "in" ? x.outB : x.inB)
                .filter(x => x != null)
                .find(x => x.collidepoint(pos.x, pos.y))
            if (match && (match.piece !== lineButton.piece)) {
                const inOut = lineButton.tag == "in"
                    ? [lineButton, match]
                    : [match, lineButton]
                const existing = Array.from(lines).find(x => x[0] == inOut[0] && x[1] == inOut[1])
                if (existing) lines.delete(existing)
                else lines.add(inOut)
            }
            lineButton = null
        }
        const lineDrawable = {
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
        this.add_drawable(lineDrawable, 7)






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
