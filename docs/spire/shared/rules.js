const RULES = {
    EDITOR: location.hash.includes("editor"),

    QUESTION_FOLDER: "../questions/",
    ACCURACY_FUNCTION: (attempt, solution) => {
        //integers must be exact
        if (Number.isInteger(solution)) return attempt == solution
        //non-integers must be accurate to 3sf
        return (attempt == solution) || (+attempt.toPrecision(3) == solution)
    },


}


const GRAPHICS = {
    SPOT_WIDTH: 160 * 2,
    SPOT_HEIGHT: 90 * 2,
    SPOT_COLOR: "lightgray",

    BOTTOM: 80,

    FONT_BIG: 64,
    FONT_MEDIUM: 48,
    FONT_SMALL: 32

}