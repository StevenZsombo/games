class Poly {
    static universalFn = x =>
        Number.isFinite(x) ? (Number.isInteger(x) ? x : +x.toPrecision(3)) : x
    constructor(value, container) {
        this.value = value
        this.button = new Button({
            width: 120,
            height: 60,
            check: null,
            color: "yellow",
            txt: Poly.universalFn(value),
            fontSize: 40,
            // visible: false
        })
        this.where = this._container = container
    }
    get where() { return this._container }
    set where(but) { this._container = but; this.button.centerinRect(but); but.hold = this }
}



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
        if (props.moreButtonSettings) Object.assign(this.button, props.moreButtonSettings)
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
            ;
        Array().concat(out).forEach((u, i) => {
            em.emit("processed", u, this.outputs[i], this.inputs.map(x => x.hold))
            this.inputs.forEach(x => {
                em.emit("move", x.hold.button, x, this.outputs[i])
            })
        })

    }

    static variableNames = ["x", "y", "z"]

    static TYPES = {
        in: [x => x, String.raw`\text{IN}`, { inputs: 0, nodrag: false, moreButtonSettings: { color: "lightgreen" } }],
        ina: [x => x, String.raw`\text{IN:a}`, { inputs: 0, nodrag: false, moreButtonSettings: { color: "lightgreen" } }],
        inb: [x => x, String.raw`\text{IN:b}`, { inputs: 0, nodrag: false, moreButtonSettings: { color: "lightgreen" } }],
        inc: [x => x, String.raw`\text{IN:c}`, { inputs: 0, nodrag: false, moreButtonSettings: { color: "lightgreen" } }],
        ind: [x => x, String.raw`\text{IN:d}`, { inputs: 0, nodrag: false, moreButtonSettings: { color: "lightgreen" } }],
        out: [x => x, String.raw`\text{OUT}`, { outputs: 0, nodrag: false, moreButtonSettings: { color: "lightblue" } }],
        identity: [x => x, String.raw`x`, { moreButtonSettings: { color: "white" } }],
        square: [x => x ** 2, String.raw`x^2`],
        sqrt: [x => Math.sqrt(x), String.raw`\sqrt{x}`],
        double: [x => 2 * x, String.raw`2 x`],
        triple: [x => 3 * x, String.raw`3 x`],
        halve: [x => x / 2, String.raw`\frac{x}{2}`],
        signum: [x => Math.sign(x), String.raw`\text{sgn}(x)`],
        copy: [x => [x, x], String.raw`\text{COPY}`, { outputs: 2 }],
        add: [x => x + 1, String.raw`x+1`],
        remove: [x => x - 1, String.raw`x-1`],
        floor: [x => Math.floor(x), String.raw`\lfloor x \rfloor`],
        sum: [(x, y) => x + y, String.raw`x+y`],
        diff: [(x, y) => x - y, String.raw`x-y`],
        prod: [(x, y) => x * y, String.raw`x \cdot y`],
        log: [x => Math.log10(x), String.raw`\log_{10}(x)`],
        exp: [x => 10 ** x, String.raw`10^{x}`],
        div: [(x, y) => x / y, String.raw`\frac{x}{y}`],
        sin: [x => Math.sin(x), String.raw`\sin(x)`],
        cos: [x => Math.cos(x), String.raw`\cos(x)`],
    }
    static preset(type) {
        return new Piece(type)
    }
}





class Level {
    constructor(batch, stage, instructions, outputsOrRule, inputsOrFunc, { modules, positions } = {}) {
        this.BATCH = batch
        this.STAGE = stage
        instructions ??= Level.BATCHES[batch].levels[stage][0]
        outputsOrRule ??= Level.BATCHES[batch].levels[stage][1]
        inputsOrFunc ??= Level.BATCHES[batch].levels[stage][2]
        this.INSTRUCTIONS = instructions
        let INPUTS = Array.isArray(inputsOrFunc)
            ? inputsOrFunc
            : Array(30).fill().map(_ => inputsOrFunc?.() ?? //if output produces an array, imputs will be given accordingly
                (Array(outputsOrRule.length).fill().map(_ => MM.randomInt(-100, 100))
                ))
        INPUTS = INPUTS.map(x => Array.isArray(x) ? x : [x])
        const OUTPUTS = Array.isArray(outputsOrRule) ? outputsOrRule : INPUTS.map(x => outputsOrRule(...x))
        this.INPUTS = INPUTS
        this.OUTPUTS = OUTPUTS.filter(x => Number.isFinite(x)).map(Poly.universalFn)
        /**@type {string[]} */
        this.MODULES = [...(modules ?? Level.BATCHES[batch].levels[stage][3]?.modules ?? Level.BATCHES[batch].modules)]
        this.INPUTS[0].length == 1 ?
            this.MODULES.push("in") :
            ["ina", "inb", "inc", "ind"].slice(0, this.INPUTS[0].length)
                .forEach(x => this.MODULES.push(x))
        this.MODULES.unshift("out")
        /**@type {[number,number][]} */
        this.POSITIONS = positions ?? Level.BATCHES[batch].levels[stage][3]?.positions ?? Level.BATCHES[batch].positions
    }


    /**
     * @type {Record<string, {
     *   levels: Record<string, [
     *     instruction: string,
     *     outputsOrRule,
     *     ?inputsOrFunc,
     *   ]>,
     *   modules: string[],
     *   positions: [number, number][]
     * }>}
    */
    static BATCHES = {
        "Algebra": {
            levels: {
                "square": ["Square each input", x => x ** 2],
                "abs": ["Take absolute value", x => Math.abs(x)],
                "noneg": ["Return the nonnegative inputs only", x => x >= 0 ? x : null],
                "double": ["Double each input.", x => 2 * x],
                "cube": ["Raise each input to the third power", x => x ** 3],
                "fourth": ["Raise each input to the fourth power", x => x ** 4],
                "sumupto": ["Return the sum of all integers from 1 to n.", x => x * (x + 1) / 2, () => MM.randomInt(1, 20)],
                "mulfive": ["Multiply by 5.", x => x * 5],
                "isodd": ["Return 1 for odd input, and 0 otherwise.", x => Math.abs(x % 2)],
                "isint": ["Return 1 for integers, and 0 otherwise.", x => Number.isInteger(x) ? 1 : 0, () => +(MM.random(-100, 100).toPrecision(3))],
                "subtract": ["Take two consecutive inputs, and return their difference.", ...(() => {
                    const inp = Array(30).fill().map(x => MM.randomInt(1, 100))
                    const out = inp.map((x, i) => inp[2 * i] - inp[2 * i + 1])
                    return [out, inp]
                })()],
                "mean": ["Take two consecutive inputs, and return their mean.", ...(() => {
                    const inp = Array(30).fill().map(x => MM.randomInt(1, 100))
                    const out = Array(15).fill().map((x, i) => (inp[2 * i] + inp[2 * i + 1]) / 2)
                    return [out, inp]
                })()],
                "divide": ["Take two consecutive inputs, and return their ratio.", ...(() => {
                    const inp = Array(30).fill().map(x => MM.randomInt(1, 100))
                    const out = Array(15).fill().map((x, i) => inp[2 * i] / inp[2 * i + 1])
                    return [out, inp]
                })()],
                /*"largestpower": ["Return the largest power of 2 not greater than the positive input.", x => {
                    // let a = x
                    // while (a % 2 == 0) a /= 2
                    // return a
                    let a = 1
                    while (a <= x) a *= 2
                    return a / 2
                }, () => Math.random() < .5 ? MM.randomInt(1, 200) : 2 * MM.randomInt(1, 200)],
                */
                "rounded": ["Round the input to the nearest integer.", x => +Math.round(x).toPrecision(3), () => MM.random(0, 10)],
                "eight": ["Map each input to 8.", x => 8],
                // "poweroften": ["Input is positive a, return 10^a", x => 10 ** x, () => Math.random() < .3 ? +MM.random(1, 10).toPrecision(3) : MM.randomInt(1, 10)],
                "manynines": ["Input is a positive integer.\nReturn a number with that many 9s.", x => 10 ** x - 1, () => MM.randomInt(1, 12)],
                "digits": ["Return the number of digits in the given positive integer.", x => `${x}`.length, () => {
                    const a = MM.randomInt(1, 9)
                    let b = 10 ** a
                    b += MM.randomInt(1, Math.floor(b / 10))
                    return b
                }],
                // "digitsonly": ["Inputs are positive integers. Return only the inputs that are a single digit", x => [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(x) ? x : null, () => Math.random() < .5 ? MM.randomInt(1, 9) : MM.randomInt(1, 200)]
                /*
                "max": ["Take two consecutive inputs, and return the larger one.", ...(() => {
                    const inp = Array(30).fill().map(x => MM.randomInt(1, 100))
                    const out = Array(30).fill().map((x, i) => Math.max(inp[2 * i], inp[2 * i + 1]))
                    return [out, inp]
                })()],
                */
                // "onesdigit": ["Return the ones digit of the positive integer.", x => x % 10, () => MM.randomInt(1, 999)]
            },
            modules: [
                "square", "sqrt", "triple", "halve", "signum", "copy", "add", "remove", "floor", "sum", "diff", "prod", "log", "exp", "copy",],
            positions:
                [[1710, 950], [62, 428], [67, 561], [37, 700], [117, 841], [342, 566], [350, 409], [377, 710], [378, 870], [613, 532], [743, 664], [645, 797], [740, 936], [980, 767], [880, 502], [638, 386], [30, 30]],
        },
        "Algebra 2": {
            levels: {
                "sumtwo": ["You receive inputs a and b. Return a+b.", (a, b) => a + b],
                "hypot": ["Find the length of vector (a,b)", (a, b) => Math.hypot(a, b)],
                "geom": ["Return the difference of the arithmetic and geometric mean", (a, b) => (a + b) / 2 - Math.sqrt(a * b), () => [MM.randomInt(1, 100), MM.randomInt(1, 100)]],
                "quadmean": ["Return the quadratic mean.", (a, b) => Math.sqrt((a ** 2 + b ** 2) / 2), () => [0, 0].map(_ => MM.randomInt(1, 150))],
                "max": ["Return the larger of the two postive inputs", (a, b) => Math.max(a, b), () => [0, 0].map(_ => MM.randomInt(1, 150))],
                "twodigit": ["You receive nonzero digits a,b. Return the two-digit number ab", (a, b) => 10 * a + b, () => [0, 0].map(_ => MM.randomInt(1, 9))],
            },
            modules: [
                "square", "sqrt", "triple", "halve", "signum", "copy", "add", "remove", "floor", "sum", "diff", "prod", "log", "exp", "copy",],
            positions:
                [[1710, 950], [62, 428], [67, 561], [37, 700], [117, 841], [342, 566], [350, 409], [377, 710], [378, 870], [613, 532], [743, 664], [645, 797], [740, 936], [980, 767], [880, 502], [638, 386], [30, 30], [30, 230], [30, 430], [30, 630]],
        },
        "Trigonometry": {
            levels: {
                "sin": ["Find sin(x)", x => Math.sin(x), () => +MM.random(-TWOPI, TWOPI).toPrecision(3)],
                "sec": ["Return sec(x)", x => 1 / Math.cos(x), () => +MM.random(-TWOPI, TWOPI).toPrecision(3)],
                "tan": ["Find tan(x)", x => Math.tan(x), () => +MM.random(-TWOPI, TWOPI).toPrecision(3)],
                "isacute": ["Inputs are acute or obtuse angles. Return 1 for acute angles, 0 otherwise.", x => +(Math.cos(x) > 0), () => +MM.random(0, PI).toPrecision(3)],
                /*"one": ["Inputs are random angles. Map each to 1.", () => 1, () =>
                    +MM.random(-TWOPI, TWOPI).toPrecision(3)
                    // [0, 0].map(_ => +MM.random(-TWOPI, TWOPI).toPrecision(3))
                ],*/
                "xcos": ["Inputs are acute angles, find their cosine.\ncos module is missing", (x) => Math.cos(x), () => +MM.random(0, NINETYDEG).toPrecision(3),
                    { modules: ["square", "sqrt", "triple", "halve", "copy", "copy", "signum", "sin", "identity", "sum", "diff", "prod", "div",] }
                ],
                "xcosdiff": ["Inputs are a,b. Return cos(a-b).\nIndeed, the x-y module is missing, and\ninstead you have the *seemingly* useless 'x'.", (a, b) => Math.cos(a - b), () => [0, 0].map(_ => +MM.random(-TWOPI, TWOPI).toPrecision(3)),
                    { modules: ["square", "sqrt", "triple", "halve", "copy", "copy", "signum", "sin", "cos", "sum", "identity", "prod", "div",] }
                ],

            },
            modules: [
                "square", "sqrt", "triple", "halve", "copy", "copy", "signum", "sin", "cos", "sum", "diff", "prod", "div",
            ],
            positions:
                [[1710, 950], [62, 428], [67, 561], [37, 700], [117, 841], [354, 722], [344, 556], [378, 884], [381, 400], [645, 442], [641, 589], [645, 747], [708, 898], [923, 692], [36, 21]]
        }
    }
}
