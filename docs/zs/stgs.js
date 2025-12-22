//#region Level
class Level {
    /**
     * @param {String} instructions
     * @param {Array<Poly> | Array<Array<Rational>>} inputs
     * @param {Function} rule inputs.map((x)=>rule(x))
     */
    constructor(instructions, inputs, rule,
        genRules = {
            minTerms: undefined, maxTerms: undefined, minDegree: undefined, maxDegree: undefined,
            minNumer: undefined, maxNumer: undefined, minDenom: undefined, maxDenom: undefined,
            negativeChance: undefined,
            func: undefined, funcOut: undefined, numberOfInputs: undefined,
            minimumOutput: 1, maximumOutput: undefined //watch out for minimumOutput
        },
        conditions = {
            on_start: null, on_start_more: null, on_win: null, rows: null, cols: null,
            toolsRestrictedTo: null, toolsHighlighted: null, toolsDisabled: null,
            allowEarlyWin: false, saveOnCompletion: true, isFreePlay: false
        }
    ) {
        conditions = { allowEarlyWin: false, saveOnCompletion: true, isFreePlay: false, ...conditions }
        this.instructions = instructions
        this.inputs = inputs
            ? inputs.map(x => Poly.computed(x).arr)
            : Level.random(genRules)
        this.outputs = genRules?.funcOut
            ? genRules.funcOut(this.inputs)
            : this.inputs
                .map((x, i, a) => rule(x, i, a))
                .filter(x => x != null)
                .map(x => x instanceof Poly ? x.arr : Poly.computed(x).arr)
        this.rule = rule
        this.genRules = genRules
        this.conditions = conditions
        if (
            (genRules.minimumOutput && (genRules.minimumOutput > this.outputs.length))
            ||
            (genRules.maximumOutput && (genRules.maximumOutput < this.outputs.length))
        ) {
            console.log("Had to generate again:", {
                outputs: this.outputs, minimumOutput: genRules.minimumOutput, maximumOutput: genRules.maximumOutput
            })
            Object.assign(this, new Level(instructions, inputs, rule, genRules))
        }

    }

    static random(genRules = {}) {
        let length = genRules.numberOfInputs ?? 10
        return Array.from({ length }, x => Poly.randomArrForPoly(genRules))
    }
    /**@this {Reactor} */
    static tutorial = function () {
        //this.x += 300
        //this.buttonsMatrix.flat().forEach(b => b.move(300, 0))
        const label = this.instructionButton.copy
        label.txt = `Tutorial: ${stgs.stage}`
        label.transparent = true
        this.game.add_drawable(label)
        this.instructionButton.rightstretchat(this.game.speedButtons.at(-1).right)
        this.instructionButton.topat(this.game.speedButtons.at(-1).bottom + 30)
        this.instructionButton.bottomstretchat(this.game.HEIGHT - 30)
        this.instructionButton.fontSize = 36
        this.instructionButton.color = "lightgray"
        this.instructionButton.font_font = "Consolas"
        this.numberOfRandomSheets = 0
        this.stepTime = 800
        this.celebrateComplete = () => {
            Game.saveToLocal(stgs.stage, [])
        }
    }

}
//#endregion
//#region levels
/**@type {Object<Level>} */
var levels = Object.freeze({
    "secondder": new Level(
        "Find the second derivative.", null, x => Poly.computed(x).takeDerivative().takeDerivative()
    ),
    "mulxcube": new Level(
        "Multiply the input by x^3.", null, x => Poly.computed(x).takeRaise().takeRaise().takeRaise()
    ),
    "noconst": new Level(
        "Remove the constant term if there is any.", null, x => {
            let y = x.map((u, i) => i ? u : new Rational(0))
            if (y.length == 1 && y[0].numerator == 0) y = []
            return y
        }
    ),
    "degreetwo": new Level(
        "Return only the degree 2 term (if there is any).", null, x => x[2].numerator ? [new Rational(0), new Rational(0), x[2]] : [],
        { minTerms: 3, minDegree: 1, maxDegree: 4 }
    ),
    "four": new Level(
        "Transform each polynomial to the constant 4.", null, x => [new Rational(4)]
    ),
    "multhree": new Level(
        "The input is a constant  -  multiply it by 3.", null, x => x.map(u => new Rational(u).multiplyByInt(3)),
        { maxTerms: 1, maxDegree: 0, maxNumer: 20, maxDenom: 7 }
    ),
    "divthree": new Level(
        "Your input is a contant - divide it by 3.", null,
        x => [x[0].copy.divideByInt(3)], { maxTerms: 1, maxDegree: 0, maxNumer: 20, maxDenom: 20 }
    ),
    "boolflip": new Level(
        "If the input is 0 return 1, if it is 1 return 0.", null, x => x.length ? [] : [new Rational(1)],
        { func: () => [].concat(Math.random() < .5 ? [] : [new Rational(1)]) }
    ),
    "hasconst": new Level(
        "Return 1 if the polynomial has a constant term, and 0 otherwise.", null, x =>
        x[0].numerator == 0 ? [] : [new Rational(1)],
        { maxDegree: 5 }
    ),
    "sumcoeff": new Level(
        "Return the sum of all the coefficients.", null, x => Poly.computed(x).takeSubs(new Rational(1)).arr,
        { maxTerms: 5 }

    ),
    "twoxplusone": new Level(
        "Transform each polynomial to the polynomial 2x+1.", null, x => [1, 2].map(x => new Rational(x))
    ),
    "multeight": new Level(
        "Multiply each input by 8.", null, x => x.map(u => new Rational(u).multiplyByInt(8))
    ),
    "sumupto": new Level(
        "Return the sum of all positive integers from 1 to the input.", null, x => {
            const n = x[0].numerator
            return [new Rational(n * (n + 1) / 2)]
        }, { maxTerms: 1, maxNumer: 100, maxDegree: 0, maxDenom: 1, negativeChance: 0 }
    ),
    "mult": new Level(
        "Multiply the input by (2x-1).", null, x => {
            const p = Poly.computed(x)
            const px = p.copy.takeRaise()
            p.takeNeg()
            p.sumWith(px)
            p.sumWith(px)
            return p.arr
        }
    ),

    "lindiff": new Level(
        "Your input is ax+b. Return the difference a-b.", null, (x) => {
            const [b, a] = x
            return Poly.computed([Rational.sumOfTwo(new Rational(b).multiplyByInt(-1), a)]).arr
        }, { minDegree: 0, maxDegree: 1, minTerms: 2, maxTerms: 2 }
    ),
    "linprod": new Level(
        "Your input is ax+b. Return the product (ab).", null, (x) => {
            const [b, a] = x
            return Poly.computed([Rational.productOfTwo(a, b)]).arr
        }, { minDegree: 0, maxDegree: 1, minTerms: 2, maxTerms: 2 }
    ),
    "linsolve": new Level(
        "Your input is ax+b. Solve ax+b=0.", null, x => {
            const [b, a] = x
            return Poly.computed([Rational.ratioOfTwo(b.copy.multiplyByInt(-1), a)]).arr
        },
        { minTerms: 2, maxTerms: 2, minDegree: 0, maxDegree: 1 }

    ),
    "poweroftwo": new Level(
        "Given positive integer a, find 2^a.", null, x => [new Rational(2 ** x[0].numerator)],
        { maxDenom: 1, maxNumer: 11, maxDegree: 0, negativeChance: 0 }
    ),
    "exp": new Level(
        "Your input is positive integer n. Return nx^n.", null,
        x => {
            const res = Array(x[0].numerator + 1).fill(new Rational(0))
            res[res.length - 1] = x[0]
            return res
        },
        { maxTerms: 1, maxNumer: 100, maxDegree: 0, maxDenom: 1, negativeChance: 0 }
    ),
    "degfour": new Level(
        "Only return the polynomials if each term is at least degree 4.", null, (x, i, a) => {
            const p = Poly.computed(x)
            if (p.degree < 4) return
            let q = Poly.computed(p.arr.slice(0, 4))
            let diff = q.takeNeg().sumWith(p)
            return diff.isEqualTo(p) ? p.arr : null
        }, {
        minDegree: 2, maxDegree: 11, minTerms: 2, maxTerms: 4,
        minimumOutput: 2, maximumOutput: 8, numberOfInputs: 10
    }
    ),

    "leadingterm": new Level(
        "Return the leading term.", null, x => x.map((u, i, a) => i == a.length - 1 ? u : new Rational(0)),
        undefined, {
        on_start:/**@this {Reactor} */ function () {
            if (this.inputs.some(x => x.length == 1)) return
            const where = MM.randomInt(0, this.level.inputs.length - 1)
            const what = [new Rational(MM.choice([...MM.range(-10, 10).filter(x => x != 0)]), MM.choice([2, 3, 4, 5, 6, 7]))]
            this.inputs[where] = what
            this.outputs[where] = what
            this.inputRecords[where].latex.tex = Poly.computed(what).getTex()
            this.outputRecords[where].latex.tex = "\\color{lightgray}{" + Poly.computed(what).getTex() + "}"
        }
    }
    ),
    "statattwo": new Level(
        "Return only the polynomials with a stationary point at x=2.",
        null, (x, i, a) => {
            if (Poly.computed(x).takeDerivative().takeSubs(new Rational(2)).toRational().isEqualTo(new Rational(0)))
                return x
        },
        {
            func: (() => {
                const polys = [[4, -4, 1], [16, -32, 24, -8, 1], [4, 0, -3, 1], [7, -4, 1], [4, -4, 5, -4, 1],
                [-4, 4, -1], [-4, 0, 3, -1], [-16, 32, -24, 8, -1], [1, 4, -1], [-8, 8, -6, 4, -1]]
                return function () {
                    if (Math.random() < .55) return Poly.randomArrForPoly()
                    return MM.choice(polys).map(x => new Rational(x))
                }
            })()
        }
    ),
    "quadonly": new Level(
        "Keep only the quadratics (degree exactly two).", null, (x, i, a) => {
            const d = Poly.computed(x).takeDegree().arr?.[0]?.numerator
            if (d == 2) return x
        }, { maxDegree: 3, minDegree: 1, maxTerms: 2, minTerms: 1 }
    ),
    "invsq": new Level(
        "Your input is a positive integer a. Return 1/a^2.", null,
        (x, i, a) => Poly.computed([new Rational(1, x[0].numerator ** 2)]).arr,
        { maxDenom: 1, negativeChance: 0, maxTerms: 1, maxDegree: 0, maxNumer: 20 }
    ),
    "vel": new Level(
        `Starting from rest, an object moves with the given velocity` + "\n" +
        `after x seconds. Find its displacement after 3 seconds.`
        , null,
        (x, i, a) => Poly.computed(x).takeIntegral().takeSubs(new Rational(3)).sumWith(Poly.computed(x).takeIntegral().takeSubs(new Rational(0)).takeNeg())
    ),
    "accel": new Level(
        "Initial velocity: 3 m/s. Your input is the acceleration\nafter x seconds. Find the displacement after x=2 seconds."
        //        "Starting with initial velocity 3 m/s, an object moves with the given\n acceleration after x seconds. find its displacement after 2 seconds."
        , null, x => {
            const indef = Poly.computed(x).takeIntegral().sumWith(Poly.computed([2])).takeIntegral()
            return indef.copy.takeSubs(new Rational(2)).sumWith(indef.copy.takeSubs(new Rational(0)).takeNeg())
        }, { minTerms: 2 }
    ),

    "everyother": new Level(
        "Return only every other input.", null, (x, i, a) => i % 2 ? x : null
    ),
    "posonly": new Level(
        "The inputs are constants. Return only the positive ones.", null, x => x[0].numerator > 0 ? x : null,
        {
            minDegree: 0, maxDegree: 0, maxTerms: 1,
            minimumOutput: 2, maximumOutput: 8, numberOfInputs: 10
        }
    ),
    "evenodd": new Level(
        "Map odd numbers to 1, even numbers to 0", null, x => {
            const n = x[0].numerator
            return Poly.computed([n % 2]).arr
        }, { maxDenom: 1, negativeChance: 0, maxTerms: 1, maxDegree: 0, maxNumer: 99 }
    ),
    "geometric": new Level(
        "Your inputs are [1]. Generate the geometric series.", null,
        (x, i, a) => Array(i + 2).fill(new Rational(1)),
        { func: () => [new Rational(1)] }, { allowEarlyWin: true }
    ),

    "golden": new Level(
        "Approximate the Golden ratio via continued fractions.", null, null,
        {
            numberOfInputs: 10,
            func: x => [new Rational(1)],
            funcOut: x => {
                const out = []
                let sofar = new Rational(1)
                for (let i = 0; i < 10; i++) {
                    sofar = Rational.sumOfTwo(Rational.reciprocal(sofar), new Rational(1))
                    out.push([sofar])
                }
                return out
            }
        }, { allowEarlyWin: true }
    ),
    "sqrttwo": new Level(
        "Approximate sqrt(2) via the recursion\nx_1=1, x_{n+1}= x_n/2 + 1/(x_n).", null, null,
        {
            numberOfInputs: 10,
            func: x => [new Rational(1)],
            funcOut: x => {
                let approx = new Rational(1)
                let out = []
                for (let i = 0; i < 10; i++) {
                    approx = Rational.sumOfTwo(approx.copy.divideByInt(2), Rational.reciprocal(approx))
                    out.push([approx])
                }
                return out
            }
        }, { allowEarlyWin: true }
    ),
    "last": new Level(
        "Return the last term only.", null,
        /**@param {Rational[]} x */(x, i, a) => x.slice(0, x.findIndex(x => !x.isZero) + 1),
        { minTems: 2, maxTerms: 4 }
    ),
    "compsqonly": new Level(
        "Your inputs are quadratics. Return only the complete squares.", null, x => {
            const [a, b, c] = x
            const prod = Rational.productOfTwo(a, c).multiplyByInt(4)
            const sq = Rational.productOfTwo(b, b)
            return prod.isEqualTo(sq) ? x : null
        }, {
        func: () => {
            let [a, b, c] = Array(3).fill().map(x => new Rational(MM.choice([-1, -2, -3, -4, -5, 1, 2, 3, 4, 5]), MM.randomInt(1, 4)))
            if (Math.random() < .5) {
                if (Math.random() < .5) {
                    a = Rational.ratioOfTwo((Rational.productOfTwo(b, b).divideByInt(4)), c)
                } else c = Rational.ratioOfTwo((Rational.productOfTwo(b, b).divideByInt(4)), a)
            }
            return [a, b, c]
        }
    }),
    "abs": new Level(
        "Return the absolute value of the given constant.", null,
        /**@param {Rational[]} x */(x, i, a) => [new Rational(x[0].isPositive ? x[0] : x[0].copy.multiplyByInt(-1))],
        { maxDegree: 0, maxTerms: 1, minTerms: 1, maxNumer: 20, maxDenom: 7 }
    ),

    "powersoftwo": new Level(
        "Your inputs are all [1]. Generate the other powers of two.", null,// x => [new Rational(2 ** x[0].numerator)],
        (x, i, a) => [new Rational(2 ** (i + 1))],
        { maxDenom: 1, maxNumer: 1, maxDegree: 0, negativeChance: 0 },
        { allowEarlyWin: true }
    ),
    "e": new Level(
        "Your inputs are all [1]. Approximate Euler's number.", null,
        (x, i, a) => MM.range(i + 1).reduce((s, t) => s.takeIntegral(), Poly.computed([1])).takeSubs(new Rational(1)).arr,
        { func: () => [new Rational(1)] },
        { allowEarlyWin: true }
    ),
    "factorials": new Level(
        "Your inputs are all [1]. Generate the other factorials.", null,
        (x, i, a) => [new Rational(MM.fact(i + 2))],
        { maxDenom: 1, maxNumer: 1, maxDegree: 0, negativeChance: 0 },
        { allowEarlyWin: true }
    ),
    "linmax": new Level(
        "Your input is ax+b. Return the larger of positive a and b.", null, (x) => {
            const [b, a] = x
            const diff = Rational.differenceOfTwo(a, b)
            return [diff.numerator > 0 ? a : b]
        }, {
        func: () => {
            const range = [...MM.range(-20, 20)].filter(x => x !== 0)
            const a = new Rational(MM.choice(range), MM.choice(range))
            let b = new Rational(MM.choice(range), MM.choice(range))
            if (a.isEqualTo(b)) b.multiplyByInt(2)
            return [b, a]
        }
    }
    ),
    "sixsixsix": new Level(
        "Your inputs are all the same, map them to [666].", null, null,
        {
            func: () => [2, 0, 0, 5, 0, 0, 0, -1, 0, 3].map(x => new Rational(x)),
            funcOut: () => Array(10).fill([new Rational(666)]),
            numberOfInputs: 10
        }, { allowEarlyWin: true }
    ),


    "factorial": new Level(
        "Your input is n. Return n!.", null, x => [new Rational(MM.fact(x[0].numerator))],
        { maxDenom: 1, maxNumer: 8, maxDegree: 0, negativeChance: 0 }
    )



})
//#region tutorialLevels
/**@type {Object<Level>} */
var tutorialLevels = Object.freeze({
    "IN_OUT1": new Level(
        `
Move inputs from IN to OUT.
Click a cell to select modules to place.

You can see the inputs and expected outputs listed on the right.
        `
        , null, x => x, { numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "Reset": new Level(
        `When something goes wrong, click "Reset inputs" in the right-upper corner.
This  will only reset inputs and outputs, not your modules configuration.
To reset the entire puzzle, use the "Settings" menu.

Wrong submissions will be indicated by a red color on the right.
`
        , null, x => x, { numberOfInputs: 4 },
        {
            toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            /**@this {Reactor} */
            on_start_more: function () {
                this.addPiece(0, 0, Reactor.t.IN)
                this.addPiece(1, 2, Reactor.t.OUT)
            }
        }

    ),
    "U_D_L_R1": new Level(
        `
Instead of deleting, move the polynomial from IN to OUT
using UP, DOWN, LEFT, RIGHT.

These modules can be placed over others.
        `
        , null, x => x, { numberOfInputs: 4 },
        {
            toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            /**@this {Reactor} */
            on_start_more: function () {
                this.addPiece(0, 0, Reactor.t.IN),
                    this.addPiece(2, 0, Reactor.t.OUT)
            }
        }
    ),
    "U_D_L_R2": new Level(
        `
Observe how putting DOWN on IN lets you change the direction of the incoming polynomial.
UP DOWN LEFT RIGHT lets you push polynomials around at your leisure.
Now clean up this mess.

You can drag&drop to move modules,
move them over an existing module to swap them,
or drag them outside the calculator field to remove them.
`
        , null, x => x, { numberOfInputs: 4 },
        {
            toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            /**@this {Reactor} */
            on_start_more: function () {
                this.fromJSON(`[[0,2,"DOWN"],[1,2,"LEFT"],[0,2,"IN"],[1,1,"UP"],[0,1,"LEFT"],[0,0,"DOWN"],[1,0,"UP"],[2,1,"RIGHT"],[2,0,"UP"],[2,1,"OUT"],[2,2,"UP"]]`)
            }
        }
    ),
    "IN_OUT2": new Level(
        `
Return two copies of each input.
Multiple IN modules will each send their own copy of an input.

Fun fact: inputs are sent when there are no polynomials present in the system.
        `,
        [[4], [5], [1]], null,
        {
            funcOut: x => {
                const res = []
                x.forEach(p => (res.push(p), res.push(p)))
                return res
            }, numberOfInputs: 3
        },
        {
            toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            on_start_more: function () { this.fromJSON(`[[2,1,"UP"],[2,1,"IN"],[0,2,"OUT"]]`) }
        }

    ),
    "RAISE1": new Level(
        `

        Raise the degree of each term by 1 using RAISE.
Constants increase in degree too, except for [0].
This effectively multiplies the polynomial by x.

`,
        [[0, 0, 1], [1, 0, 3], [-2, 1], [2], [0]], x => Poly.computed(x).takeRaise().arr,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT RAISE LOWER".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "LOWER": new Level(
        `
        
Lower the degree of the given term by 1 using LOWER.
Note that the constant is discarded.
The other terms are effectively divided by x.

        `
        , [[0, 0, 1], [1, 0, 3], [-2, 1], [2], [0]], x => Poly.computed(x).takeLower().arr,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT RAISE LOWER".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "DER": new Level(
        `
        
Take derivative using DER.
How is this different from LOWER?

You can click the Speed buttons to increase/decrease game speed or to pause completely.
(Tutorials run at half the speed of real puzzles.)

        `
        , [[0, 0, 1], [1, 0, 3], [-2, 1], [2], [0]], x => Poly.computed(x).takeDerivative().arr,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        {
            toolsRestrictedTo: "IN OUT DER INT".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            /**@this {Reactor}*/on_start_more: function () {
                console.log("asd")
                this.game.animator.add_anim(Anim.custom(this.game.speedButtons.at(-1), 600,
                    function (t, obj) {
                        obj.color = t < .5 ? "blue" : "gray"
                        //obj.resize(this.orig.width * (1 + t / 2 * .1), this.orig.height * (1 + t / 2 * .1))
                    }, "x y width height color", { repeat: 12 }))
            }
        }
    ),
    "INT": new Level(
        `
        
You can integrate using INT.

The constant of integration is always set to C = 1.
This means that INT maps [0] to [1].

        `
        , [[0, 0, 1], [1, 0, 3], [-2, 1], [2], [0]], x => Poly.computed(x).takeIntegral().arr,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT DER INT".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "LEAD": new Level(
        `LEAD returns the leading coefficient.
        Which is merely a number, and not the term itself.`
        , [[0, 0, 1], [1, 0, 3], [-2, 1], [2], [0]], x => Poly.computed(x).takeLead().arr,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT LEAD CONST".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "CONST1": new Level(
        `CONST returns the constant term, discarding everything else.`
        , [[0, 0, 1], [1, 0, 3], [-2, 1], [2], [0]], x => Poly.computed(x).takeConst().arr,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT LEAD CONST".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "CONST2": new Level(
        `
Recall that INT always sets the constant of integration to C=1.
So INT then CONST always returns [1].
Map each input to [1].

Similarly, RAISE then CONST would always return [2].
`,
        null, x => [new Rational(1)], { numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT DER INT LEAD CONST RAISE LOWER".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "DEG1": new Level(
        `
        DEG returns the degree of the polynomial.
The polynomial [0] is instead consumed.

This could be useful for programming:
so far this is the only module capable of consuming certain polynomials 
instead of letting them pass through unconditionally.
`
        , [[0, 0, 1], [1, 0, 3, 4], [0], [-2, 1, 0, 5], [2]],
        x => x.length ? Poly.computed(x).takeDegree().arr : null,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT DEG NEG".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "DEG2": new Level(
        `Map each input to [2].
        Hint: you know how to create [x^2], don't you?`
        , [[0, 0, 1], [1, 0, 3, 4], [0], [-2, 1, 0, 5], [2]],
        x => [new Rational(2)],
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        { toolsRestrictedTo: "DEG NEG IN OUT UP DOWN LEFT RIGHT DER INT LEAD CONST RAISE LOWER".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),

    "NEG": new Level(
        `NEG multiplies the polynomial by -1.`
        , [[0, 0, 1], [1, 0, 3, 4], [-2, 1, 0, 5], [0], [2]], x => Poly.computed(x).takeNeg().arr,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT DEG NEG".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "TAKE": new Level(
        `
        
TAKE discards the leading term and returns what remains.

If the polynomial is constant, TAKE instead takes reciprocal.

TAKE [0] is consumed.

        `
        , [[1, 0, 3, 4], [0, 0, 1], [-2, 1, 0, 5], [2], [0], [new Rational(-2, 5)]], x => Poly.computed(x).takeTake(),
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        {
            toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT TAKE COPY".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            on_start_more: function () { this.fromJSON(`[[0,0,"IN"],[2,2,"LEFT"],[2,0,"OUT"],[0,2,"DOWN"],[1,2,"TAKE"]]`) }
        }
    ),
    "COPY1": new Level(
        `
COPY shoots out two copies of the incoming polynomial
in the perpendicular directions.

Horizontal movement is transformed to vertical, and vice versa.
        `
        , [[0, 0, 1], [1, 0, 3, 4], [-2, 1, 0, 5], [2], [0]], x => x,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        {
            toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT TAKE COPY".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            on_start_more: function () { this.fromJSON(`[[1,0,"IN"],[1,2,"COPY"],[1,0,"RIGHT"],[0,0,"OUT"]]`) }
        }
    ),
    "COPY2": new Level(
        `You can easily make infinite loops with COPY.`
        , [[1]], null,
        {
            minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4,
            funcOut: x => Array(8).fill([new Rational(1)])
        },
        {
            toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT TAKE COPY".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            on_start_more: function () { this.fromJSON(`[[0,1,"IN"],[2,0,"OUT"],[0,2,"LEFT"],[0,1,"DOWN"],[1,1,"COPY"],[1,2,"UP"],[1,0,"DOWN"]]`) }
        }
    ),
    "POW1": new Level(
        `
When a positive integer [a] passes through POW it is transformed to [x^a].
Negative constants pass through freely. Everything else is consumed.
        `
        , [[7], [2], [0], [new Rational(-1, 2)], [new Rational(1, 2)], [2, -4, 1]], x => Poly.computed(x).takePower(), {},
        {
            toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT POW SUBS".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            on_start_more: function () { this.fromJSON(`[[2, 0, "IN"], [2, 0, "UP"], [0, 0, "POW"], [0, 0, "RIGHT"], [0, 2, "DOWN"], [2, 2, "OUT"]]`) }
        }
    ),
    "POW2": new Level(
        `
For positive integers, POW and DEG are inverses.



Negative constant remain unchanged by POW,
positive integers are changed to non-constants.
A combination of POW and CONST could therefore be used to detect negative numbers, right?

You may find these useful in some puzzles${' (e.g. in "evenodd" and "posonly".)'}.
        `
        , [[7], [3], [0], [-4], [-2]], x => Poly.computed(x).takePower()?.takeDegree(), {},
        {
            toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT DEG TAKE POW SUBS".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            on_start_more: function () { this.fromJSON(`[[2,0,"IN"],[2,0,"UP"],[0,0,"POW"],[0,0,"RIGHT"],[0,2,"DOWN"],[2,2,"OUT"],[0,2,"DEG"]]`) }
        }
    ),
    "SUBS": new Level(
        `
SUBS consumes everything.
Once it has consumed both a constant and non-constant,
it returns the value obtained by substituting the constant into the other.

It then resets to its original behaviour.

You can feed it inputs in either order.
        `, [[2, 6], [1], [-2, 1], [5], Array(11).fill().map((x, i) => i == 10 ? 1 : 0), [2]],
        (x, i, a) => {
            if (i % 2) return
            return Poly.computed(x).takeSubs(a[i + 1][0])
        }
        , {},
        {
            toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT POW SUBS".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            on_start_more: function () { this.fromJSON(`[[1,0,"IN"],[1,2,"SUBS"],[1,2,"DOWN"],[1,0,"RIGHT"],[2,0,"OUT"],[2,2,"LEFT"]]`) }
        }
    ),
    "SUM1": new Level(
        `
        
        
Sum consumes two consecutive polynomials,
then returns their sum.



        `, [[3], [5], [0, 0, 1], [0, 0, 0, 0, 0, 1], [-1, 2, 0, 3], [3, -2, 1, -2, 1]],
        (x, i, a) => {
            if (i % 2) return
            return Poly.computed(x).sumWith(Poly.computed(a[i + 1])).arr
        }, {},
        {
            toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT SUM DOOR".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            on_start_more: function () {
                this.fromJSON(
                    `[[0,0,"IN"],[0,0,"DOWN"],[2,2,"UP"],[0,2,"OUT"],[2,1,"SUM"],[2,0,"RIGHT"]]`
                )
            }
        }
    ),
    "SUM2": new Level(
        `Double each input.`, [[7], [12], [0, 0, -3], [1, 0, -8, 0, 0, 4]],
        x => Poly.computed(x).sumWith(Poly.computed(x)), {},
        { toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT SUM DOOR".split(" "), rows: 3, cols: 3, on_start: Level.tutorial, }
    ),
    "DOOR1": new Level(
        `

The door consumes two consecutive polynomials, a key and a visitor (in either order).
The visitor is only allowed to pass through if the key is [0].

        `, [[0], [0, 0, 3], [0, 1, 4, -2, 1], [0], [0, 1, -2, 3], [2]],
        (x, i, a) => [1, 2].includes(i) ? x : null
        , {},
        {
            toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT SUM DOOR".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            on_start_more: function () { this.fromJSON(`[[0,0,"IN"],[1,2,"DOOR"],[2,0,"OUT"],[0,2,"DOWN"],[2,2,"LEFT"]]`) }
        }
    ),
    "DOOR2": new Level(
        `Use CONST and DOOR to keep only the inputs that do not have a constant term.`,
        [[1, 0, 2], [2, 0, 1], [0, 2, 0, 4, 1], [1, 0, 2, 1, -3], [0, 1, 2, 0, 7]], (x, i, a) => Poly.computed(x).takeConst().toRational().isEqualTo(new Rational(0)) ? x : null
        , {},
        {
            toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT LEAD CONST SUM DOOR".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            on_start_more: function () { this.fromJSON(`[[0,0,"IN"],[2,0,"IN"]]`) }
        }
    )

})
//#endregion
//#region freeLevels
var freeLevels = {
    "random inputs": new Level(null, null, x => null, { minimumOutput: 0 }, { saveOnCompletion: false, isFreePlay: true }),
    "quadratic inputs": new Level(null, null, x => null, { minimumOutput: 0, maxDegree: 2, minTerms: 3 }, { saveOnCompletion: false, isFreePlay: true }),
    "linear inputs": new Level(null, null, x => null, { minimumOutput: 0, maxDegree: 1, maxTerms: 2, minTerms: 2 }, { saveOnCompletion: false, isFreePlay: true }),
    "constant inputs": new Level(null, null, x => null, { minimumOutput: 0, maxDegree: 0, maxTerms: 1 }, { saveOnCompletion: false, isFreePlay: true }),
    "integer inputs": new Level(null, null, x => null, { minimumOutput: 0, maxDegree: 0, maxTerms: 1, maxDenom: 1, maxNumer: 12 }, { saveOnCompletion: false, isFreePlay: true }),
    "pos. integer inputs": new Level(null, null, x => null, { minimumOutput: 0, maxDegree: 0, maxTerms: 1, maxDenom: 1, maxNumer: 20, negativeChance: 0 }, { saveOnCompletion: false, isFreePlay: true }),
    "many terms inputs": new Level(null, null, x => null, { minimumOutput: 0, minTerms: 2, maxTerms: 4 }, { saveOnCompletion: false, isFreePlay: true }),
    "all [1] input": new Level(null, null, x => null, { minimumOutput: 0, func: () => [new Rational(1)] }, { saveOnCompletion: false, isFreePlay: true })
}
//#endregion
//#region prototypeLevels
var prototypeLevels = {
    "fliplead": new Level(
        "Replace the leading term's coefficient with its reciprocal.", null,
        x => x.map((u, i, a) => i == a.length - 1 ? new Rational(u.denominator, u.numerator) : u),
    ),
    "flipall": new Level(
        "Replace each coefficient with its reciprocal.", null,
        x => x.map((u, i, a) => !u.isZero ? new Rational(u.denominator, u.numerator) : u),
    ),
    "sumofthree": new Level(
        "Return the sum of the current and the next two inputs.", null, (x, i, a) => {
            if (i % 3) return
            const [u, v, w] = a.slice(i, i + 3).map(Poly.computed)
            return u.sumWith(v).sumWith(w).arr
        }, { numberOfInputs: 9, maxTerms: 1 }
    ),
    "inconly": new Level(
        "Return only the polynomials that are increasing at x=1.", null, (x, i, a) => {
            const p = Poly.computed(x)
            const val = p.takeDerivative().takeSubs(new Rational(1)).toRational()
            if (val.isPositive) return x
        }, { minimumOutput: 2, maximumOutput: 8 }
    ),
    "sign": new Level(
        "Return the sign of the constant term. (So 1 if positive, \n 0 if zero, and -1 if negative.)", null,
        /**@param {Rational[]} x */(x, i, a) => [new Rational(x[0].isPositive ? 1 : x[0].isZero ? 0 : -1)],
        { maxDegree: 1, maxTerms: 2, minTerms: 2 }
    ),

    "diffoftwo": new Level(
        "Return the current input minus the next input.", null, (x, i, a) => {
            if (i % 2) return
            const [u, w] = [x, a[i + 1]].map(Poly.computed)
            w.takeNeg()
            return u.sumWith(w).arr
        }, { maxTerms: 2 }
    ),
    "count": new Level(
        "Count the number of (nonzero) terms.", null, x => [new Rational(x.filter(u => !u.isZero).length)],
        { maxTerms: 5 }
    ),
    "sumdeg": new Level(
        "Return the sum of the indices. (Input has no constant.)", null,
        x => [new Rational(x.reduce((s, t, i) => s + (!t.isZero * i), 0))],
        { minDegree: 1, maxTerms: 4 }
    ),
    "binom": new Level(
        "Input is nx+k. Return the binomial coefficient (n choose k).", null,
        x => [new Rational(MM.binom(x[1].numerator, x[0].numerator))],
        {
            func: () => {
                const n = MM.randomInt(2, 20)
                const k = MM.randomInt(1, n - 1)
                return [k, n].map(x => new Rational(x))
            }
        }
    ),
    "accum": new Level(
        "Accumulate the sum of all inputs so far", null,
        /**@param {Rational[]} x @param {Rational[][]} a  */(x, i, a) => {
            return [new Rational(a.slice(0, i + 1).reduce((s, t) => Rational.sumOfTwo(s, t[0]), new Rational(0)))]
        }, { maxTerms: 1, maxDegree: 0, maxDenom: 0, negativeChance: 0, maxNumer: 12 }
    ),
    "fibonacci": new Level(
        "Generate the Fibonacci sequence", null, null,
        {
            numberOfInputs: 10,
            func: x => [new Rational(1)],
            funcOut: x => {
                let fib = [1, 2]
                for (let i = 2; i < 10; i++) {
                    fib.push(fib.at(-1) + fib.at(-2))
                }
                return fib.map(x => [new Rational(x)])
            }
        }
    ),

}
//#endregion


//#region stgs
/// settings
var stgs = {
    stage: -1,
    latestSelectorType: -1,
    localVictoriesName: "ZPkeys",
    localDataName: "ZPdatas",
    localUserSettingsName: "ZPsettings",
    alreadyTriedAskingForClipboardPermission: false

}/// end of settings
//#endregion
//#region pageManager
const pageManager = Object.freeze({
    levelSelector: -1,
    settings: -2,
    tutorialSelector: -3,
    freeSelector: -4,
})
//#endregion
//#region userSettings
var userSettings = {
    biggerButtons: false,
    isDeveloper: false,
    hoverTooltips: true
}
//#endregion