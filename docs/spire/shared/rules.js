const RULES = {
    EDITOR: location.hash.includes("editor"),
    FAKE: location.hash.includes("editor") || location.hash.includes("fake"),

    QUESTION_FOLDER: "../questions/",
    ACCURACY_FUNCTION: (attempt, solution) => {
        //integers must be exact
        if (Number.isInteger(solution)) return attempt == solution
        //non-integers must be accurate to 3sf
        return (attempt == solution) || (+attempt.toPrecision(3) == solution)
    },

    SCROLLWHEEL_SPEED: 100,


}


const GRAPHICS = {
    SPOT_WIDTH: 160 * 2,
    SPOT_HEIGHT: 90 * 2,
    SPOT_COLOR: "lightgray",
    SPOT_COLOR_SOLVED: "lightgreen",

    SLIDE_TIME: 1000,

    BOTTOM: 80,

    FONT_BIG: 64,
    FONT_MEDIUM: 48,
    FONT_SMALL: 32,

    BOSS_color: "lightblue",

}