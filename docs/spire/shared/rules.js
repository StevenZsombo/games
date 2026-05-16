const RULES = {
    EDITOR: location.hash.includes("editor"),
    FAKE: location.hash.includes("editor") || location.hash.includes("fake"),
    SAVE_AGGRESSIVELY: !(location.hash.includes("editor") || location.hash.includes("fake")),
    DEMO: "../questions/demo.json", //can be null
    DEMOHEADS: "../questions/demoHeads.json", //can be null

    STUDENTS: ["Aziz", "Darren", "Blake", "Vamsi", "Steven", "Fritz", "Alain", "other1", "other2"],
    EMOJIS: Array.from("🐶🐱🐭🐹🐰🦊🐻🐼🐨🐸🐒🐔🐧🐦🐤🐣🐥🐺🐗🐴🦄🐝🐛🦋🐌🐞🐜🦟🦗🐢🐍🦎🐙🦐🦀🐠🐟🐡🐬🐳🐋🦈🐊🦕🦖🐪🐫🦒🐘"),

    MINUTES: [0.2, 0.1, 0.05],
    BEFORE_BOSS_WAIT_TIME: 8_000,

    QUESTION_FOLDER: "../questions/",
    ACCURACY_FUNCTION: (attempt, solution) => {
        //integers must be exact
        if (Number.isInteger(solution)) return attempt == solution
        //non-integers must be accurate to 3sf
        return (attempt == solution) || (+attempt.toPrecision(3) == solution)
    },

    SCROLLWHEEL_SPEED: 40,
    SKIP_INTRO: location.hash.includes("editor") || location.hash.includes("skip"),


}


const GRAPHICS = {
    SPOT_WIDTH: 160 * 2,
    SPOT_HEIGHT: 90 * 2,
    SPOT_COLOR: "lightgray",
    SPOT_COLOR_SOLVED: "lightgreen",
    SPOT_COLOR_SOLVED_OPAQUE: "rgba(20, 200, 20, 0.7)",
    SPOT_COLOR_FAILED: "red",
    SPOT_COLOR_FAILED_OPAQUE: "rgba(200, 20, 20, 0.7)",
    SPOT_COLOR_HIDDEN: "lightgray",
    SPOT_HYDRA_SIZE_COEFF: [1.4, 1],
    SPOT_HYDRA_COLOR: "lightblue",

    SLIDE_TIME: 500,
    CALCULA_BRINGUP_TIME: 500,
    FULLVIEW_BRINGUP_TIME: 400,
    OFFERER_WAVE_TIME: 10 * 1000,
    ANSWER_SPACE_COLOR: "white",


    BOTTOM: 125,

    DRAG_COEFF: 0, //can be null or zero.
    DRAG_BUT_NO_CLICK_THRESHOLD: location.hash.includes("drag") ? 500 : 100,

    FONT_BIG: 64,
    FONT_MEDIUM: 48,
    FONT_SMALL: 32,

    BOSS_color: "lightblue",

}