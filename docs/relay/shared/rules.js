const RULES = {
    //mind that resources are ABOVE current folder for both client & server
    PICTURES_FOLDER: "../pictures/",
    MAP_BACKGROUND_FOLDER: "../tiled/",

    MAPFILE: "../tiled/station2.json",


    SERVER_BROADCAST_INTERVAL: 50,
    CLIENT_THROTTLE_FALLBACK_POS_INTERVAL: 2000, //if drift from server is out of sync

}
/*
layers
6 - terminal buttons
7 - player
8 - targeting


*/

const GRAPHICS = {
    SIZE: 64,
    WADDLE_TIME: 200,
    CRAWL_VELOCITY: 1 / 200 * 64, //drift is better
    DRIFT_COEFFICENT: 0.04,
    DRIFT_SNAP_SIZE_COEFFICIENT: 0.1,
    ALLOWED_MOVES_WITHOUT_DIAGONAL: [[-1, 0], [1, 0], [0, -1], [0, 1]],
    ALLOWED_MOVES_WITH_DIAGONAL: [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [-1, 1], [1, -1]],
    ALLOW_OOB_FOLLOW: false,
    ALLOW_CAMERA_FOLLOW: true,
    CAMERA_FOLLOW_COEFFICIENT: 0.03,
    TIME_NEEDED_TO_DRAG_BUT_DONT_MOVE: 800, //probably small enough that it's not accidental
    CAMERA_AND_OOB_FOLLOW_DELAY_TO_ENABLE_SNAP_BACK: 2000, //probably large enough to allow a pathing click


}


/**
 * @typedef {Object} Broadcast
 * @property {Array<[number, Array<[number, number, number]>]>} l
 *   loca updates as [locaID, [...playerPositions]]
 *   where playerPositions are [playerID, x, y]
 */
Chat.library = {
    defaultSpamInterval: 2000,
    defaultSpamRetries: 0,
    defaultWeeInterval: 250,
    defaultWeeRetries: 8,
    client: {
        "eval": params => eval(params),
        "bc": (params) => { game?.BROADCAST_RECEIVE(params) }, //broadcast
    },
    server: {
        "ij": ([i, j], person) => person.ij(i, j),
        "enter": (_, person) => person.enter()
    },

}