//#region Poly
class Poly {
    static universalFn = x =>
        Number.isFinite(x) ? (Number.isInteger(x) ? x : (Math.abs(x) < 10 ** -8 ? 0 : +x.toPrecision(3))) : null
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
//#endregion

//#region Piece
class Piece {
    constructor(type, fn, latex, props) {
        const origType = type
        if (type.includes("_")) type = origType.split("_")[0]
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
        this.button.imgScale = type.startsWith("Efn") ? 1 : 2.5
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

        this.misc = []
        if (props.editable) {
            const { condition, type, fn, latex, msg } = props.editable
            const editButton = new Button({
                width: 60,
                height: 30,
                isBlocking: true,
                txt: "Edit"
            })
            editButton.centeratX(this.button.centerX)
            editButton.centeratY(this.button.bottom)
            this.onTrigger = (trigger) => {
                if (!condition(trigger)) return
                this.type = type(trigger)
                this.fn = fn(trigger)
                this.button.latex.tex = latex(trigger)
            }
            editButton.on_release = () => {
                const user = prompt(msg)
                if (user == "") return
                this.onTrigger(user)
            }
            this.misc.push(editButton)
        }


        if (!props.nodrag) Button.make_draggable(this.button)
        const others = [...this.inputs, ...this.outputs, ...this.misc].filter(x => x != null)
        others.concat(this.button).forEach(x => {
            x.piece = this
        })
        Button.make_anchor(this.button, [])
        Object.defineProperty(this.button, "anchor_list", {
            get() { return others.concat(others.map(x => x.hold?.button)).filter(x => x) }
        })
        this.panel = new Malleable(this.button, ...others)
        this.panel.isBlocking = true

        if (props.editable && origType.includes("_")) {
            this.onTrigger(origType.split("_").slice(1).join(""))
        }

    }
    set tex(v) { this.button.latex.tex = v }
    get tex() { return this.button.latex.tex }
    onTrigger() { }

    readyToProcess = true
    process() {
        //inB should be an array of buttons
        //when all are filled, have this run and process. 
        //thus needs reactor access
        //could make something fun out of this
        if (!this.readyToProcess) return
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
    //#region TYPES
    static TRIG_PRESETS = [//string,fn,latex 
        ["sin", x => Math.sin(x), String.raw`\sin(x)`],
        ["cos", x => Math.cos(x), String.raw`\cos(x)`],
    ]
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
        perthree: [x => x / 3, String.raw`\frac{x}{3}`],
        perfour: [x => x / 4, String.raw`\frac{x}{4}`],
        perfive: [x => x / 5, String.raw`\frac{x}{5}`],
        persix: [x => x / 6, String.raw`\frac{x}{6}`],
        signum: [x => Math.sign(x), String.raw`\text{sgn}(x)`],
        copy: [x => [x, x], String.raw`\text{COPY}`, { outputs: 2 }],
        copythree: [x => [x, x, x], String.raw`\text{COPY3}`, { outputs: 3 }],
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
        tan: [x => Math.tan(x), String.raw`\tan(x)`],
        atan: [x => Math.atan(x), String.raw`\tan^{-1}(x)`],
        abs: [x => Math.abs(x), String.raw`|x|`],
        one: [_ => 1, String.raw`1`],
        minusone: [_ => -1, String.raw`-1`],
        neg: [x => -x, String.raw`-x`],
        reciprocal: [x => 1 / x, String.raw`\frac{1}{x}`],
        pi: [_ => Math.PI, String.raw`\pi`],
        pihalf: [_ => Math.PI / 2, String.raw`\frac{\pi}{2}`],
        pithird: [_ => Math.PI / 3, String.raw`\frac{\pi}{3}`],
        ninetydeg: [_ => Math.PI / 2, String.raw`\frac{\pi}{4}`],
        Squadratic: [(a, b, c) => Poly.SOLVERS.quadratic(a, b, c), String.raw`\frac{-b+\sqrt{b^2-4ac}{2a}}`, { variables: ["a", "b", "c"] }],
        Efn: [x => Math.round(x), String.raw`\text{Math.round(x)}`,
        {
            editable: {
                msg: "Any single-variable javascript function in variable x.\nWill crash the game if you don't know what you're doing.",
                condition: _ => true,
                type: trigger => "Efn_" + trigger,
                fn: trigger => (eval(`x=>${trigger}`)),
                latex: trigger => String.raw`\text{${trigger}}`
            },
            moreButtonSettings: { color: "fuchsia" }
        }],
        Efn2: [(x, y) => x ** y, String.raw`\text{x**y}`,
        {
            editable: {
                msg: "Any two-variable javascript function in variables (x,y)\nWill crash the game if you don't know what you're doing.",
                condition: _ => true,
                type: trigger => "Efn_" + trigger,
                fn: trigger => (eval(`(x,y)=>${trigger}`)),
                latex: trigger => String.raw`\text{${trigger}}`

            },
            moreButtonSettings: { color: "fuchsia" }
        }],
        Econst: [(_) => 451, String.raw`451`, {
            editable: {
                msg: "Function f(x) = C for your choice of constant C.",
                condition: trigger => Number.isFinite(+trigger),
                type: trigger => "Econst_" + trigger,
                fn: trigger => ((_) => +trigger),
                latex: trigger => String.raw`${trigger}`,
            }
        }],
        Emul: [(x) => 7 * x, String.raw`7x`, {
            editable: {
                msg: "Function f(x) = Cx for you constant C of your choice.",
                condition: trigger => Number.isFinite(+trigger),
                type: trigger => "Emul_" + trigger,
                fn: trigger => (x => x * (+trigger)),
                latex: trigger => String.raw`{${+trigger}}x`,
            }
        }],
        Epow: [(x) => x ** 5, String.raw`x^{5}`, {
            editable: {
                msg: "Function f(x) = x^C for your an integer C of your choice.",
                condition: trigger => Number.isFinite(+trigger) && Number.isInteger(+trigger),
                type: trigger => "Epow_" + trigger,
                fn: trigger => (x => x ** (+trigger)),
                latex: trigger => String.raw`x^{${+trigger}}`,
            }
        }],
        Esqrt: [(x) => x ** (1 / 3), String.raw`\sqrt[3]{x}`, {
            editable: {
                msg: "Function f(x) = (C-th root of x) for your a positive integer C of your choice.",
                condition: trigger => Number.isFinite(+trigger) && Number.isInteger(+trigger) && +trigger > 0,
                type: trigger => "Esqrt_" + trigger,
                fn: trigger => (x => x ** (1 / +trigger)),
                latex: trigger => String.raw`\sqrt[${+trigger}]{x}`,
            }
        }],
        Etrig: [Piece.TRIG_PRESETS[0][1], Piece.TRIG_PRESETS[0][2], {
            editable: {
                msg: `Choose on of the following, typing in the number\n` + Piece.TRIG_PRESETS.map((x, i) => `${i}: ${x[0]}`).join("\n"),
                condition: trigger =>
                    Number.isFinite(+trigger)
                    && Number.isInteger(+trigger)
                    && Piece.TRIG_PRESETS[+trigger] != null,
                type: trigger => "Etrig_" + trigger,
                fn: trigger => Piece.TRIG_PRESETS[+trigger][1],
                latex: trigger => Piece.TRIG_PRESETS[+trigger][2],
            }
        }],
    }
    static preset(type) {
        return new Piece(type)
    }
    static SOLVERS = {
        quadratic: (a, b, c) => (-b + Math.sqrt(b ^ 2 - 4 * a * c)) / (2 * a)
    }
    //#endregion
}
//#endregion




class Level {
    //#region new Level
    constructor(batch, stage, instructions, outputsOrRule, inputsOrFunc, { modules, positions, consecutive } = {}) {
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
        this.CONSECUTIVE = !!(consecutive ?? Level.BATCHES[batch].levels[stage][3]?.consecutive)
        this.INPUTS[0].length == 1 ?
            this.MODULES.push("in") :
            ["ina", "inb", "inc", "ind"].slice(0, this.INPUTS[0].length)
                .forEach(x => this.MODULES.push(x))
        this.MODULES.unshift("out")
        /**@type {[number,number][]} */
        this.POSITIONS = positions ?? Level.BATCHES[batch].levels[stage][3]?.positions ?? Level.BATCHES[batch].positions
    }
    //#endregion
    //#region BATCHES
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
                    return [out, inp, { consecutive: true }]
                })()],
                "mean": ["Take two consecutive inputs, and return their mean.", ...(() => {
                    const inp = Array(30).fill().map(x => MM.randomInt(1, 100))
                    const out = Array(15).fill().map((x, i) => (inp[2 * i] + inp[2 * i + 1]) / 2)
                    return [out, inp, { consecutive: true }]
                })()],
                "divide": ["Take two consecutive inputs, and return their ratio.", ...(() => {
                    const inp = Array(30).fill().map(x => MM.randomInt(1, 100))
                    const out = Array(15).fill().map((x, i) => inp[2 * i] / inp[2 * i + 1])
                    return [out, inp, { consecutive: true }]
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
                "digits": ["Return the number of digits in the given positive integer.", x => `${x} `.length, () => {
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
                "quadratic": ["Your inputs are coefficients of ax^2+bx+c,\nwhere a is positive and the discriminant is nonnegative.\nReturn the larger root.",
                    ...(() => {
                        const roots = Array(30).fill().map(() => [
                            MM.randomInt(-13, 13),
                            MM.randomInt(-13, 13)
                        ])
                        const polys = roots.map(([r1, r2]) => {
                            let a = MM.randomInt(1, 5)
                            return [a, -a * (r1 + r2), a * r1 * r2]
                        })
                        const out = roots.map(([r1, r2]) => Math.max(r1, r2))
                        return [out, polys]
                    })(),
                    { modules: ["square", "sqrt", "diff", "halve", "signum", "copy", "add", "remove", "div", "sum", "diff", "prod", "double", "double", "copy",] }
                ]
            },
            modules: [
                "square", "sqrt", "triple", "halve", "signum", "copy", "add", "remove", "floor", "sum", "diff", "prod", "log", "exp", "copy",],
            positions:
                [[1710, 950], [62, 428], [67, 561], [37, 700], [117, 841], [342, 566], [350, 409], [377, 710], [378, 870], [613, 532], [743, 664], [645, 797], [740, 936], [980, 767], [880, 502], [638, 386], [30, 30], [30, 230], [330, 30], [330, 230]],
        },
        "Trigonometry": {
            levels: {
                "sin": ["Find sin(x)", x => Math.sin(x), () => +MM.random(-TWOPI, TWOPI).toPrecision(3)],
                "sinhalf": ["Return sin(x/2)", x => Math.sin(x / 2), () => +MM.random(-TWOPI, TWOPI).toPrecision(3)],
                "sec": ["Return sec(x)", x => 1 / Math.cos(x), () => +MM.random(-TWOPI, TWOPI).toPrecision(3)],
                "tan": ["Find tan(x)", x => Math.tan(x), () => +MM.random(-TWOPI, TWOPI).toPrecision(3)],
                "isacute": ["Inputs are acute or obtuse angles. Return 1 for acute angles, 0 otherwise.", x => +(Math.cos(x) > 0), () => +MM.random(0, PI).toPrecision(3)],
                "xcos": ["Inputs are acute angles, find their cosine.\nIndeed, the cos module is missing", (x) => Math.cos(x), () => +MM.random(0, NINETYDEG).toPrecision(3),
                    { modules: ["square", "sqrt", "triple", "halve", "copy", "copy", "signum", "sin", "identity", "sum", "diff", "prod", "div",] }
                ],
                "three": ["Inputs are random angles. Map each to 3.\nIndeed, sgn is missing", () => 3, () =>
                    +MM.random(-TWOPI, TWOPI).toPrecision(3),
                    { modules: ["square", "sqrt", "triple", "halve", "copy", "copy", "identity", "sin", "cos", "sum", "diff", "prod", "div",] }
                ],
                "xcosdiff": ["Inputs are a,b. Return cos(a-b).\nIndeed, the x-y module is missing, and\ninstead you have the *seemingly* useless 'x'.", (a, b) => Math.cos(a - b), () => [0, 0].map(_ => +MM.random(-TWOPI, TWOPI).toPrecision(3)),
                    { modules: ["square", "sqrt", "triple", "halve", "copy", "copy", "signum", "sin", "cos", "sum", "identity", "prod", "div",] }
                ],
                "coscos": ["Inputs are a,b. Return the product cos(a)cos(b).\nIndeed, the xy module has been replaced with x+y.", (a, b) => Math.cos(a) * Math.cos(b), () => [0, 0].map(_ => +MM.random(-TWOPI, TWOPI).toPrecision(3)),
                    { modules: ["square", "sqrt", "triple", "halve", "copy", "copy", "signum", "sin", "cos", "sum", "diff", "sum", "div",] }
                ],
                "polar": ["Input is vector with length a and whose angle from the positive x-axis is b radians.\nReturn its x-component coordinate.",
                    (a, b) => a * Math.cos(b)],
                // "atan": ["Return arctan of the input", x => Math.atan(x), () => +MM.random(-TWOPI, TWOPI).toPrecision(3)],
                // "atan2": ["Input is vector (a,b). Return the positive angle between it and x-axis.", (a, b) => Math.abs(Math.atan2(b, a)), () => [0, 0].map(_ => +MM.randomInt(-120, 120))],


            },
            modules: [
                "square", "sqrt", "triple", "halve", "copy", "copy", "signum", "sin", "cos", "sum", "diff", "prod", "div",
            ],
            positions:
                [[1710, 950], [62, 428], [67, 561], [37, 700], [117, 841], [354, 722], [344, 556], [378, 884], [381, 400], [645, 442], [641, 589], [645, 747], [708, 898], [923, 692],
                // [985, 890],
                [36, 21], [36, 221]]
        },
        "Trigonometry 2": {
            levels: {
                "ninetydeg": ["Return pi/2", (_) => Math.PI / 2],
                "circlearea": ["Return the area of the circle whose radius was given", x => x ** 2 * Math.PI, () => MM.randomInt(1, 20)],
                "oost": ["Return the reciprocal of the square root of 3", _ => 1 / Math.sqrt(3)],
                "sqrttwo": ["Return the square root of 2", _ => Math.sqrt(2)],
                "xsin": ["Return sin(x).\nIndeed, sin(x) module is missing.", x => Math.sin(x), () => +MM.randomInt(-TWOPI, TWOPI).toPrecision(3),
                    { modules: ["copy", "copy", "square", "sqrt", "abs", "identity", "cos", "tan", "sum", "diff", "prod", "div", "reciprocal", "pi", "neg", "halve", "perthree", "double", "add", "one", "minusone"] }
                ],
                "complement": ["Input is an acute angle. Return its complementary angle", x => Math.PI / 2 - x, () => +MM.random(0, PI / 2).toPrecision(3)],
                "xsin2": ["Return sin(x).\nIndeed, sin(x) and tan(x) are both missing.", x => Math.sin(x), () => +MM.random(-TWOPI, TWOPI).toPrecision(3),
                    { modules: ["copy", "copy", "square", "sqrt", "abs", "identity", "cos", "identity", "sum", "diff", "prod", "div", "reciprocal", "pi", "neg", "halve", "perthree", "double", "add", "one", "minusone"] }
                ],
                "xtanhalf": ["Return the absolute value of tan(x/2).\nIndeed, tan(x) module is missing.", x => Math.abs(Math.tan(x / 2)), () => +MM.randomInt(-TWOPI, TWOPI).toPrecision(3),
                    { modules: ["copy", "copy", "square", "sqrt", "abs", "sin", "cos", "identity", "sum", "diff", "prod", "div", "reciprocal", "pi", "neg", "halve", "perthree", "double", "add", "one", "minusone"] }
                ],
                "xtanhalf2": ["Return the absolute value of tan(x/2).\nIndeed, tan(x) and x/2 are both missing.", x => Math.abs(Math.tan(x / 2)), () => +MM.randomInt(-TWOPI, TWOPI).toPrecision(3),
                    { modules: ["copy", "copy", "square", "sqrt", "abs", "sin", "cos", "identity", "sum", "diff", "prod", "div", "reciprocal", "pi", "neg", "identity", "perthree", "double", "add", "one", "minusone"] }
                ],
                "goldentrig": ["Return the golden ratio, (sqrt(5)-1)/2.\nIndeed, sqrt(x) is missing.", _ => (Math.sqrt(5) - 1) / 2, () => +MM.random(-TWOPI, TWOPI).toPrecision(3),
                    { modules: ["copy", "copy", "square", "identity", "abs", "sin", "cos", "tan", "sum", "diff", "prod", "div", "reciprocal", "pi", "neg", "halve", "perthree", "double", "add", "one", "minusone"] }
                ],

                /*
                "xsinhalf": ["Return the absolute value of sin(x/2).\nIndeed, sin(x) module is missing.", x => Math.abs(Math.tan(x / 2)), () => +MM.randomInt(-TWOPI, TWOPI).toPrecision(3),
                    { modules: ["copy", "copy", "square", "sqrt", "abs", "identity", "cos", "tan", "sum", "diff", "prod", "div", "reciprocal", "pi", "neg", "halve", "perthree", "double", "add", "one", "minusone"] }
                ],
                */
            },
            modules: [
                "copy", "copy", "square", "sqrt", "abs", "sin", "cos", "tan", "sum", "diff", "prod", "div", "reciprocal", "pi", "neg", "halve", "perthree", "double", "add", "one", "minusone"
            ],
            positions:
                [[1710, 950], [87, 691], [44, 828], [41, 366], [83, 530], [335, 878], [332, 405], [349, 571], [352, 745], [645, 494], [635, 642], [655, 787], [605, 923], [1169, 631], [604, 327], [902, 586], [1203, 797], [1144, 948], [931, 759], [877, 908], [894, 397], [1169, 460], [21, 12], [21, 212]]
        },
        "Number theory": {
            levels: {
                "set2026": ["Map each input to 2026 using the editable contant module.", _ => 2026],
                "mul11": ["Multiply each input by 11 using the editable multiplication module.", x => 11 * x],
                "raise7": ["Raise each input to the 7th using the editable power module", x => x ** 7, _ => MM.randomInt(-10, 10)],
                "is91": ["Return 1 for 91, and 0 otherwise", x => +(x == 91), _ => Math.random() < .4 ? 91 : MM.randomInt(-120, 150)],
                "mod37": ["Return the remainder when dividing the positive integer input by 37.", x => x % 37, _ => MM.randomInt(1, 200)],
                "freeplay999999": ["This not a puzzle, but free play & testing", _ => MM.randomInt(1, 999), _ => Math.random() < .5 ? MM.randomInt(-60, 200) : +MM.random(-10, 20).toPrecision(3),
                    {
                        modules: ["copy", "copythree", "Econst_12", "Emul", "Epow", "Esqrt", "floor", "abs", "sum", "diff", "prod", "div", "Efn", "Efn", "Efn2", "Etrig", "signum"]
                    }
                ]
            },
            modules: [
                "copy", "copy", "Econst_12", "Emul", "Epow", "Esqrt", "floor", "abs", "sum", "diff", "prod", "div", "sum", "diff", "prod", "div", "signum"
            ],
            positions:
                [[1706, 930], [55, 433], [55, 561], [826, 384], [885, 546], [1120, 415], [1173, 569], [50, 703], [52, 834], [326, 446], [334, 596], [360, 745], [340, 878], [582, 447], [591, 599], [628, 740], [602, 881], [901, 708], [23, 25], [23, 225]]

        }
    }
    //#endregion
}
