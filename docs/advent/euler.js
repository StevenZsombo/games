/*const div = (a, b) => {
    let ans = []
    let previousRemainders = []
    let quo = Math.floor(a / b)
    rem = a % b
    ans.push(quo)
    while (!previousRemainders.includes(rem)) {
        previousRemainders.push(rem)
        rem *= 10
        quo = Math.floor(rem / b)
        rem = rem % b
        ans.push(quo)
    }
    startrep = previousRemainders.findIndex(x => x == rem) + 1
    return { a, b, ans, nonrep: ans.slice(0, startrep), rep: ans.slice(startrep) }
}
*/

//problem 549
//goal: find the largest prime factor and to what power it is.

const largestPower = function (number, prime) {
    let i = -1
    let quo = number
    while (Number.isInteger(quo)) {
        quo /= prime
        i++
    }
    return i
}//unoptimized but whatevs


// const UPTO = 10 ** 8 + 2
const UPTO = 100

const primeMask = new Uint32Array(UPTO).fill(0)
primeMask[0] = primeMask[1] = 1
for (let i = 2; i < UPTO; i++) {
    if (primeMask[i] == 0) { //demonstrably prime
        for (let j = i; j < UPTO; j += i) {
            primeMask[j] = i //largest prime factor so far
        }
    }
}


const powerMask = new Uint32Array(UPTO).fill(0)
for (let i = 2; i < UPTO; i++) {
    powerMask[i] = largestPower(i, primeMask[i])
}


const smallestFactorial = function (prime, exponent) {
    let i = 1
    let acc = 1
    while (acc < exponent) {
        i++
        acc += largestPower(i * prime, prime)
    }
    return i * prime
}

let sum = 0
for (let i = 2; i < UPTO; i++) {
    sum += smallestFactorial(primeMask[i], powerMask[i]) // this is wrong : I do not account for say squares
}
console.log(sum)

