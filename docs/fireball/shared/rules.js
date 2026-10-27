var RULES = {
    STUDENTS: "Alice Bob Clark Dan Eve Frank".split(" "),
    START_HP: 100,
    REVIVE_HP: 70, //can be oneshot by IX and X for the funnies (too mean-spirited?)
    REVIVE_TIMEOUT_SECONDS: 20, //short enough not to be punitive
    TARGETING_WINDOW_IMMUNITY_SECONDS: 30,
    FIZZLE_AUTO_RETURN_WITHOUT_SERVER: false, //let teacher handle it!
    MAX_SHIELD: 100,
    START_TIER: 0, //beware of internal discrepancy: tiers I-X are actually 0-9
    MAX_TIER: 9, //for 10 total. no progress afterwards
    TIER_STRINGS: "I II III IV V VI VII VIII IX X".split(" "),
    DAMAGE_FROM_TIER: tier => 30 + tier * 5, //for 30 to 75
    TIME_FROM_TIER: tier => 60 * 1000 * (10 - tier),
    HEAL_FROM_NUMBER_OF_TIERS_UPGRADED_FUNCTION:
        (numberOfTiersUpgraded) => //10,20,30. final tier only 10?
            numberOfTiersUpgraded <= 1 ? 10 :
                numberOfTiersUpgraded == 2 ? 20 : 30,
    MIN_TIERS_UPGRADED_AT_ONCE: 1, //unless already max tier!
    MAX_TIERS_UPGRADED_AT_ONCE: 3,
    ACCURACY_FUNCTION: (attempt, solution) => { // same as spire/conquest!
        //integers must be exact
        if (Number.isInteger(solution)) return attempt == solution
        //non-integers must be accurate to 3sf
        return (attempt == solution) || (+attempt.toPrecision(3) == solution)
    },

    MAX_ACTIVES: 2,
    MAX_PASSIVES: 2,


    PICTURES_FOLDER_PATH: "./pictures/"

    //no shield decay




}