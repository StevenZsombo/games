const RULES = {
    //mind that resources are ABOVE current folder for both client & server
    PICTURES_FOLDER: "../pictures/",
    MAP_BACKGROUND_FOLDER: "../tiled/",

    MAPFILE: "../tiled/station1.json",

}


const GRAPHICS = {
    SIZE: 64,
    WADDLE_TIME: 200,
    CRAWL_VELOCITY: 1 / 200 * 64, //drift is better
    DRIFT_COEFFICENT: 0.03,
    DRIFT_SNAP_SIZE_COEFFICIENT: 0.1,
    ALLOWED_MOVES: [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [-1, 1], [1, -1]],
    ALLOW_OOB_FOLLOW: false,
    ALLOW_CAMERA_FOLLOW: true,
    FOLLOW_CAMERA_COEFFICIENT: 0.03,
    TIME_NEEDED_TO_DRAG_BUT_DONT_MOVE: 500,


}



Chat.library = {
    client: {
        "bc": (params) => { BROADCAST_RECEIVE(params) } //broadcast
    },
    server: {

    },

}