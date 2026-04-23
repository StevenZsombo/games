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
    DRIFT_COEFFICENT: 0.012,
    ALLOWED_MOVES: [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [-1, 1], [1, -1]],


}