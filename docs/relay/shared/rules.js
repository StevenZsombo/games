const RULES = {
    //mind that resources are ABOVE current folder for both client & server
    PICTURES_FOLDER: "../pictures/",
    MAP_BACKGROUND_FOLDER: "../tiled/",

    MAPFILE: "../tiled/home1.json",
    MAP_FOLDER: "../tiled/",

    NUMBER_OF_TEAMS: 6,


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
    DOWNSCALING: 0, //0 or 1 to disable, higher = worse. //STUPID don't use
    OVERWORLD_TRANSITION_TIME: 1500,
    STARS_COUNT: 220,
    STARS_DIMENSIONS: [1920 + 400, 1080 + 400],
    STARS_BASE_OFFSET: [-200, -200],
    STARS_ANIMATE_ON_OVERWORLD: false,
    STARS_HIDE_ON_OVERWORLD: false,

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
        "debug": () => { game.debugMode() },
        "bc": (params) => { game?.BROADCAST_RECEIVE(params) }, //broadcast

    },
    server: {
        "ij": ([i, j], person) => { person.ij(i, j) },
        "enter": (personData, person) => person.enter(personData),
        "full": (_, person) => game.respondFULL_SYNC_EVENTS(person)
    },

}