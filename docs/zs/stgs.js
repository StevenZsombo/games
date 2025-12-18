class Level {
    /**
     * @param {String} instructions
     * @param {Array<Poly> | Array<Array<number>>} inputs
     * @param {Function} rule inputs.map((x)=>rule(x))
     */
    constructor(instructions, inputs, rule, genRules = {}) {
        this.instructions = instructions
        if (inputs) {
            this.inputs = inputs.map(x => new Rational(x))
        } else {
            this.inputs = Level.random(genRules)
        }
        this.outputs = this.inputs
            .map((x, i, a) => rule(x, i, a))
            .filter(x => x != null)
        this.rule = rule
        this.genRules = genRules
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
        "Find the second derivative.", null, x => x.slice(1).map((u, i) => new Rational(u).multiplyBy(i + 1)).slice(1).map((u, i) => u.multiplyBy(i + 1))
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
    "lindiff": new Level(
        "Your input is ax+b. Return the difference a-b", null, (x) => {
            const [b, a] = x
            return Poly.computed([Rational.sumOfTwo(new Rational(b).multiplyBy(-1), a)]).arr
        }, { minDegree: 0, maxDegree: 1, minTerms: 2, maxTerms: 2 }
    ),
    "diffoftwo?": new Level(
        "Return the current input minus the next input.", null, (x, i, a) => {
            if (i % 2) return
            const [u, w] = [x, a[i + 1]].map(Poly.computed)
            w.takeNeg()
            return u.sumWith(w).arr
        }, { maxTerms: 2 }
    ),
    "posneg": new Level(
        "Return 1 if the input is positive, 0 if zero, and -1 if negative.", null, (x, i, a) => { }
    ),
    "incordec": new Level(
        "TODO : Return 1 is the polynomial is increasing at 0, and -1 otherwise", null, (x, i, a) => {
            return x
        }
    ),
    "sumofthree?": new Level(
        "Return the sum of the current and the next two inputs.", null, (x, i, a) => {
            if (i % 3) return
            const [u, v, w] = a.slice(i, i + 3).map(Poly.computed)
            return u.sumWith(v).sumWith(w).arr
        }, { numberOfInputs: 9, maxTerms: 1 }
    ),
    "twoxplusone": new Level(
        "Transform each polynomial to the polynomial 2x+1.", null, x => [1, 2].map(x => new Rational(x))
    ),
    "multhree": new Level(
        "The input is a constant  -  multiply it by 3.", null, x => x.map(u => new Rational(u).multiplyBy(3)),
        { maxTerms: 1, maxDegree: 0, maxNumer: 20, maxDenom: 20 }
    ),
    /*"squareX": new Level(
        "Your input is a constant - square it.", null, x => x.map(u => new Rational(u).multiplyBy(u.numerator).divideBy(u.denominator)),
        { maxTerms: 1, maxDegree: 0, maxNumer: 20, maxDenom: 20 }
    ),*/
    "multwoxminusone": new Level(
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
    "leadingterm?": new Level(
        "Return the leading term.", null, x => x.map((u, i, a) => i == a.length - 1 ? u : new Rational(0))
    ),
    "poweroftwo?": new Level(
        "Your input is a positive constant a. Return 2^a.", null, x => [new Rational(2 ** x[0].numerator)],
        { maxDenom: 1, maxNumer: 8, maxDegree: 0, negativeChance: 0 }
    )

}


/// settings
var stgs = {
    tolerance: 0.01,
    levels: levels,
    stage: -1

}/// end of settings