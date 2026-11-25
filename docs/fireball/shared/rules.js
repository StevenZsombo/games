var RULES = {
    STUDENTS: "Chloe Catherine Roby Max Jayden Paco Steven".split(" "),
    START_HP: 100,
    REVITALIZE_HP: 70, //can be oneshot by IX and X for the funnies (too mean-spirited?)
    REVITALIZE_TIMEOUT_SECONDS: 12, //short enough not to be punitive
    TARGETING_WINDOW_IMMUNITY_SECONDS: 30,
    FIZZLE_AUTO_RETURN_WITHOUT_SERVER: false, //let teacher handle it!
    FIZZLE_AUTO_RETURN_WITHOUT_SERVER_TIER_FUNCTION:
        (_) => 0, //for sake of simplicity?
    CLICK_COUNT_TO_ATTACK: 3,
    MAX_HP: 200,
    START_TIER: 0, //beware of internal discrepancy: tiers I-X are actually 0-9
    MAX_TIER: 9, //for 10 total. no progress afterwards
    TIER_STRINGS: "I II III IV V VI VII VIII IX X".split(" "),
    DAMAGE_FROM_TIER: tier => 30 + tier * 5, //for 30 to 75
    TIME_FROM_TIER: tier =>
        60 * 1000 * (10 - tier), //for 10 to 1
    // 60 * (50) * (10 - tier), //for testing
    HEAL_FROM_NUMBER_OF_TIERS_UPGRADED_FUNCTION:
        (numberOfTiersUpgraded) => //10,20,30. final tier only 10?
            numberOfTiersUpgraded <= 1 ? 10 :
                numberOfTiersUpgraded == 2 ? 20 : 30,
    MIN_TIERS_UPGRADED_AT_ONCE: 1, //unless already max tier!
    MAX_TIERS_UPGRADED_AT_ONCE: 3,
    HP_GAIN_WHEN_PULLING_FROM_GRIMOIRE: 10,
    ACCURACY_FUNCTION: (attempt, solution) => { // same as spire/conquest!
        //integers must be exact
        if (Number.isInteger(solution)) return attempt == solution
        //non-integers must be accurate to 3sf
        return (attempt == solution) || (+attempt.toPrecision(3) == solution)
    },

    MAX_ACTIVES: 2,
    MAX_PASSIVES: 2,

    ALLOW_PULLING_FROM_GRIMOIRE_WHENEVER_EMPTY: true,
    ALLOW_PULLING_FROM_GRIMOIRE_AFTER_ANY_SOLVE: true,
    ALLOW_PULLING_FROM_GRIMOIRE_AFTER_ANY_FIZZLE: true,


    PICTURES_FOLDER_PATH: "./../pictures/", //finnicky
    SPELL_NAMES:
        `BOLT SPARK NOVA SHEAR FROST GUST WARP TEAR ZAP CHILL VEIL CRUSH STONE PULSE SEAR STING JAB CARVE DART DAZE STUN DOOM RIP HEX`.split(" "),
    //no shield decay
    // CARD_ROWS: 3, //is now dynamic, this was stupid to begin with
    CARD_COLUMNS: 3,

    SHOW_LAST_BC_TIME: true,

    WIZARDS_ARE_DRAGGABLE: true,
    SHOW_TRAIL: true,
    ALLOW_TURNING_OFF_TRAIL: true,
    SETTINGS_SHOWN: true,



}

var MASTER = {
    BROADCAST_INTERVAL: 1000,
    SESSION_ID_CHECK: true,
    ALLOW_PULLING_ON_START: true,
    LOCALSTORAGE_KEY: "fireballSaves",
    LOCALSTORAGE_KEY_MINIMAL: "fireballMinimal",
    HIDE_SPECTATORS: false,
    AUTO_JOIN_INSTEAD_OF_SPECTATE: true,
    AUTOSAVE_INTERVAL_FULL: 0,
    AUTOSAVE_INTERVAL_MINIMAL: 55 * 1000,
}

var GRAPHICS = {
    TOP: 50,
    LEFT: 50,
    RIGHT: 50,
    BOTTOM: 450,
    GRIMOIREHEIGHT: 250,
    GRIMOIREPADDINGBOTTOM: 50,
    CARD_FONTSIZE: 32,
    FULLVIEWER_PADDING: 15,
    FULLVIEWER_COLOR: "black", //for debugging
    BENEATH_FULLVIEWER_SPACE: 150,
    BENEATH_FULLVIEWER_PADDING: 20,
    CALCULA_RIGHT: 10,
    CALCULA_BOTTOM: 10,
    CALCULA_SCALEFACTOR: 8,
    HIGHLIGHT_SELF_CARD: false,
    INSIST_ON_FULLSCREEN_COUNT: 0, //suggest 5
    SPELL_BUTTON_WIDTH: 200,
    SPELL_BUTTON_HEIGHT: 400,
    SPELL_BUTTON_ROMAN_FONTSIZE: 40,
    SPELL_BUTTON_ROMAN_FONTSIZE_PASSIVE: 20,
    SPELL_BUTTON_RADIUS: 60,
    // SPELL_BUTTON_TIMER_FONTSIZE: 36,
    WIZARD_WIDTH: 256,
    WIZARD_HEIGHT: 256,
    SPELL_SLOT_LOCATIONS: [[-200, -50], [200, -50]],
    SNAP_EPSILON: 3,
    WIZARD_NAME_FONTSIZE: 48,
    CRAWL_COEFFICIENT: 0.0025,
    SHOW_FPS: true,
    ANIM_FADE_TIME: 650,
    PASSIVE_SCALE_FACTOR: .5,
    PASSIVE_BENEATH_PADDING: 20,
    GRIM_PIC_WIDHT: 180,
    GRIM_PIC_HEIGHT: 280,
    GRIM_PIC_FONTSIZE: 32,
    HELPER_HEIGHT: 50,
}
