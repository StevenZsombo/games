const stgs = {
    allowUntested: true,
    colors: {
        tPink: `hsla(0,100%,80%,0.5)`,
        tYellow: `hsla(60,100%,50%,0.5)`,
        tGreen: `rgba(0,255,0,0.3)`,
        tRed: `rgba(255,0,0,0.3)`,
        tBlue: `rgba(173, 216, 230,0.5)`,
    }
}

//#region Poly
class Poly {
    static isZeroWithEpsilon = x => Math.abs(x) < 10 ** -8
    static universalFn = x =>
        Number.isFinite(x) ? (Number.isInteger(x) ? x : (Poly.isZeroWithEpsilon(x) ? 0 : +x.toPrecision(3))) : null
    static primes200 = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199]
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

    /**@returns {number | null | [number,number]} */
    static parseDecimalOrFraction(str) {
        if (Number.isFinite(+str)) return +str
        const spl = str.split("/")
        if (spl.length !== 2) return null
        if (spl.some(x => !Number.isFinite(+x))) return null
        return [+spl[0], +spl[1]]
    }

    static getSequence(
        outputFn = x => x.at(-1),
        inputFn = _ => MM.randomInt(2, 120),
        { length = 30, minLength = 3, maxLength = 5 } = {}
    ) {
        let totalLength = 0
        const all = []
        const allWithoutZeros = []
        minLength += 1
        maxLength += 1
        const addseq = (n) => {
            const items = []
            totalLength += n
            for (let i = 0; i < n - 1; i++)
                items.push(inputFn())
            allWithoutZeros.push([...items]) //copy of items without 0
            items.push(0)
            all.push(items)
        }
        while (totalLength < length - minLength) {
            const current = MM.randomInt(minLength, maxLength)
            if (totalLength + current <= length - minLength)
                addseq(current)
            else break
        }
        addseq(length - totalLength)
        const inp = all.flat()
        const out = allWithoutZeros.map(outputFn)
        return [out, inp]
    }

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
        if (props.swappable && Piece.TYPES[type]) {
            fn = props.swappable[0][1]
            latex = props.swappable[0][2]
        }
        this.type = type
        /**@type {function(...number):number} */
        this.button = Button.make_latex(new Button({
            width: 210,
            height: 120,
            isBlocking: true,
        }))
        this.button.imgScale = type.startsWith("Efn") ? 1 : 2.4
        if (props.moreButtonSettings) Object.assign(this.button, props.moreButtonSettings)
        this.fn = fn
        this.tex = latex
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
        const onSideRatios = [
            [0.5],
            [0.25, 0.75],
            [0.05, 0.5, .95]
        ]
        this.inputs.forEach((x, i) => {
            x.centeratY(Anim.interpol(this.button.top, this.button.bottom, onSideRatios[this.inputs.length - 1][i]))
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
            x.centeratY(Anim.interpol(this.button.top, this.button.bottom, onSideRatios[this.outputs.length - 1][i]))
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
                const user = prompt(msg)?.trim()
                if (user === "" || user == null) return
                this.onTrigger(user)
            }
            this.misc.push(editButton)
        }
        if (props.swappable) {
            const { swappable } = props
            const swapButton = new Button({
                width: 60,
                height: 30,
                isBlocking: true,
                txt: "Swap"
            })
            swapButton.centeratX(this.button.centerX)
            swapButton.centeratY(this.button.bottom)
            this._swappable = swappable
            this.onTrigger = (i) => {
                const [_, fn, latex] = this._swappable[i]
                this.fn = fn
                this.tex = latex
                this.type = this.type.split("_")[0] + "_" + i
            }
            this.onSwap = () => {
                const parr = swappable.map(
                    (x, i) => [x[0], () => this.onTrigger(i)]
                )
                GameEffects.dropDrownBetter(parr, {
                    autoClose: true, addCloseButton: false,
                    moreButtonSettings: { width: 120, height: 80 }
                })
            }
            swapButton.on_release = () => {
                this.onSwap()
            }
            this.misc.push(swapButton)
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

        if ((props.editable || props.swappable) && origType.includes("_")) {
            this.onTrigger(origType.split("_").slice(1).join("_"))
        }
        if (props.reset) this.onReset = props.reset.bind(this)

    }
    set tex(v) { this.button.latex.tex = v }
    get tex() { return this.button.latex.tex }
    onTrigger() { }
    onSwap() { }
    onReset() { }

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
            if (this.outputs.length)
                this.inputs.forEach(x => {
                    if (u != null)
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
        signum: [x => Math.sign(x),
        // String.raw`\begin{cases}1 &\text{if }x>0\\0 &\text{if }x=0\\-1 &\text{if }x<0\end{cases}`,
        // { moreButtonSettings: { imgScale: 1.2 } }
        String.raw`\text{sgn}(x)`
        ],
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
        pow: [(x, y) => x ** y, String.raw`x^{y}`],
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
                msg: "Function f(x) = Cx for you constant C (decimal or fraction) of your choice.",
                condition: trigger => Poly.parseDecimalOrFraction(trigger) != null,
                type: trigger => "Econst_" + trigger,
                fn: trigger => (() => {
                    const parsed = Poly.parseDecimalOrFraction(trigger)
                    if (Array.isArray(parsed))
                        return x => parsed[0] / parsed[1]
                    else
                        return x => parsed
                })(),
                latex: trigger => (() => {
                    const parsed = Poly.parseDecimalOrFraction(trigger)
                    if (Array.isArray(parsed))
                        return String.raw`\frac{${parsed[0]}}{${parsed[1]}}`
                    else
                        return String.raw`${parsed}`
                })(),
            }
        }],
        Emul: [(x) => 7 * x, String.raw`7x`, {
            editable: {
                msg: "Function f(x) = Cx for a constant C (decimal or fraction) of your choice.",
                condition: trigger => Poly.parseDecimalOrFraction(trigger) != null,
                type: trigger => "Emul_" + trigger,
                fn: trigger => (() => {
                    const parsed = Poly.parseDecimalOrFraction(trigger)
                    if (Array.isArray(parsed))
                        return x => parsed[0] / parsed[1] * x
                    else
                        return x => parsed * x
                })(),
                latex: trigger => (() => {
                    const parsed = Poly.parseDecimalOrFraction(trigger)
                    if (Array.isArray(parsed))
                        return String.raw`\frac{${parsed[0]}}{${parsed[1]}}x`
                    else
                        return String.raw`${parsed}x`
                })(),
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
                latex: trigger => String.raw`\ \sqrt[${+trigger}]{x}\ `,
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
        Otrig: [x => Math.sin(x), String.raw`\sin(x)`, {
            swappable:
                [
                    ["sin", x => Math.sin(x), String.raw`\sin(x)`],
                    ["cos", x => Math.cos(x), String.raw`\cos(x)`],
                    ["tan", x => Math.tan(x), String.raw`\tan(x)`],
                ]
        }],
        Obin: [(x, y) => x + y, String.raw`x+y`, {
            swappable: [
                ["x+y", (x, y) => x + y, String.raw`x+y`],
                ["x-y", (x, y) => x - y, String.raw`x-y`],
                ["xy", (x, y) => x * y, String.raw`x\cdot y`],
                ["x/y", (x, y) => x / y, String.raw`\frac{x}{y}`],
                ["x^y", (x, y) => x ** y, String.raw`x^y`], //oops
                ["log_x(y)", (x, y) => Math.log(y) / Math.log(x), String.raw`\log_{x}(y)`],
            ]
        }],
        Ostep: [0, 0, {
            swappable: [
                ["x+1", x => x + 1, String.raw`x+1`],
                ["x-1", x => x - 1, String.raw`x-1`],
                ["-x", x => -x, String.raw`-x`],
                ["1/x", x => 1 / x, String.raw`\frac{1}{x}`],
                ["x^2", x => x ^ 2, String.raw`x^2`],
                ["sqrt(x)", x => Math.sqrt(x), String.raw`\sqrt{x}`],
                ["sgn(x)", x => Math.sign(x), String.raw`\text{sgn}(x)`],
            ]
        }],
        Onth: [0, 0, {
            swappable: [
                ["gcd(x,y)", (x, y) =>
                    (Number.isInteger(x) && Number.isInteger(y) && x > 0 && y > 0)
                        ? MM.gcd(x, y)
                        : null, String.raw`\text{gcd}(x,y)`],
                /*["lcm(x,y)", (x, y) =>
                    (Number.isInteger(x) && Number.isInteger(y) && x > 0 && y > 0)
                        ? MM.lcm(x, y)
                        : null, String.raw`\text{lcm}(x,y)`],
                        */
                ["x mod y", (x, y) => ((x % y) + y) % y, String.raw`x\,\text{mod}\,y`],
                ["min(x,y)", (x, y) => Math.min(x, y), String.raw`\text{min}(x,y)`],
                ["max(x,y)", (x, y) => Math.max(x, y), String.raw`\text{max}(x,y)`],
                /*["p-adic", (x, y) =>
                    (Number.isInteger(x) && Number.isInteger(y))
                        ? //@TODO
                        : null, String.raw`\text{lcm}(x,y)`],*/
            ],
        }],
        Opath: [0, 0, {
            swappable:
                [
                    ["+=-",
                        x =>
                            Poly.isZeroWithEpsilon(x) ? [null, x, null] :
                                x > 0 ? [x, null, null] :
                                    [null, null, x],
                        String.raw`\begin{array}{r}x>0\nearrow\\x=0\to\\x<0\searrow\end{array}`
                    ],
                    ["1ZnZ",
                        x =>
                            x == 1 ? [1, null, null] :
                                Number.isInteger(x) ? [null, x, null] :
                                    [null, null, x],
                        String.raw`\begin{array}{r}x=1\nearrow\\x\in\mathbb{Z}\setminus\{1\}\to\\x\notin\mathbb{Z}\searrow\end{array}`
                    ]
                ],
            outputs: 3,
            moreButtonSettings: { imgScale: 1.4 }
        }],
        Osigma: [x => Number.isInteger(x) ? MM.divisors(x).length : null, String.raw`\sigma_0`, {
            swappable: [
                ["#divisors", x => (Number.isInteger(x) && x >= 1) ? MM.divisors(x).length : null, String.raw`\sigma_0(x)`],
                ["sum of divisors", x => (Number.isInteger(x) && x >= 1) ? MM.divisors(x).length : null, String.raw`\sigma_1(x)`],
                ["square sum of divisors", x => (Number.isInteger(x) && x >= 1) ? MM.divisors(x).length : null, String.raw`\sigma_2(x)`],
                ["eulers totient", x => (Number.isInteger(x) && x >= 1) ? MM.totient(x) : null, String.raw`\phi(x)`]
            ]
        }],
        Oabs: [x => Math.abs(x), String.raw`|x|`, {
            swappable: [
                ["|x|", x => Math.abs(x), String.raw`|x|`],
                ["sign(x)", x => Math.sign(x),
                    // String.raw`\begin{cases}1 &\text{if }x>0\\0 &\text{if }x=0\\-1 &\text{if }x<0\end{cases}`
                    String.raw`\text{sgn}(x)`
                ],
                ["floor(x)", x => Math.floor(x), String.raw`\lfloor x \rfloor`],
            ]
        }],
        spf2: [x =>
            (Number.isInteger(x) && x >= 2)
                ? [MM.smallestPrimeFactor(x)].flatMap(u => [u, x / u])
                : [null, null],
        String.raw`\begin{array}{l|l}\nearrow p_{\text{min}}\\\searrow \frac{x}{p_{\text{min}}}\end{array}`,
        { outputs: 2 }
        ],
        consume: [x => null, String.raw`\emptyset`, { outputs: 0 }],
        mem: [ //javascript is beyond awesome
            ...(() => {
                let stored = null
                const latex = String.raw`\text{MEM}`
                const fn = function (x) {
                    if (x == 0 || Poly.isZeroWithEpsilon(x)) {
                        const copy = stored
                        reset.apply(this)
                        return copy
                    } else {
                        stored = x
                        this.tex = String.raw`\begin{array}{c}\text{MEM:}\\${Poly.universalFn(x)}\end{array}`
                        return null
                    }
                }
                const reset = function () {
                    game.polys.clear()
                    game.tobeadded.clear()
                    stored = null
                    this.tex = latex
                }
                const props = {
                    reset
                }
                return [fn, latex, props]
            })()]
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
    constructor(batch, stage, instructions, outputsOrRule, inputsOrFunc, { modules, positions, consecutive, replace } = {}) {
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
        this.POSITIONS = positions ?? Level.BATCHES[batch].levels[stage][3]?.positions ?? Level.BATCHES[batch].positions;
        (replace ?? Level.BATCHES[batch].levels[stage][3]?.replace)?.forEach(([before, after]) => {
            for (let i = 0; i < this.MODULES.length; i++) {
                if (this.MODULES[i].startsWith(before))
                    this.MODULES[i] = after
            }
        })
    }
    //#endregion

    static UNTESTED = String.raw`{\color{red}(UNTESTED - might be impossible)}`
    static HARD = String.raw`{\color{red}(Hard)}`
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
                "square": ["$$Square each input.", x => x ** 2],
                "abs": ["$$Take absolute value.", x => Math.abs(x)],
                "noneg": ["$$Return the nonnegative inputs only.", x => x >= 0 ? x : null],
                "double": ["$$Double each input.", x => 2 * x],
                "cube": ["Return $x^3$.", x => x ** 3],
                "fourth": ["Return $x^4.", x => x ** 4],
                "sumupto": ["Return the sum of all integers from $1$ to $n$.", x => x * (x + 1) / 2, () => MM.randomInt(1, 20)],
                "mulfive": ["$$Multiply by 5.", x => x * 5],
                "tutsgn": [String.raw`Return the sign, $\text{sgn}(x)$ for each input. \\\ \\Recall the definition: $\text{sgn}(x) = \begin{cases} 1&\text{if }x>0,\\0&\text{if }x=0,\\-1&\text{if }x<0.\end{cases}$`, x => Math.sign(x)],
                "isodd": ["Return $1$ for odd input, and $0$ otherwise.", x => Math.abs(x % 2)],
                "isint": ["Return $1$ for integers, and $0$ otherwise.", x => Number.isInteger(x) ? 1 : 0, () => +(MM.random(-100, 100).toPrecision(3))],
                "subtract": ["$$Take two consecutive inputs, and return their difference.", ...(() => {
                    const inp = Array(30).fill().map(x => MM.randomInt(1, 100))
                    const out = inp.map((x, i) => inp[2 * i] - inp[2 * i + 1])
                    return [out, inp, { consecutive: true }]
                })()],
                "mean": ["$$Take two consecutive inputs, and return their mean $\\frac{x_1+x_2}{2}$.", ...(() => {
                    const inp = Array(30).fill().map(x => MM.randomInt(1, 100))
                    const out = Array(15).fill().map((x, i) => (inp[2 * i] + inp[2 * i + 1]) / 2)
                    return [out, inp, { consecutive: true }]
                })()],
                "divide": ["$$Take two consecutive inputs, and return their ratio.", ...(() => {
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
                "rounded": ["$$Round the input to the nearest integer.", x => +Math.round(x).toPrecision(3), () => MM.random(0, 10)],
                "eight": ["Map each input to $8$.", x => 8],
                // "poweroften": ["Input is positive a, return 10^a", x => 10 ** x, () => Math.random() < .3 ? +MM.random(1, 10).toPrecision(3) : MM.randomInt(1, 10)],
                "manynines": ["$$Input is a positive integer.\\\\Return a number with that many $9$s.", x => 10 ** x - 1, () => MM.randomInt(1, 12)],
                "digits": ["$$Return the number of digits in the given positive integer.", x => `${x} `.length, () => {
                    const a = MM.randomInt(1, 9)
                    let b = 10 ** a
                    b += MM.randomInt(1, Math.floor(b / 10))
                    return b
                }],
                // "digitsonly": ["Inputs are positive integers. Return only the inputs that are a single digit", x => [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(x) ? x : null, () => Math.random() < .5 ? MM.randomInt(1, 9) : MM.randomInt(1, 200)]

                // "onesdigit": ["Return the ones digit of the positive integer.", x => x % 10, () => MM.randomInt(1, 999)]
            },
            modules: [
                "square", "sqrt", "triple", "halve", "signum", "copy", "add", "remove", "floor", "sum", "diff", "prod", "log", "exp", "copy",],
            positions:
                [[1387, 58], [62, 428], [67, 561], [37, 700], [117, 841], [342, 566], [350, 409], [377, 710], [378, 870], [613, 532], [743, 664], [645, 797], [740, 936], [980, 767], [880, 502], [638, 386], [30, 40], [30, 240], [380, 40], [380, 240]]
        },
        "Algebra 2": {
            levels: {
                "sumtwo": [String.raw`You receive two inputs $a$ and $b$. Return $a+b$.`, (a, b) => a + b],
                "hypot": [String.raw`\text{Find the length of vector }\binom{a}{b}`, (a, b) => Math.hypot(a, b)],
                "geom": [String.raw`Return the difference between\\the arithmetic and the geometric mean.$$`, (a, b) => (a + b) / 2 - Math.sqrt(a * b), () => [MM.randomInt(1, 100), MM.randomInt(1, 100)]],
                "quadmean": [String.raw`Return the quadratic mean.$$`, (a, b) => Math.sqrt((a ** 2 + b ** 2) / 2), () => [0, 0].map(_ => MM.randomInt(1, 150))],
                "max": [String.raw`Return the larger of the two inputs.${Level.HARD}$$`, (a, b) => Math.max(a, b), () => [0, 0].map(_ => MM.randomInt(1, 150))],
                "twodigit": [String.raw`You receive two inputs, $a$ and $b$.\\Return the two-digit number $ab$.`, (a, b) => 10 * a + b, () => [0, 0].map(_ => MM.randomInt(1, 9))],
                "quadratic": [
                    String.raw`Your inputs are the coefficients of $ax^2+bx+c$,\\where $a>0$ and $\Delta >=0$.\\Return the larger of the two roots.`,
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
                [[1372, 55], [62, 428], [67, 561], [37, 700], [117, 841], [342, 566], [350, 409], [377, 710], [378, 870], [613, 532], [743, 664], [645, 797], [740, 936], [980, 767], [880, 502], [638, 386], [30, 40], [30, 238], [380, 40], [380, 238]]
        },
        "Trigonometry": {
            levels: {
                "sin": ["Return $\\sin(x).$", x => Math.sin(x), () => +MM.random(-TWOPI, TWOPI).toPrecision(3)],
                "sinhalf": [String.raw`Return $\sin\left(\frac{x}{2}\right)$.`, x => Math.sin(x / 2), () => +MM.random(-TWOPI, TWOPI).toPrecision(3)],
                "sec": ["Return $\\text{sec}(x)$.", x => 1 / Math.cos(x), () => +MM.random(-TWOPI, TWOPI).toPrecision(3)],
                "tan": ["Find $\\text{tan}(x)$.", x => Math.tan(x), () => +MM.random(-TWOPI, TWOPI).toPrecision(3)],
                "isacute": ["Inputs are acute or obtuse angles. Return $1$ for acute angles, and $0$ otherwise.", x => +(Math.cos(x) > 0), () => +MM.random(0, PI).toPrecision(3)],
                "xcos": ["Inputs are acute angles, find their cosine..\\\\Indeed, the $\\boxed{\\cos(x)}$ module is missing.", (x) => Math.cos(x), () => +MM.random(0, NINETYDEG).toPrecision(3),
                    { modules: ["square", "sqrt", "triple", "halve", "copy", "copy", "signum", "sin", "identity", "sum", "diff", "prod", "div",] }
                ],
                "three": ["Inputs are random angles. Map each to $3$.\\\\Indeed, $\\boxed{\\text{sgn}(x)}$ is missing", () => 3, () =>
                    +MM.random(-TWOPI, TWOPI).toPrecision(3),
                    { modules: ["square", "sqrt", "triple", "halve", "copy", "copy", "identity", "sin", "cos", "sum", "diff", "prod", "div",] }
                ],
                "xcosdiff": ["Return $\\cos(a-b)$.\\\\Indeed, the $\\boxed{x-y}$ module is missing, and\\\\instead you have the *seemingly* useless $\\boxed{x}$.", (a, b) => Math.cos(a - b), () => [0, 0].map(_ => +MM.random(-TWOPI, TWOPI).toPrecision(3)),
                    { modules: ["square", "sqrt", "triple", "halve", "copy", "copy", "signum", "sin", "cos", "sum", "identity", "prod", "div",] }
                ],
                "coscos": [String.raw`Return the product $\cos(a)\cos(b)$.\\Indeed, the $\boxed{x\cdot y}$ module has been replaced with $\boxed{x+y}$.`, (a, b) => Math.cos(a) * Math.cos(b), () => [0, 0].map(_ => +MM.random(-TWOPI, TWOPI).toPrecision(3)),
                { modules: ["square", "sqrt", "triple", "halve", "copy", "copy", "signum", "sin", "cos", "sum", "diff", "sum", "div",] }
                ],
                "polar": [String.raw`The Input is vector with length $a$ and whose angle from the positive x-axis is $b$ radians.\\Return its $x$-component coordinate.`,
                (a, b) => a * Math.cos(b)],
                // "atan": ["Return arctan of the input", x => Math.atan(x), () => +MM.random(-TWOPI, TWOPI).toPrecision(3)],
                // "atan2": ["Input is vector (a,b). Return the positive angle between it and x-axis.", (a, b) => Math.abs(Math.atan2(b, a)), () => [0, 0].map(_ => +MM.randomInt(-120, 120))],


            },
            modules: [
                "square", "sqrt", "triple", "halve", "copy", "copy", "signum", "sin", "cos", "sum", "diff", "prod", "div",
            ],
            positions:
                [[1379, 60], [62, 428], [67, 561], [37, 700], [117, 841], [354, 722], [344, 556], [378, 884], [381, 400], [645, 442], [641, 589], [645, 747], [708, 898], [923, 692], [36, 40], [36, 240], [386, 40], [386, 240]]

        },
        "Trigonometry 2": {
            levels: {
                "ninetydeg": ["Return $\\frac{\\pi}{2}$.", (_) => Math.PI / 2],
                "circlearea": ["Return the area of the circle with the input radius.$$", x => x ** 2 * Math.PI, () => MM.randomInt(1, 20)],
                "oost": [String.raw`Return $\frac{1}{\sqrt{3}}$.`, _ => 1 / Math.sqrt(3)],
                "sqrttwo": ["Return $\sqrt{2}$.", _ => Math.sqrt(2)],
                "xsin": ["Return $\\sin(x)$.\\\\Indeed, the $\\boxed{\\sin(x)}$ module is missing.", x => Math.sin(x), () => +MM.randomInt(-TWOPI, TWOPI).toPrecision(3),
                    { modules: ["copy", "copy", "square", "sqrt", "abs", "identity", "cos", "tan", "sum", "diff", "prod", "div", "reciprocal", "pi", "neg", "halve", "perthree", "double", "add", "one", "minusone"] }
                ],
                "complement": ["Input is an acute angle. Return its complementary angle.$$", x => Math.PI / 2 - x, () => +MM.random(0, PI / 2).toPrecision(3)],
                "xsin2": ["Return sin(x).\nIndeed, sin(x) and tan(x) are both missing.", x => Math.sin(x), () => +MM.random(-TWOPI, TWOPI).toPrecision(3),
                    { modules: ["copy", "copy", "square", "sqrt", "abs", "identity", "cos", "identity", "sum", "diff", "prod", "div", "reciprocal", "pi", "neg", "halve", "perthree", "double", "add", "one", "minusone"] }
                ],
                "xtanhalf": ["Return $\\left|\\tan\\left(\\frac{x}{2}\\right)\\right|$.\\\\Indeed, the $\\boxed{\\tan(x)}$ module is missing.", x => Math.abs(Math.tan(x / 2)), () => +MM.randomInt(-TWOPI, TWOPI).toPrecision(3),
                    { modules: ["copy", "copy", "square", "sqrt", "abs", "sin", "cos", "identity", "sum", "diff", "prod", "div", "reciprocal", "pi", "neg", "halve", "perthree", "double", "add", "one", "minusone"] }
                ],
                "xtanhalf2": [
                    "Return $\\left|\\tan\\left(\\frac{x}{2}\\right)\\right|$.\\\\Indeed, $\\boxed{\\tan(x)}$ and $\\boxed{\\frac{x}{2}}$ are both missing."
                    , x => Math.abs(Math.tan(x / 2)), () => +MM.randomInt(-TWOPI, TWOPI).toPrecision(3),
                    { modules: ["copy", "copy", "square", "sqrt", "abs", "sin", "cos", "identity", "sum", "diff", "prod", "div", "reciprocal", "pi", "neg", "identity", "perthree", "double", "add", "one", "minusone"] }
                ],
                "goldentrig": [
                    String.raw`Return the golden ratio $\frac{\sqrt{5}-1}{2}$.\\Indeed, $\boxed{\sqrt{x}}$ is missing.`
                    // "Return the golden ratio, (sqrt(5)-1)/2.\nIndeed, sqrt(x) is missing."
                    , _ => (Math.sqrt(5) - 1) / 2, () => +MM.random(-TWOPI, TWOPI).toPrecision(3),
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
                [[1394, 68], [87, 691], [44, 828], [41, 366], [83, 530], [335, 878], [332, 405], [349, 571], [352, 745], [642, 448], [632, 580], [659, 724], [608, 860], [1169, 631], [600, 274], [902, 586], [1203, 797], [1144, 948], [931, 759], [877, 908], [894, 397], [1169, 460], [21, 40], [21, 240], [371, 40], [371, 240]]
        },
        "Number theory": {
            levels: {
                "set2026": ["Map each input to $2026$ using \\fbox{Edit} on the contant module \\fbox{12} or \\fbox{300}.", _ => 2026],
                "mul11": ["Multiply each input by $11$ using \\fbox{Edit} on the multiplication module $\\boxed{-7x}$.", x => 11 * x],
                "raise7": ["Return $x^7$.", x => x ** 7, _ => MM.randomInt(-10, 10)],
                "is91": ["Return $1$ for $91$, and $0$ otherwise", x => +(x == 91), _ => Math.random() < .4 ? 91 : MM.randomInt(-120, 150)],
                "mod37": ["Return the remainder when dividing the positive integer input by $37$.", x => x % 37, _ => MM.randomInt(1, 200)],
                "palindrome": ["Input is a nonzero digit. For $4$, return $1234321$ and so on.", x => ((10 ** x - 1) / 9) ** 2, _ => MM.randomInt(1, 8)],//9 is too much lol
                "nextsquare": [String.raw`Return the smallest square number not greater than the input.$$`,
                x => Math.floor(Math.sqrt(x)) ** 2,
                _ => MM.randomInt(2, 200)
                ]

                // "nchoose3": ["Input is n. Return the binomial coefficient n choose 3.", x => (x) * (x - 1) * (x - 2) / 3 / 2 / 1, _ => MM.randomInt(1, 20)],
            },
            modules: [
                "copy", "copy", "Econst_12", "pow", "Econst_300", "Emul_-7", "floor", "abs", "sum", "diff", "copy", "copy", "sum", "diff", "prod", "div", "signum"
            ],
            positions:
                [[1383, 69], [55, 433], [55, 561], [790, 273], [434, 365], [940, 436], [1069, 271], [921, 761], [910, 587], [335, 710], [331, 848], [55, 699], [52, 832], [611, 706], [606, 860], [352, 567], [635, 505], [871, 903], [23, 40], [23, 240], [373, 40], [373, 240]]

        },
        "Number theory 2\n(work in progress)": {
            levels: {
                "tutspf": [
                    `Return the smallest prime factor $p_{\\text{min}}$ of the input.\\\\You can use the empty set module $\\boxed{\\emptyset}$ to\\\\discard unwanted numbers,\\\\such as the other output of`
                    + `\ $\\boxed{${Piece.TYPES.spf2[1]}}$.`
                    , x => MM.smallestPrimeFactor(x), () => MM.randomInt(2, 125)],
                "fullyfactor": ["Return the prime factorization of the input, in increasing order.$$", ...(() => {
                    let inputs = []
                    let outputs = []
                    while (true) {
                        const n = MM.randomInt(2, 125)
                        const factors = MM.primeFactorization(n)
                        if (factors.length + outputs.length <= 30) {
                            inputs.push(n)
                            outputs.push(...factors)
                        } else break
                    }
                    return [outputs, inputs]
                })()],
                "isprime": ["Inputs are integers $\geq 2$. Return $1$ for primes, and $0$ otheriwise.", x => MM.isPrime(x) ? 1 : 0, () => MM.randomInt(2, 150)],
                "lcm": [
                    // "Return the least common multiple $\boxed{\\text{lcm}(a,b)}$\\\\by swapping the swappable number theory module to lcm"
                    String.raw`Return the least common multiple of $a$ and $b$.`//$\text{lcm}(a,b),$\\by swapping to that module using \fbox{Swap} on $\boxed{\text{gcd}(a,b)}$.`
                    , (a, b) => MM.lcm(a, b), () => [0, 0].map(_ => MM.randomInt(1, 120))],
                "ssquaref": [String.raw`${Level.UNTESTED}Return the smallest square number ($\neq 1$) that divides the input.\\\textit{(The inputs are not square-free.)}`,
                x => {
                    for (let i = 2; i < x; i++)
                        if (x % (i ** 2) == 0) return i
                },
                () => MM.randomInt(2, 30) ** 2 * MM.randomInt(1, 13)
                ]

                /*
                "freeplay999999": ["This not a puzzle, but free play & testing", _ => MM.randomInt(1, 999), _ => Math.random() < .5 ? MM.randomInt(-60, 200) : +MM.random(-10, 20).toPrecision(3),
                    {
                        modules: ["copy", "copythree", "Econst_12", "Emul", "Epow", "Esqrt", "floor", "abs", "Obin_0", "Obin_1", "Obin_2", "Obin_3", "Efn", "Efn", "Efn2", "Otrig", "signum"]
                    }
                ],
                */


            },
            modules: [
                "copy", "copy", "copythree", "spf2", "consume", "Obin", "Obin", "Obin", "Onth", "Oabs", "Oabs", "Econst_12", "Econst_300", "Emul"
            ],
            positions:
                [[1389, 65], [55, 433], [55, 561], [331, 498], [487, 142], [863, 143], [375, 849], [656, 849], [91, 847], [61, 706], [430, 672], [709, 673], [730, 472], [991, 546], [1002, 714], [23, 40], [23, 240], [373, 40], [373, 240]]
        },
        "Programming": {
            levels: {
                "harmfour": [String.raw`Return the harmonic mean of a,b,c,d.\\\\Recall: the harmonig mean is $\frac{4}{\frac{1}{a}+\frac{1}{b}+\frac{1}{c}+\frac{1}{d}}$.\\Note: you can \fbox{Swap} $\boxed{x+1}$ to $\boxed{\frac{1}{x}}$.`,
                (a, b, c, d) => 4 / (1 / a + 1 / b + 1 / c + 1 / d),
                _ => Array(4).fill().map(_ => MM.randomInt(1, 120))
                ],
                "tutpath": [String.raw`Return the nonnegative integers only.\\The $\boxed{${Piece.TYPES.Opath[2].swappable[0][2]}}$ module send its input in a different direction according to its sign.\\You can \fbox{Swap} it for a $\boxed{${Piece.TYPES.Opath[2].swappable[1][2]}}$ module as well.\\Recall that unwanted numbers can be destroyed by sending them to the empty set $\boxed{\emptyset}$.`,
                ...(() => {
                    const inp = []
                    for (let i = 0; i < 10; i++) {
                        inp.push(MM.randomInt(-100, 100))
                        inp.push(+MM.random(-10, 10).toPrecision(3))
                        inp.push(+(Math.random() < .5))
                    }
                    const out = inp.map(x => Number.isInteger(x) && x >= 0 ? x : null).filter(x => x != null)
                    return [out, inp]
                })()],
                "xabs": [String.raw`Return |x|.$$`, x => Math.abs(x)],
                "ismult5": [String.raw`Return only the multiples of 5.$$`, x => (x % 5 == 0) ? x : null, _ => Math.random() < .4 ? MM.randomInt(1, 40) * 5 : MM.randomInt(1, 200)],
                "countdown": [String.raw`Return all positive integers not greater than the input in descending order.\\Hint: you'll need to create a loop.$$`, ...(() => {
                    const a = MM.shuffle([4, 6, 7, 3, 8, 2])
                    const inp = [...a]
                    const out = a.flatMap(n => Array.from({ length: n }, (_, i) => n - i))
                    return [out, inp]
                })()],
                "factorial": [String.raw`Return $n!$.`, x => MM.factArr(x), _ => MM.randomInt(1, 10)],
                "xfloor": [String.raw`Return $\lfloor x \rfloor$ given positive $x$.`, x => Math.floor(x), _ => +MM.random(1, 30).toPrecision(3)],
                "xabs2": [String.raw`$$Take absolute value.\\Your new favourite module is missing.`, x => Math.abs(x), _ => Math.random() < .3 ? 0 : MM.randomInt(-20, 20),
                { replace: [["Opath", "identity"]] }
                ],
                "nrdiv": [String.raw`${Level.UNTESTED}Return the number of divisors of $n$.`, x => MM.divisors(x).length, _ => MM.randomInt(2, 200)],
                "primeonly": [String.raw`${Level.UNTESTED}Return only the primes.$$`, ...(() => {
                    const inp = []
                    for (let i = 0; i < 30; i++) {
                        if (Math.random() < .4)
                            inp.push(MM.choice(Poly.primes200))
                        else inp.push(MM.randomInt(2, 200))
                    }
                    const out = inp.filter(x => Poly.primes200.includes(x))
                    return [out, inp]
                })()],
                "totient": [String.raw`${Level.UNTESTED}Return $\varphi(n)$ (Euler's totient function).\\Recall: $\varphi(n) = \#\{k=1,2,\dots,n \,\big|\,\text{gcd}(k,n)=1\}$.`, x => MM.totient(x), _ => MM.randomInt(2, 200)],
                /*
                "tutmem": [String.raw`Return the last item of each zero-terminated positive sequence.\\The \fbox{MEM} ("memory")$$ module is not a mathematical function, but a programming tool.\\It stores every non-zero input it receives. Upon receiving a zero it first outputs the last stored number, also erasing all other numbers in the machine.\\The following "sequence" puzzles will each involve a zero-terminated positive sequence of positive numbers.\\Unlike other puzzles, these ones will push the next input available immediately,\\even if there are already numbers present in the machine.`,
                ...Poly.getSequence(x => x.at(-1)),
                { consecutive: true }
                ],
                "seqsum": [String.raw`$$Return the sum of the terms of each zero-terminated positive sequence.`,
                ...Poly.getSequence(x => x.reduce((s, t) => s + t, 0)),
                { consecutive: true }
                ],
                "seqmin": [String.raw`Return the minimum of each zero-terminated positive sequence.`,
                ...Poly.getSequence(x => Math.min(...x)),
                { consecutive: true }
                ],
                "seqprod": [String.raw`$$Return the product of each of the terms of each zero-terminated positive sequence.`,
                ...Poly.getSequence(x => x.reduce((s, t) => s * t, 1)),
                { consecutive: true }
                ],
                "seqmean": [String.raw`$$Return the mean of each zero-terminated positive sequence.`,
                ...Poly.getSequence(x => x.reduce((s, t) => s + t, 0) / x.length),
                { consecutive: true }
                ],
                "seqseclast": [String.raw`$$Return the second to last term of each zero-terminated positive sequence.`,
                ...Poly.getSequence(x => x.at(-1)),
                { consecutive: true }
                ],
                */


            },
            modules: [
                "Onth",
                "copy", "copythree", "copythree", "Obin", "Obin", "Obin", "Obin", "Econst_12", "Econst_300", "Emul", "Opath_0", "Opath_0", "consume", "Ostep", "Ostep"],
            positions:
                [[1392, 59], [1292, 737], [27, 417], [71, 562], [50, 726], [324, 719], [602, 859], [326, 865], [612, 701], [592, 385], [642, 543], [867, 429], [316, 395], [347, 565], [43, 875], [925, 690], [882, 876], [13, 46], [13, 246], [363, 46], [363, 246]]


        }
    }
    //#endregion
}
