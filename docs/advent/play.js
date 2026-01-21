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

/*

//palindrome setup
const palindrome = x => [...String(x)].every((t, i, a) => a.at(-1 - i) == t)
const range = Array.from({ length: 900 }, (_, i) => 100 + i)

//palindrome two ways
console.time("By filtering")
console.log(
    range
        .flatMap(x => range.map(y => x * y))
        .filter(palindrome)
        .reduce((s, t) => s > t ? s : t))
console.timeEnd("By filtering")
console.time("Sorting first")
console.log(
    range
        .flatMap(x => range.map(y => x * y))
        .sort((u, w) => w - u)
        .find(palindrome)
)
console.timeEnd("Sorting first")
//sorting first seems to roughly be twice as fast

//by generator
const cartesian = function* () {
    for (let i = 100; i < 1000; i++)
        for (let j = 100; j <= i; j++)
            yield i * j
}
console.time("By generator")
console.log(
    cartesian()
        .filter(palindrome)
        .reduce((s, t) => s > t ? s : t)
)
console.timeEnd("By generator")

*/
/*
const range = function* (n) { for (let i = 0; i < n; i++) yield i }

console.log(
    range(1000)
        .flatMap(x => range(x).flatMap(y => range(y).map(z => [x, y, z])))
        .some(([c, b, a]) =>
            a ** 2 + b ** 2 == c ** 2 && a + b + c == 1000)
)

*/

/*
console.log(
    "7316717653133062491922511967442657474235534919493496983520312774506326239578318016984801869478851843858615607891129494954595017379583319528532088055111254069874715852386305071569329096329522744304355766896648950445244523161731856403098711121722383113622298934233803081353362766142828064444866452387493035890729629049156044077239071381051585930796086670172427121883998797908792274921901699720888093776657273330010533678812202354218097512545405947522435258490771167055601360483958644670632441572215539753697817977846174064955149290862569321978468622482839722413756570560574902614079729686524145351004748216637048440319989000889524345065854122758866688116427171479924442928230863465674813919123162824586178664583591245665294765456828489128831426076900422421902267105562632111110937054421750694165896040807198403850962455444362981230987879927244284909188845801561660979191338754992005240636899125607176060588611646710940507754100225698315520005593572972571636269561882670428252483600823257530420752963450"
    .split("")
    .map((_, i, a) => a.slice(i, i + 13).reduce((s, t) => s * t, 1))
    .reduce((s, t) => s > t ? s : t, 0)

    )

    */


//pandigital products