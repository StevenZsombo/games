const div = (a, b) => {
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