/// settings
const changelogGlobal =
    `
    2025.11.17.
    Integer values are forced even if compressions are involved
    Compressions are more common now (was 25% of stretches, now is 40%)
    Broken line functions are now made of at least 3 pieces (was 2)
    Changed the color of the axes from pink to plum (more visible)
    `
const stgs = {
    tolerance: 0.02,
    stage: -1, //-1 for selector
    victories: [],
    allowVictoryByAlternateValues: false, //yet to be implemented
    randomLevelData: null,
    labelPoints: true,
    randomType: "Any",
    firstRun: true,
    animationsEnabled: true,
    changelog: changelogGlobal
}/// end of settings

const levels = [
    [MM.brokenLineFunction(1, 2, 4, 6, 7, -2), [1, 4, 7], 1, 1, 2, 3],
    [MM.brokenLineFunction(-3, 3, 1, 5, 3, -1, 6, 2), [-3, 1, 3, 6], 1, -1 / 2, 0, 0],
    [MM.brokenLineFunction(1, 5, 2, 6, 7, -4), [1, 2, 7], -1, -1, 0, 2],
    [MM.brokenLineFunction(1, 2, 2, 4, 3, 1, 4, 5, 5, 1), [1, 2, 3, 4, 5], 2, 3, 1, - 2],
    [x => Math.sin(x), [0, PI, TWOPI], -1, 2, 0, 2],
    [x => { return Math.sqrt(16 - (x - 4) * (x - 4)) }, [0, 4, 8], -1 / 4, 1 / 2, -1, 3],
    [x => { if (x < -3 || x > 9) { return }; return (x * x - 4 * x + 6) }, [-3, 2, 9], 2 / 3, -1 / 2, 4, -3],
    [x => { if (x != 0) { return 4 / x / x } }, [-2, -1, 1, 2], -1, 1 / 2, 3, +2],
    [x => { if (x > -PI / 2 && x < PI / 2) { return 2 * Math.tan(x) } }, [-PI / 4, 0, PI / 4], 2, 1, 0, 10],
    [x => x ** 3 - 4 * x, [-2, 0, 1, 2], -1 / 3, 1 / 2, -1, 3]
]



