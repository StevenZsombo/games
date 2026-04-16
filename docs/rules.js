//#region RULES.
var RULES = ({
    NUMBER_OF_TEAMS: 5, //////////////////////////////////
    NUMBER_OF_TERRITORIES: 60, /////////////////////////////////
    PICTURE_BACKGROUND_MAP: "blake.png", //cannot null //with extension ///////////////////////////
    MAPFILE: "./conquest/maps/map.json", //handled if missing. can be null -> defaults to rules
    TERRITORY_BASE_VALUE: 300,
    CAPITAL_BASE_VALUE: 1000,
    DEFENSE_GAIN_VALUE: +50,
    DEFENSE_GAIN_VALUE_FOR_CAPITAL: +100,
    ATTACK_GAIN_VALUE: +100,
    ATTACK_GAIN_VALUE_FOR_CAPITAL: +50,
    MAX_ATTACKS_ALLOWED: 3, //maybe 3? maybe same as team size?
    TIMEOUT_ON_ATTACK: 30 * 1000, //formerly 1 minute
    TIMEOUT_ON_ATTACK_TEXT: "30 seconds",
    TIMEOUT_ON_DEFENSE: 10 * 60 * 1000,
    TIMEOUT_ON_DEFENSE_TEXT: "ten minutes",
    TIMEOUT_ON_DEFENSE_GAIN_VALUE: +50,
    TIMEOUT_ON_DEFENSE_GAIN_VALUE_FOR_CAPITAL: +0,
    SPAM_SUBMIT_PENALTY_LENGTH: 30 * 1000, //how long spam is penalized for
    CAPITAL_PLUNDER_VALUE: 500,
    ACCURACY_FUNCTION: (attempt, solution) => {
        //integers must be exact
        if (Number.isInteger(solution)) return attempt == solution
        //non-integers must be accurate to 3sf
        return (attempt == solution) || (+attempt.toPrecision(3) == solution)
    },
    CAPITAL_NAMING_FUNCTION: (capitalName, kingdomName) => {
        return capitalName.toUpperCase()
        // return `${capitalName}\n${kingdomName}`
    },
    CAPITAL_NAMING_UNDO_FUNCTION: (capitalName) => {
        return capitalName[0] + capitalName.slice(1).toLowerCase()
        // return capitalName.split("\n")[0]
    },


    //technical
    PICTURE_PATH: "conquest/pictures/",
    PICTURE_EXTENSION: ".png",
    SHOW_QUESTION_ID: true,
    QUESTION_PATH: "conquest/questions/",
    MAPSTER_IMAGE_QUALITY_CLIENT: 2,
    MAPSTER_IMAGE_QUALITY_SERVER: 1,


    //idle prevention
    IDLE_SYSTEM_USED: true,
    IDLE_BAN_DURATION_BY_OFFENCE_COUNT:
        [15 * 1000, 30 * 1000, 60 * 1000, 120 * 1000],
    IDLE_NO_BAN_BUT_WARNING_INSTEAD: false,
    IDLE_NOTIFY_SERVER: true,


    //Blake
    PICTURE_BACKGROUND_DIMENSIONS: [1560, 840],
    PICTURE_BACKGROUND_SCALEFACTOR: 1,
    PICTURE_BACKGROUND_CENTER: {
        "x": 785,
        "y": 460
    },
    PROVINCE_NAMES:
        ["Alderreach", "Ashmere", "Briarfen", "Brindle", "Caelmoor", "Howder", "Corwyn", "Oakrest", "Dunhollow", "Warrel", "Emberfall", "Fairharbor", "Frostmere", "Glenward", "Goldmarsh", "Haven", "Greenholt", "Highvale", "Ironmere", "Juniper", "Kestrel", "Kingshade", "Larkspur", "Foxhollow", "Sunreach", "Northpass", "Dawnmere", "Palehaven", "Whitebarrow", "Quartz", "Rainmere", "Redfield", "Rimeford", "Riverwake", "Rosefen", "Sablemoor", "Seabrook", "Silverden", "Southwatch", "Stonemere", "Wolfden", "Thornfield", "Timberrun", "Umberfall", "Valecrest", "Haller", "Baden", "Wildmere", "Windrest", "Goldenbay", "Yarrow", "Mistwood", "Blackharbor", "Zawfen", "Dragonmere", "Eastcliff", "Lowfen", "Hartmoor", "Zephyr", "Starfen"],
    PROVINCE_CAPITAL_IDS:
        null,
    PROVINCE_CONNECTIONS:
        [[0, 2, 12, 8], [1, 5, 11, 10], [2, 0, 12, 13], [3, 16, 6, 8], [4, 10, 14, 9], [5, 1, 15, 11], [6, 3, 16, 18], [7, 9, 19, 18], [8, 0, 3, 22, 17, 16], [9, 4, 7, 14, 19, 21], [10, 1, 4, 20, 23, 14], [11, 1, 5, 15, 20], [12, 0, 2, 13, 17], [13, 2, 12, 25, 45], [14, 4, 9, 10, 23, 21], [15, 5, 11, 27, 51], [16, 3, 6, 8, 24, 18, 22], [17, 8, 12, 25, 22], [18, 6, 7, 16, 24, 26, 19], [19, 7, 9, 18, 21, 26], [20, 10, 11, 27, 23, 30], [21, 9, 14, 19, 28, 26, 23, 34], [22, 8, 16, 17, 25, 32, 29, 24], [23, 10, 14, 20, 21, 28, 30], [24, 16, 18, 22, 35, 31, 26, 29], [25, 13, 17, 22, 33, 32], [26, 18, 19, 21, 24, 34, 31], [27, 15, 20, 36, 30], [28, 21, 23, 37, 30, 34], [29, 22, 24, 35, 40, 32], [30, 20, 23, 27, 28, 36, 42, 37], [31, 24, 26, 35, 39, 34, 41], [32, 22, 25, 29, 40, 38, 33], [33, 25, 32, 38], [34, 21, 26, 28, 31, 37, 43, 39], [35, 24, 29, 31, 41, 40], [36, 27, 30, 51, 42], [37, 28, 30, 34, 43, 42, 47], [38, 32, 33, 40, 46, 44], [39, 31, 34, 43, 50, 41], [40, 29, 32, 35, 38, 49, 41, 46], [41, 31, 35, 39, 40, 52, 49, 50], [42, 30, 36, 37, 47, 53], [43, 34, 37, 39, 47, 55, 50], [44, 38, 48, 45, 54], [45, 13, 44, 54], [46, 38, 40, 49, 48], [47, 37, 42, 43, 58, 55], [48, 44, 46, 54, 57], [49, 40, 41, 46, 52, 57], [50, 39, 41, 43, 55, 52], [51, 15, 36, 56, 53], [52, 41, 49, 50], [53, 42, 51, 59, 58, 56], [54, 44, 45, 48, 57], [55, 43, 47, 50, 58], [56, 51, 53, 59], [57, 48, 49, 54], [58, 47, 53, 55, 59], [59, 53, 56, 58]],
    PROVINCE_POSITIONS:
        [[1293, 124], [169, 109], [1443, 120], [993, 198], [459, 211], [79, 132], [883, 219], [683, 234], [1104, 245], [577, 241], [357, 271], [167, 202], [1348, 218], [1473, 239], [484, 302], [81, 247], [973, 308], [1197, 314], [808, 308], [665, 313], [288, 341], [572, 367], [1061, 380], [424, 382], [889, 390], [1198, 409], [693, 413], [258, 434], [487, 468], [987, 470], [362, 500], [758, 495], [1092, 498], [1235, 495], [627, 491], [886, 497], [258, 546], [500, 555], [1168, 577], [712, 579], [1013, 575], [844, 595], [404, 597], [590, 620], [1391, 660], [1480, 694], [1118, 661], [474, 672], [1298, 728], [970, 670], [712, 682], [135, 706], [849, 690], [273, 737], [1428, 778], [588, 720], [104, 782], [1245, 806], [370, 805], [219, 838]],
    PROVINCE_OWNERSHIP:
        null,
    PROVINCE_BUTTONS_TRANSPARENT:
        true,
    PROVINCE_SHOW_CONNECTIONS:
        false

})


//#region GRAPHICS.
var GRAPHICS = ({
    ATTACK_BEFORE_RESPONSE_COLOR: "red",
    ATTACK_TEAM_COLOR_FUNCTION: color => "blue",//x => x,
    POPUP_ATTACK_SUCCESS: "bigBlue",
    POPUP_ATTACK_FAIL: "bigBlue",
    POPUP_DEFEND_SUCCESS: "bigBlue",
    POPUP_DEFEND_FAIL: "bigBlue",
    POPUP_SERVER_RESPONSE: "bigYellow",
    POPUP_DEFENSE_WARNING: "bigRed",
    POPUP_PATIENCE: "smallPink",
    POPUP_START_DEFENSE: "bigBlue",
    POPUP_BATTLE_START: "bigBlue",
    POPUP_ERROR: "sideError",
    TERRITORY_SIZE_BASE_WIDTH: 100,//140,
    TERRITORY_SIZE_BASE_HEIGHT: 60,//80,
    TERRITORY_SIZE_CAPITAL_FACTOR: 1,//its the hitbox only anyways
    PROVINCE_FONTSIZE: 24,
    CONNECTION_LINE_WIDTH: 4,
    SNIPPET_WIDTH: 180,
    SNIPPET_FONTSIZE: 28,
    QUESTION_FONTSIZE: 52,
    BORDER_COLOR: "linen",
    SIDE_SCORE_PANEL_WIDTH: 140, //or null
    RIGHT: 360,
    LEFT: 10,
    TOP: 40,
    BOT: 200,


})
//#region MASTER.
var MASTER = {
    ALLOW_SCREENSHOTS: true,
    ALLOW_PASTING: true,
    AUTOSAVE_INTERVAL_SECONDS: 59,
    SCREENSHOT_INTERVAL_SECONDS: 19
}