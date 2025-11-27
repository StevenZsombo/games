/// settings
const changelogGlobal =
    `
    2025.11.17.
    Compressions are more common now (was 25% of stretches, now is 40%)
    Broken line functions are now made of at least 3 pieces (was 2)
    Changed the color of the axes from pink to plum (more visible)
    $
    2025.11.18.
    "Submit" button has been added. It must be clicked to verify a solution.
    The latest submission attempt will be plotted in blue.
    Coordinate axes are now scaled 1:1.
    Trigonometry is less common in randomimed puzzles unless selected (was 33%, now 20%).
    Removed atan from the random trig puzzles. Sec and cosec are now less common.
    Lagrange interpolated polynomials are generated with generally smaller gradient.
    Lagrange interpolated parabolas will never be based on a symmetric V-shape of 3 points.
    No longer forcing integer values after compressions.
    $
    2025.11.19.
    Added worded transformation options
    Added an animation to worded transformations - is visually insightful and also prevents spamming
    $
    2025.11.20.
    Fixed animation bugs
    The blue curve is now also animated for visual feedback, though not step by step
    Input buttons are now lightblue for visual cohesion
    $
    2025.11.24.
    Green "Undo" button now undoes the previous transformation instead of fully reverting the curve
    Highlighted points for y=sin(x) are now [0,pi/2,pi,3pi/2]
    $
    2025.11.26.
    Green curve transformations are now recorded with green text.
    Submit button remains inactive while green stuff plays.
    Dev options extended for custom function drawing.
    Added keyboard controls.
    `
const stgs = {
    tolerance: 0.02,
    stage: 3, //-1 for selector
    victories: [],
    allowVictoryByAlternateValues: false, //yet to be implemented
    randomLevelData: null,
    labelPoints: true,
    randomType: "Squiggly",
    firstRun: true,
    animationsEnabled: true,
    changelog: changelogGlobal,
    compressionsFixDesired: false,
    matchedAxesDesired: true,
    transformAnimationTime: 1000, //can set to 0 to disable animation
    sendFancyTime: 500, //can set to 0 to disable animation
    transformSendFancyTime: 500
}/// end of settings

const levels = [
    [MM.brokenLineFunction(1, 2, 4, 6, 7, -2), [1, 4, 7], 1, 1, 2, 3],
    [MM.brokenLineFunction(-3, 3, 1, 5, 3, -1, 6, 2), [-3, 1, 3, 6], 1, -1 / 2, 0, 0],
    [MM.brokenLineFunction(1, 5, 2, 6, 7, -4), [1, 2, 7], -1, -1, 0, 2],
    [MM.brokenLineFunction(1, 2, 2, 4, 3, 1, 4, 5, 5, 1), [1, 2, 3, 4, 5], 2, 3, 1, - 2],
    [x => Math.sin(x), [0, 3 * PI / 2, PI, TWOPI], -1, 2, 0, 2],
    [x => { return Math.sqrt(16 - (x - 4) * (x - 4)) }, [0, 4, 8], -1 / 4, 1 / 2, -1, 3],
    [x => { if (x < -3 || x > 9) { return }; return (x * x - 4 * x + 6) }, [-3, 2, 9], 2 / 3, -1 / 2, 4, -3],
    [x => { if (x != 0) { return 4 / x / x } }, [-2, -1, 1, 2], -1, 1 / 2, 3, +2],
    [x => { if (x > -PI / 2 && x < PI / 2) { return 2 * Math.tan(x) } }, [-PI / 4, 0, PI / 4], 2, 1, 0, 10],
    [x => x ** 3 - 4 * x, [-2, 0, 1, 2], -1 / 3, 1 / 2, -1, 3]
]



