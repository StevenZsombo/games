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
    imgScale: 8,
}


/**
 * @typedef {Object} Level
 * @property {function(*): number} x - key variable (int or Rat)
 * @property {function(number): string} t - question text
 * @property {function(number): number[]} a - array of possible answers
 * @property {function(number, number): boolean} f - function to check correct answers
 */

/** @type {Object.<string, Level>} */
var levels = {
    multiplesOf: {
        x: _ => MM.randomInt(2, 10),
        t: x => String.raw`Select multiples of $${x}$.`,
        a: x =>
            fluff(fluff([], MM.randomInt(4, 6), 2, 10).map(r => r * x), 10, 1, 100),
        f: (x, a) => a % x == 0,
    },
    factorsOf: {
        x: _ => (() => {
            const x = MM.randomInt(2, 49)
            return MM.isPrime(x) ? x + 1 : x
        })(),
        t: x => String.raw`Select factors of $${x}$.`,
        a: x => fluff(MM.choice(MM.divisors(x), MM.randomInt(3, 6)).concat([2 * x, 3 * x]), 10, 1, 100),
        f: (x, a) => x % a == 0,
    },
    evens: {
        t: _ => String.raw`Select the even numbers:`,
        f: (_, a) => a % 2 == 0
    },
    odds: {
        t: _ => String.raw`Select the odd numbers:`,
        f: (_, a) => a % 2 == 1

    },


}



class Rat {
    numer = 1
    denom = 0
    constructor(a, b) {
        if (a instanceof Rat) { this.numer = a.numer; this.denom = a.denom }
        if (Number.isInteger(a)) { this.numer = a; this.denom = b || 1 }
        else throw new Error(`Rat(${a},${b}) invalid in constructor.`)
    }

    static random(numerMin, numerMax, denomMin = 1, denomMax = 1) {
        return new Rat(MM.randomInt(numerMin, numerMax), MM.randomInt(denomMin, denomMax))
    }

    toString() {
        if (this.denom == 1) return `${this.numer}`
        return `\\frac{${this.numer}}{${this.denom}}`
    }
}