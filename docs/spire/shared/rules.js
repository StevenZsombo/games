const RULES = {
    EDITOR: location.hash.includes("editor"),
    FAKE: location.hash.includes("editor") || location.hash.includes("fake"),

    DEMO: "../questions/demo.json", //can be null
    DEMOHEADS: "../questions/demoHeads.json", //can be null

    QUESTION_FOLDER: "../questions/",
    ACCURACY_FUNCTION: (attempt, solution) => {
        //integers must be exact
        if (Number.isInteger(solution)) return attempt == solution
        //non-integers must be accurate to 3sf
        return (attempt == solution) || (+attempt.toPrecision(3) == solution)
    },

    SCROLLWHEEL_SPEED: 100,
    SKIP_INTRO: location.hash.includes("editor") || location.hash.includes("skip"),


}


const GRAPHICS = {
    SPOT_WIDTH: 160 * 2,
    SPOT_HEIGHT: 90 * 2,
    SPOT_COLOR: "lightgray",
    SPOT_COLOR_SOLVED: "lightgreen",
    SPOT_HYDRA_SIZE_COEFF: [1.4, 1],
    SPOT_HYDRA_COLOR: "lightblue",

    SLIDE_TIME: 500,


    BOTTOM: 105,

    DRAG_COEFF: 0, //can be null or zero.
    DRAG_BUT_NO_CLICK_THRESHOLD: location.hash.includes("drag") ? 500 : 100,

    FONT_BIG: 64,
    FONT_MEDIUM: 48,
    FONT_SMALL: 32,

    BOSS_color: "lightblue",

}