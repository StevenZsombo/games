const RULES = {
    //mind that resources are ABOVE current folder for both client & server
    PICTURES_FOLDER: "../pictures/",
    MAP_BACKGROUND_FOLDER: "../tiled/",

    MAPFILE: "../tiled/station1.json",


    SERVER_BROADCAST_INTERVAL: 50,

}


const GRAPHICS = {
    SIZE: 64,
    WADDLE_TIME: 200,
    CRAWL_VELOCITY: 1 / 200 * 64, //drift is better
    DRIFT_COEFFICENT: 0.03,
    DRIFT_SNAP_SIZE_COEFFICIENT: 0.05,
    ALLOWED_MOVES: [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [-1, 1], [1, -1]],
    ALLOW_OOB_FOLLOW: false,
    ALLOW_CAMERA_FOLLOW: true,
    FOLLOW_CAMERA_COEFFICIENT: 0.03,
    TIME_NEEDED_TO_DRAG_BUT_DONT_MOVE: 500,


}


/**
 * @typedef {Object} Broadcast
 * @property {Array<[number, Array<[number, number, number]>]>} l
 *   loca updates as [locaID, [...playerPositions]]
 *   where playerPositions are [playerID, x, y]
 */
Chat.library = {
    defaultSpamInterval: 800,
    defaultSpamRetries: 0,
    defaultWeeInterval: 400,
    defaultWeeRetries: 3,
    client: {
        "bc": (params) => { game?.BROADCAST_RECEIVE(params) } //broadcast
    },
    server: {
        "ij": ([i, j], person) => person.ij(i, j),
        "enter": (_, person) => person.enter()
    },

}