class Level {
    /**
     * @param {String} instructions
     * @param {Array<Poly> | Array<Array<Rational>>} inputs
     * @param {Function} rule inputs.map((x)=>rule(x))
     */
    constructor(instructions, inputs, rule, genRules = {}) {
        this.instructions = instructions
        this.inputs = inputs
            ? inputs.map(x => Poly.computed(x).arr)
            : Level.random(genRules)
        this.outputs = this.inputs
            .map((x, i, a) => rule(x, i, a))
            .filter(x => x != null)
        this.rule = rule
        this.genRules = genRules
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
}

/**@type {Object<Level>} */
const levels = {
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
        "Multiply the input by x^3.", null, x => Poly.computed(x).raise().raise().raise().arr
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

    "everyother": new Level(
        "Return only every other input.", null, (x, i, a) => i % 2 ? x : null
    ),
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
    "linsolve": new Level(
        "Your input is ax+b. Solve ax+b=0.", null, x => {
            const [b, a] = x
            return Poly.computed([Rational.ratioOfTwo(b.copy.multiplyByInt(-1), a)]).arr
        }, { minDegree: 0, maxDegree: 1, minTerms: 2, maxTerms: 2 }
    ),
    "linmax": new Level(
        "Your input is ax+b. Return the larger of positive a and b.", null, (x) => {
            const [b, a] = x
            const diff = Rational.differenceOfTwo(a, b)
            return [diff.numerator > 0 ? a : b]
        }, { minDegree: 0, maxDegree: 1, minTerms: 2, maxTerms: 2, maxNumer: 20, negativeChance: 0 }
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
        "Return the sum of all positive integers from 1 to the input", null, x => {
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
            const px = p.copy.raise()
            p.takeNeg()
            p.sumWith(px)
            p.sumWith(px)
            return p.arr
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
            let q = Poly.computed(p.arr.slice(0, 5))
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
        { maxDenom: 1, maxNumer: 1, maxDegree: 0, negativeChance: 0 }
    ),
    /*"factorials": new Level(
        "Your inputs are all [1]. Generate the higher factorials.", null,
        (x, i, a) => [new Rational(MM.fact(i + 2))],
        { maxDenom: 1, maxNumer: 1, maxDegree: 0, negativeChance: 0 }
    ),*/
    "e": new Level(
        "Your inputs are all [1]. Approximate Euler's number.", null,
        (x, i, a) => MM.range(i + 1).reduce((s, t) => s.takeIntegral(), Poly.computed([1])).takeSubs(new Rational(1)).arr,
        { func: () => [new Rational(1)] }
    )

}


/// settings
var stgs = {
    tolerance: 0.01,
    levels: levels,
    stage: -1,
    localKeyName: "ZPkeys",
    localDataName: "ZPdatas"

}/// end of settings