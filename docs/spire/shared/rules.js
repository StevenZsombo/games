const RULES = {
    EDITOR: location.href.includes("localhost") && location.hash.includes("editor"),
    FAKE: location.hash.includes("editor") || location.hash.includes("fake"),
    SAVE_AGGRESSIVELY: !(location.hash.includes("editor") || location.hash.includes("fake")),
    QUESTION_FOLDER: "../questions/",
    get DEMO() { return this.QUESTION_FOLDER + window.___spire },
    get DEMOHEADS() { return this.QUESTION_FOLDER + window.___heads },
    ALLOW_BACKGROUND: true,

    STUDENTS: window.___students.split(",").map(x => x.trim()).filter(x => x),
    EMOJIS: Array.from(
        "🐶🐱🐭🐹🐰🦊🐻🐼🐨🐸🐒🐔🐧🐦🐤🐣🐥🐺🐗🐴🦄🐝🐛🦋🦉🐌🐞🐜🦟🦗🐢🐍🦎🐙🦐🦀🐠🐟🐡🐬🐳🦈🐊🦕🦖🐪🦘🦒🐘"
    ),

    MINUTES: window.___minutes.split(",").map(x => x.trim()).filter(x => x).map(x => +x),
    BEFORE_BOSS_WAIT_TIME: 8_000,


    ACCURACY_FUNCTION: (attempt, solution) => {
        //integers must be exact
        if (Number.isInteger(solution)) return attempt == solution
        //non-integers must be accurate to 3sf
        return (attempt == solution) || (+attempt.toPrecision(3) == solution)
    },

    SCROLLWHEEL_SPEED: 40,
    SKIP_INTRO: location.hash.includes("editor") || location.hash.includes("skip"),

    SERVER_BROADCAST_INTERVAL: 1000,

    ANTICHEAT: window.___anticheat !== "off",
    ANTICHEAT_WARN_BUT_DONT_PUNISH: window.___anticheat === "warn",
    // ANTICHEAT_WARN_COLOR: "rgba(200, 0, 0, 0.55)",
    // ANTICHEAT_WARN_COLOR: "rgba(100, 0, 50, 0.7)",
    // ANTICHEAT_WARN_COLOR: "rgba(255,255, 0, 0.7)",
    ANTICHEAT_WARN_COLOR: "rgba(180, 0, 0, 0.65)",
    ANTICHEAT_SECONDS: 30,

}


const GRAPHICS = {
    SPOT_WIDTH: 160 * 2,
    SPOT_HEIGHT: 90 * 2,
    SPOT_COLOR: "lightgray",
    SPOT_COLOR_SOLVED: "lightgreen",
    SPOT_COLOR_SOLVED_OPAQUE: "rgba(20, 200, 20, 0.7)",
    SPOT_COLOR_FAILED: "red",
    SPOT_COLOR_FAILED_OPAQUE: "rgba(200, 20, 20, 0.7)",
    SPOT_COLOR_UNREACHABLE_OPAQUE: "rgba(200, 200, 0, 0.7)",
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

    ALLOW_ZOOM_SLIDER: true,
    ZOOM_SLIDER_RIGHT: 20,
    ZOOM_MAXIMUM: +window.___zoom || 3,

    DRAG_COEFF: 0, //can be null or zero.
    DRAG_BUT_NO_CLICK_THRESHOLD: location.hash.includes("drag") ? 500 : 100,

    FONT_BIG: 64,
    FONT_MEDIUM: 48,
    FONT_SMALL: 32,
    FONT_TINY: 24,
    DEFAULT_SOLUTION: 666666,

    BOSS_color: "lightblue",

    EMOS_FONTSIZE: 40,
    EMOS_BREAK: 8,

}

const MASTER = {
    EXPORT_TO_EXCEL: true,
    EXPORT_TO_JSON: false,
    ALSO_SHOW_ON_NEW_TAB: false,

}


    ;
(() => {
    if (location.hash.includes("public")) {
        RULES.QUESTION_FOLDER = "../questionsPublic/"
        GRAPHICS.ZOOM_MAXIMUM = 2.8
        window.___spire = "spire.json"
        window.___heads = "heads.json"
    }

})()