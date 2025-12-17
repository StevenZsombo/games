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
            this.outputs = inputs.map(x => rule(x))
        } else {
            this.inputs = Level.random(10, genRules)
            this.outputs = this.inputs.map((x, i) => rule(x, i))
        }
        this.rule = rule
        this.genRules = genRules
    }

    static random(length, genRules = {}) {
        return Array.from({ length }, x => Poly.randomArrForPoly(genRules))
    }
}

/**@type {Object<Level>} */
const levels = {
    "identity": new Level(
        "Simply output the polynomial you received.", null, x => x
    ),
    "lead": new Level(
        "Output the leading coefficient of the polynomial you received", null, x => [x.at(-1)]
    ),
    "noconst": new Level(
        "Remove the constant term if there is any.", null, x => {
            let y = x.map((u, i) => i ? u : new Rational(0))
            if (y.length == 1 && y[0].numerator == 0) y = []
            return y
        }
    ),
    "four": new Level(
        "Transform each polynomial to the constant 4.", null, x => [new Rational(4)]
    ),
    "twoxplusone": new Level(
        "Transform each polynomial to the polynomial 2x+1", null, x => [1, 2].map(x => new Rational(x))
    ),
    "multhree": new Level(
        "The input is a constant  -  multiply it by 3", null, x => x.map(u => new Rational(u).multiplyBy(3)),
        { maxTerms: 1, maxDegree: 0, maxNumer: 20, maxDenom: 20 }
    ),
    "secondder": new Level(
        "Find the second derivative", null, x => x.slice(1).map((u, i) => new Rational(u).multiplyBy(i + 1)).slice(1).map((u, i) => u.multiplyBy(i + 1))
    )

}


/// settings
var stgs = {
    tolerance: 0.01,
    levels: levels,
    stage: -1

}/// end of settings