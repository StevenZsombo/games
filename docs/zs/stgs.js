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
            func: undefined, funcOut: undefined
        },
        conditions = {
            on_start: null, on_start_more: null, on_win: null, toolsRestrictedTo: null, toolsHighlighted: null,
            allowEarlyWin: false, rows: null, cols: null
        }
    ) {
        this.instructions = instructions
        this.inputs = inputs
            ? inputs.map(x => Poly.computed(x).arr)
            : Level.random(genRules)
        this.outputs = genRules?.funcOut
            ? genRules.funcOut(this.inputs)
            : this.inputs
                .map((x, i, a) => rule(x, i, a))
                .filter(x => x != null)
        this.rule = rule
        this.genRules = genRules
        this.conditions = conditions
        if (
            this.outputs.length == 0
            ||
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
        this.instructionButton.rightstretchat(this.game.speedButtons.at(-1).right)
        this.instructionButton.topat(this.game.speedButtons.at(-1).bottom + 30)
        this.instructionButton.bottomstretchat(this.game.HEIGHT - 30)
        this.instructionButton.fontSize = 36
        this.sheetsCleared = Reactor.numberOfRandomSheets
        this.celebrateFireworks = () => { }
    }

}

/**@type {Object<Level>} */
var levels = Object.freeze({
    "same": new Level(
        "Simply output the polynomial you received.", null, x => x
    ),
    "lead": new Level(
        "Find the leading coefficient of the polynomial you received.", null, x => [x.at(-1)]
    ),
    "secondder": new Level(
        "Find the second derivative.", null, x => Poly.computed(x).takeDerivative().takeDerivative().arr
    ),
    "mulxcube": new Level(
        "Multiply the input by x^3.", null, x => Poly.computed(x).takeRaise().takeRaise().takeRaise().arr
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
    "one": new Level(
        "Transform each polynomial to the constant 1.", null, x => [new Rational(1)]
    ),
    "four": new Level(
        "Transform each polynomial to the constant 4.", null, x => [new Rational(4)]
    ),
    "posonly": new Level(
        "The inputs are constants. Return only the positive ones.", null, x => x[0].numerator > 0 ? x : null,
        {
            minDegree: 0, maxDegree: 0, maxTerms: 1,
            minimumOutput: 2, maximumOutput: 8, numberOfInputs: 10
        }
    ),
    "sumoftwo": new Level(
        "Return the sum of the current and the next input.", null, (x, i, a) => {
            if (i % 2) return
            return Poly.computed(x).sumWith(Poly.computed(a[i + 1])).arr
        }, { maxTerms: 2 }
    ),
    /*"everyother": new Level(
        "Return only every other input.", null, (x, i, a) => i % 2 ? x : null
    ),*/
    "hasconst": new Level(
        "Return 1 if the polynomial has a constant term, and 0 otherwise.", null, x =>
        x[0].numerator == 0 ? [] : [new Rational(1)],
        { maxDegree: 5 }
    ),
    "boolflip": new Level(
        "If the input is 0 return 1, if it is 1 return 0.", null, x => x.length ? [] : [new Rational(1)],
        { func: () => [].concat(Math.random() < .5 ? [] : [new Rational(1)]) }
    ),
    "evenodd": new Level(
        "Map odd numbers to 1, even numbers to 0", null, x => {
            const n = x[0].numerator
            return Poly.computed([n % 2]).arr
        }, { maxDenom: 1, negativeChance: 0, maxTerms: 1, maxDegree: 0, maxNumer: 99 }
    ),
    "sumcoeff": new Level(
        "Return the sum of all the coefficients.", null, x => Poly.computed(x).takeSubs(new Rational(1)).arr,
        { maxTerms: 5 }

    ),
    "lindiff": new Level(
        "Your input is ax+b. Return the difference a-b", null, (x) => {
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
    /*"linsolve": new Level(
        "Solve ax+b=0 (a is a positive integer).", null, x => {
            const [b, a] = x
            return Poly.computed([Rational.ratioOfTwo(b.copy.multiplyByInt(-1), a)]).arr
        }, {
        //func: () => Poly.computed([].map(x => new Rational(x))).arr
    }
    ),*/
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
    /*"keepodd": new Level(
        "Keep only the terms with an odd index.", null, x => {
            const p = Poly.computed(x).takeNeg()
            const q = Poly.computed(x).takeSubs(new Rational(-1))
            return p.sumWith(q).arr
        },
        { minTerms: 3, maxTerms: 5, maxDegree: 10 }
    ),*/
    /*"diffoftwo?": new Level(
        "Return the current input minus the next input.", null, (x, i, a) => {
            if (i % 2) return
            const [u, w] = [x, a[i + 1]].map(Poly.computed)
            w.takeNeg()
            return u.sumWith(w).arr
        }, { maxTerms: 2 }
    ),*/
    /*"posneg": new Level(
        "Return 1 if the input is positive, 0 if zero, and -1 if negative.", null, (x, i, a) => { }
    ),*/
    /*"incordec": new Level(
        "TODO : Return 1 is the polynomial is increasing at 0, and -1 otherwise", null, (x, i, a) => {
            return x
        }
    ),*/
    /*"sumofthree?": new Level(
        "Return the sum of the current and the next two inputs.", null, (x, i, a) => {
            if (i % 3) return
            const [u, v, w] = a.slice(i, i + 3).map(Poly.computed)
            return u.sumWith(v).sumWith(w).arr
        }, { numberOfInputs: 9, maxTerms: 1 }
    ),*/
    "twoxplusone": new Level(
        "Transform each polynomial to the polynomial 2x+1.", null, x => [1, 2].map(x => new Rational(x))
    ),
    "multhree": new Level(
        "The input is a constant  -  multiply it by 3.", null, x => x.map(u => new Rational(u).multiplyByInt(3)),
        { maxTerms: 1, maxDegree: 0, maxNumer: 20, maxDenom: 7 }
    ),
    "sumupto": new Level(
        "Return the sum of all positive integers from 1 to the input.", null, x => {
            const n = x[0].numerator
            return [new Rational(n * (n + 1) / 2)]
        }, { maxTerms: 1, maxNumer: 100, maxDegree: 0, maxDenom: 1, negativeChance: 0 }
    ),
    /*"squareX": new Level(
        "Your input is a constant - square it.", null, x => x.map(u => new Rational(u).multiplyBy(u.numerator).divideBy(u.denominator)),
        { maxTerms: 1, maxDegree: 0, maxNumer: 20, maxDenom: 20 }
    ),*/
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
    "statattwo": new Level(
        "Return those that have a stationary point at x=2.",
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
        "Return the leading term.", null, x => x.map((u, i, a) => i == a.length - 1 ? u : new Rational(0))
    ),
    /*"factorial?": new Level(
        "Your input is n. Return n!.", null, x => [new Rational(MM.fact(x[0].numerator))],
        { maxDenom: 1, maxNumer: 12, maxDegree: 0, negativeChance: 0 }
    ),*/
    "poweroftwo": new Level(
        "Given positive integer a, find 2^a.", null, x => [new Rational(2 ** x[0].numerator)],
        { maxDenom: 1, maxNumer: 11, maxDegree: 0, negativeChance: 0 }
    ),
    /*"inv": new Level(
        "Your inputs is a positive integer a. Return 1/a", null,
        (x, i, a) => { },
        { maxDenom: 1, negativeChance: 0, maxTerms: 1, maxDegree: 0, maxNumer: 20 }
    ),*/
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
    "powersoftwo": new Level(
        "Your inputs are all [1]. Generate the higher powers of two.", null,// x => [new Rational(2 ** x[0].numerator)],
        (x, i, a) => [new Rational(2 ** (i + 1))],
        { maxDenom: 1, maxNumer: 1, maxDegree: 0, negativeChance: 0 },
        { allowEarlyWin: true }
    ),
    /*"factorials": new Level(
        "Your inputs are all [1]. Generate the higher factorials.", null,
        (x, i, a) => [new Rational(MM.fact(i + 2))],
        { maxDenom: 1, maxNumer: 1, maxDegree: 0, negativeChance: 0 }
    ),*/
    "e": new Level(
        "Your inputs are all [1]. Approximate Euler's number.", null,
        (x, i, a) => MM.range(i + 1).reduce((s, t) => s.takeIntegral(), Poly.computed([1])).takeSubs(new Rational(1)).arr,
        { func: () => [new Rational(1)] },
        { allowEarlyWin: true }
    )

})

/**@type {Object<Level>} */
var tutorialLevels = Object.freeze({
    "IN_OUT1": new Level(
        `Move inputs from IN to OUT.
        Click a cell to select modules to place.

        You can see the inputs and expected outputs listed on the right.`
        , null, x => x, { numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "Reset": new Level(
        `When something goes wrong, click "Reset" in the right-upper corner.
        Wrong submissions will be indicated by a red-ish color on the right.
        
        You can add and delete modules like IN our OUT at your leisure.
        You can drag and drop, or click a cell then select from the menu.`
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
        `Clean up this mess.`
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
        `Return two copies of each input.
        Multiple IN modules will each send their own copy of an input.
        
        Fun fact: inputs are sent when there are no polynomials present in the system.`,
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
        `Raise the degree of each term by 1 using RAISE.
        Constants increase in degree too, except for [0].
        This effectively multiplies the polynomial by x.`,
        [[0, 0, 1], [1, 0, 3], [-2, 1], [2], [0]], x => Poly.computed(x).takeRaise().arr,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT RAISE LOWER".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "LOWER": new Level(
        `Lower the degree of the given term by 1 using LOWER.
        Note that the constant is discarded.
        The other terms are effectively divided by x.`
        , [[0, 0, 1], [1, 0, 3], [-2, 1], [2], [0]], x => Poly.computed(x).takeLower().arr,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT RAISE LOWER".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "DER": new Level(
        `
        
        Take derivative using INT.
        How is this different from LOWER?
        
        `
        , [[0, 0, 1], [1, 0, 3], [-2, 1], [2], [0]], x => Poly.computed(x).takeDerivative().arr,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT DER INT".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "INT": new Level(
        `You can integrate using INT.
        The constant of integration is always set to C = 1.
        This means that INT maps [0] to [1].`
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
        `Recall that INT always sets the constant of integration to C=1.
        So INT then CONST always returns [1].
        Map each input to [1].
        
        Similarly, RAISE then CONST would always return [2].`,
        null, x => [new Rational(1)], { numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT DER INT LEAD CONST RAISE LOWER".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "DEG1": new Level(
        `DEG returns the degree of the polynomial.
        The polynomial [0] is instead consumed.
        
        This could be useful for programming:
        so far this is the only module capable of consuming polynomials 
        instead of letting them pass through unconditionally.`
        , [[0, 0, 1], [1, 0, 3, 4], [0], [-2, 1, 0, 5], [2]],
        x => x.length ? Poly.computed(x).takeDegree().arr : null,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT DEG NEG".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "DEG2": new Level(
        `Map each input to [2].
        Hint: you know how to create x^2, don't you?`
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
        `TAKE discards the leading term and returns what remains.`
        , [[0, 0, 1], [1, 0, 3, 4], [-2, 1, 0, 5], [0], [2]], x => Poly.computed(x).takeTake().arr,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        { toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT TAKE COPY".split(" "), rows: 3, cols: 3, on_start: Level.tutorial }
    ),
    "COPY1": new Level(
        `
        COPY shoots out two copies of the incoming polynomial
        in the perpendicular directions.
        
        Horizontal movement is transformed to vertical, and vice versa.
        `
        , [[0, 0, 1], [1, 0, 3, 4], [-2, 1, 0, 5], [0], [2]], x => x,
        { minTerms: 3, maxTerms: 3, minDegree: 0, maxDegree: 2, numberOfInputs: 4 },
        {
            toolsRestrictedTo: "IN OUT UP DOWN LEFT RIGHT TAKE COPY".split(" "), rows: 3, cols: 3, on_start: Level.tutorial,
            on_start_more: function () { this.fromJSON(`[[1,0,"IN"],[1,2,"OUT"],[1,1,"COPY"]]`) }
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
    "POWtodo": null,
    "SUBStodo": null,
    "SUMtodo": null,
    "DOORtodo": null

})

/// settings
var stgs = {
    stage: -1,
    latestSelectorType: -1,
    localKeyName: "ZPkeys",
    localDataName: "ZPdatas",

}/// end of settings
var userSettings = {
    biggerButtons: false
}