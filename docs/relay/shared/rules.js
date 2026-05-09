const RULES = {
    STUDENTS: ["Ann", "Bob", "Eve", "Dan"],

    //mind that resources are ABOVE current folder for both client & server
    PICTURES_FOLDER: "../pictures/",
    MAP_BACKGROUND_FOLDER: "../tiled/",

    MAPFILE: "../tiled/home1.json",
    MAP_FOLDER: "../tiled/",

    QUESTION_FOLDER: "../questions/",
    ACCURACY_FUNCTION: (attempt, solution) => {
        //integers must be exact
        if (Number.isInteger(solution)) return attempt == solution
        //non-integers must be accurate to 3sf
        return (attempt == solution) || (+attempt.toPrecision(3) == solution)
    },


    NUMBER_OF_TEAMS: 7,


    SERVER_BROADCAST_INTERVAL: 200,
    CLIENT_THROTTLE_FALLBACK_POS_INTERVAL: 2000, //if drift from server is out of sync

    DEBUG_MODE: true,

}
/*
layers
6 - terminal buttons
7 - player
8 - targeting


*/

const GRAPHICS = {
    SIZE: 64,
    TERMINAL_FONTSIZE: 28,
    PLAYER_FONTSIZE: 28,
    WADDLE_TIME: 200,
    CRAWL_VELOCITY: 1 / 200 * 64, //drift is better
    DRIFT_COEFFICENT: 0.037, //fuck if i know
    DRIFT_SNAP_SIZE_COEFFICIENT: 0.2,
    ALLOWED_MOVES_WITHOUT_DIAGONAL: [[-1, 0], [1, 0], [0, -1], [0, 1]],
    ALLOWED_MOVES_WITH_DIAGONAL: [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [-1, 1], [1, -1]],
    ALLOW_OOB_FOLLOW: false,
    ALLOW_CAMERA_FOLLOW: true,
    CAMERA_FOLLOW_COEFFICIENT: 0.02, //smoooooooooth
    TIME_NEEDED_TO_DRAG_BUT_DONT_MOVE: 800, //probably large enough that it's not accidental
    CAMERA_AND_OOB_FOLLOW_DELAY_TO_ENABLE_SNAP_BACK: 2000, //probably large enough to allow a pathing click
    SMOOTHING_DISABLED_FOR_BG: true,
    OVERWORLD_TRANSITION_TIME: 1500,
    STARS_COUNT: 220,
    STARS_DIMENSIONS: [1920 + 400, 1080 + 400],
    STARS_BASE_OFFSET: [-200, -200],
    STARS_ANIMATE_ON_OVERWORLD: false,
    STARS_HIDE_ON_OVERWORLD: false,

    TOP: 80,
    BOTTOM: 80,
    LEFT: 360,
    RIGHT: 300,
    ANSWER_AREA_HEIGHT: 80,
    FEED_MARGIN: 10,
    FEED_WIDTH: 330,
    FEED_HEIGHT: 60,
    NEUTRAL_BUTTON_BG_COLOR: "antiquewhite"

}
/**
 * @typedef {(
 *   { l: number; p: [number, number, number][]; e: number } |
 *   { t: number; e: number }
 * )[]} Broadcast
 * 
 * - If object has `l`: 
 *   - `l` is localID
 *   - `p` is positions array [playerID, i, j]
 *   - `e` is eventCount
 * - If object has `t`:
 *   - `t` is teamID
 *   - `e` is eventCount
 */
Chat.library = {
    defaultSpamInterval: 2000,
    defaultSpamRetries: 0,
    defaultWeeInterval: 250,
    defaultWeeRetries: 8,
    either: {
        time: Date.now,
    },
    client: {
        "eval": params => eval(params),
        "popup": txt => { GameEffects.popup(txt) },
        "ptc": (txt, teamID) => { game.ptc(txt, teamID) },
        "psr": (txt) => { game.psr(txt) },
        "reload": () => { chat.delayedReload() },
        "flush": () => { localStorage.clear(); chat.delayedReload(); },
        "rename": (newName) => { chat.forceName(newName, true); return newName; },
        "debug": () => { game.debugMode() },
        "bc": (params) => { game?.BROADCAST_RECEIVE(params) }, //broadcast
        "ping": () => chat.getPingStats(),
        "pingRecord": () => chat.pingRecord,

    },
    /**@type {Object<string, function (any, Person): any>} */
    server: {
        "ij": ([i, j], person) => { person.ij(i, j) },
        "enter": (personData, person) => person.enter(personData),
        "full": (_, person) => game.respondFULL_SYNC_EVENTS(person),
        "travel": (locaID, person) => person.travel(locaID),
        "rules": () => game.diffRULES.getDifferenceJSONableOnly(RULES),
        "question": (terminalID, person) => game.grabQuestionResponse(terminalID, person),
        "attempt": ([terminalID, guess], person) => game.attemptResponse(terminalID, guess, person),
    },

}