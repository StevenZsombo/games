{

    window.___spire = "spire.json"

    window.___heads = "heads.json"

    window.___students = "Aziz,Darren,Blake,Vamsi,Steven,Fritz,Alain,other1,other2"

    window.___minutes = [3, 2, 1]

}

const RULES = {
    EDITOR: location.hash.includes("editor"),
    FAKE: location.hash.includes("editor") || location.hash.includes("fake"),
    SAVE_AGGRESSIVELY: !(location.hash.includes("editor") || location.hash.includes("fake")),
    DEMO: "../questions/" + window.___spire, //can be null
    DEMOHEADS: "../questions/" + window.___heads, //can be null

    STUDENTS: window.___students.split(","),
    EMOJIS: Array.from(
        "🐶🐱🐭🐹🐰🦊🐻🐼🐨🐸🐒🐔🐧🐦🐤🐣🐥🐺🐗🐴🦄🐝🐛🦋🦉🐌🐞🐜🦟🦗🐢🐍🦎🐙🦐🦀🐠🐟🐡🐬🐳🦈🐊🦕🦖🐪🦘🦒🐘"
    ),

    MINUTES: window.___minutes,
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

    SERVER_BROADCAST_INTERVAL: 1000,


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
    SHOW_PLAYERS_RIGHT: 180,

    DRAG_COEFF: 0, //can be null or zero.
    DRAG_BUT_NO_CLICK_THRESHOLD: location.hash.includes("drag") ? 500 : 100,

    FONT_BIG: 64,
    FONT_MEDIUM: 48,
    FONT_SMALL: 32,
    FONT_TINY: 24,

    BOSS_color: "lightblue",

    EMOS_FONTSIZE: 40,
    EMOS_BREAK: 8,

}