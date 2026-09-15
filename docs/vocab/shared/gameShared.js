class GameShared extends GameCore {





}

/**@param {number []} array */
const fluff = (array, targetLength, min, max) => {
    while (array.length < targetLength) {
        const r = MM.randomInt(min, max)
        if (!array.includes(r)) array.push(r)
    }
    return MM.shuffle(array)
}

const primesTwenty = MM.primes(20)
const primesFifty = MM.primes(50)
const primesHundred = MM.primes(100)

const GRAPHICS = {
    imgScale: 4,
}



class Rat {
    numer = 1
    denom = 0
    constructor(a, b) {
        if (a instanceof Rat) { this.numer = a.numer; this.denom = a.denom }
        if (Number.isInteger(a)) { this.numer = a; this.denom = b || 1 }
        else throw new Error(`Rat(${a},${b}) invalid in constructor.`)
    }

    static random(numerMin = 1, numerMax = 20, denomMin = 1, denomMax = 1) {
        return new Rat(MM.randomInt(numerMin, numerMax), MM.randomInt(denomMin, denomMax))
    }

    simplify() {
        const gcd = MM.gcd(this.numer, this.denom)
        this.numer /= gcd
        this.denom /= gcd
        return this
    }
    static randomProperSimplified(maxDenom = 100) {
        const d = MM.randomInt(2, maxDenom)
        const n = MM.randomInt(1, d - 1)
        return new Rat(n, d).simplify()
    }
    toString() {
        if (this.denom == 1) return `${this.numer}`
        return `\\frac{${this.numer}}{${this.denom}}`
    }
}







/**
 * @typedef {Object} Level
 * @property {function(*): number} x - key variable (int or Rat)
 * @property {string|function(number): string} t - question text
 * @property {function(number): number[]} a - array of possible answers
 * @property {function(number, number): boolean} f - function to check correct answers
 * @property {?number} w - weighting
 */

/** @type {Object.<string, Level>} */
var levels = {
    multiplesOf: {
        x: _ => MM.randomInt(2, 10),
        t: x => String.raw`Select multiples of $${x}$.`,
        a: x =>
            fluff(fluff([], MM.randomInt(4, 6), 2, 10).map(r => r * x), 10, 1, 100),
        f: (x, a) => a % x == 0,
        w: 2,
    },
    factorsOf: {
        x: _ => (() => {
            const x = MM.randomInt(2, 49)
            return MM.isPrime(x) ? x + 1 : x
        })(),
        t: x => String.raw`Select factors of $${x}$.`,
        a: x => fluff(MM.choice(MM.divisors(x), MM.randomInt(3, 6)).concat([2 * x, 3 * x]), 10, 1, 100),
        f: (x, a) => x % a == 0,
        w: 2,
    },
    evens: {
        t: String.raw`Select the even numbers:`,
        f: (_, a) => a % 2 == 0,
    },
    odds: {
        t: String.raw`Select the odd numbers:`,
        f: (_, a) => a % 2 == 1,

    },
    proper: {
        t: String.raw`Select the proper fractions:`,
        f: (_, a) => a.numer < a.denom,
        a: _ => Array(10).fill().map(_ => Rat.random(1, 20, 2, 20)),
    },
    improper: {
        t: String.raw`Select the proper fractions:`,
        f: (_, a) => a.numer >= a.denom,
        a: _ => Array(10).fill().map(_ => Rat.random(1, 20, 2, 20)),

    },
    simplified: {
        t: String.raw`Select the simplified fractions:`,
        f: (_, a) => MM.gcd(a.numer, a.denom) == 1,
        a: _ => Array(10).fill().map(_ => Rat.random(1, 20, 2, 20)),
    },
    square: {
        t: String.raw`Select the square numbers:`,
        f: (_, a) => Number.isInteger(Math.sqrt(a)),
        a: _ => fluff(fluff([], MM.randomInt(3, 6), 2, 10).map(x => x * x), 10, 2, 99),
    },
    cube: {
        t: String.raw`Select the cube numbers:`,
        f: (_, a) => Number.isInteger(Math.cbrt(a)),
        a: _ => fluff(MM.choice([2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 100], MM.randomInt(3, 6)).map(x => x ** 3), 10, 2, 200),
    },
    mixed: {
        gen: () => {
            console.log("asd")
            const lvl = {}
            lvl.t = String.raw`Select the mixed numbers:`
            const indices = fluff([], MM.randomInt(4, 6), 0, 9)
            lvl.solutions = Array(10).fill(false)
            indices.forEach(x => lvl.solutions[x] = true)
            lvl.answers = lvl.solutions.map(x =>
                x ? String.raw`${MM.randomInt(1, 20)}${Rat.randomProperSimplified()}`
                    : Rat.randomProperSimplified()
            )
            return lvl
        }
    },
    single: {
        gen: () => {
            console.log("asd")
            const lvl = {}
            lvl.t = String.raw`Select the single fractions:`
            const indices = fluff([], MM.randomInt(4, 6), 0, 9)
            lvl.solutions = Array(10).fill(false)
            indices.forEach(x => lvl.solutions[x] = true)
            lvl.answers = lvl.solutions.map(x => //copied from mixed
                !x ? String.raw`${MM.randomInt(1, 20)}${Rat.randomProperSimplified()}`
                    : Rat.randomProperSimplified()
            )
            return lvl
        },
    },
    reciprocal: {
        t: x => String.raw`Select the reciprocal of $${x}$:`,
        x: _ => Rat.random(1, 20, 1, 20).simplify(),
        a: x => {
            const a = Array(10).fill().map(x => Rat.randomProperSimplified())
            a[MM.randomIndex(10)] = new Rat(x.denom, x.numer)
            return a
        },
        f: (x, a) => a.numer / a.denom == x.denom / x.numer,
        w: 3,
    },
    toSingle: {
        gen: () => {
            const lvl = {}
            const intpart = MM.randomInt(1, 10)
            const fracpart = Rat.randomProperSimplified(20)
            const x = String.raw`${intpart}${fracpart}`
            lvl.t = String.raw`Write $${x}$ as a single fraction:`
            const correctNumer = intpart * fracpart.denom + fracpart.numer
            lvl.answers = Array(10).fill().map(_ => Math.random() < .65 ?
                new Rat(MM.randomInt(fracpart.denom, correctNumer * 2), fracpart.denom).simplify()
                : Rat.random(Math.ceil(correctNumer / 3), correctNumer * 5, 2, correctNumer * 2).simplify())
            lvl.answers[MM.randomIndex(lvl.answers.length)] = new Rat(correctNumer, fracpart.denom).simplify()
            lvl.solutions = lvl.answers.map(x => x.numer / x.denom == correctNumer / fracpart.denom)
            return lvl
        },
        w: 2,
    },
    toMixed: {
        gen: () => {
            const lvl = {}
        }
    },


}
