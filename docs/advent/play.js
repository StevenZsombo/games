/*
//number that is divisible by every number from 1 to 20.
const count = function* () { let n = 20; while (1) yield n++ } //integers from 20
const tests = Array.from({ length: 18 }, (_, i) => i + 2) //integers 2 to 20
const best = count().find(n => tests.every(i => !(n % i)))
console.log(best)

*/
/*
const gcd = (a, b) => {
    while (b !== 0) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a;
};

const lcm = (a, b) => (a / gcd(a, b)) * b

console.log(Array.from({ length: 18 }, (_, i) => i + 2).reduce((s, t) => lcm(s, t)))
*/
/*
const gcd = (a, b) => {
    while (b) [a, b] = [b, a % b]
    return a
}
    */