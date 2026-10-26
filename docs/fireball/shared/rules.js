var RULES = {
    STUDENTS: "Alice Bob Clark Dan Eve Frank".split(" "),
    START_HP: 100,
    REVIVE_HP: 70, //can be oneshot by IX and X for the funnies (too mean-spirited?)
    REVIVE_TIMEOUT_SECONDS: 30,
    TARGETING_IMMUNITY_WINDOW_SECONDS: 30,
    MAX_SHIELD: 100,
    START_TIER: 0,
    MAX_TIER: 9, //for 10. no progress afterwards
    TIER_STRINGS: "I II III IV V VI VII VIII IX X".split(" "),
    DAMAGE_PER_TIER: [30, 35, 40, 45, 50, 55, 60, 65, 70, 75],
    HEAL_PER_NUMBER_OF_TIERS_UPGRADED_FUNCTION:
        (numberOfTiersUpgraded) => //10,20,30
            numberOfTiersUpgraded <= 1 ? 10 :
                numberOfTiersUpgraded == 2 ? 20 : 30,
    MIN_TIERS_UPGRADED_AT_ONCE: 1,
    MAX_TIERS_UPGRADED_AT_ONCE: 3,
    ACCURACY_FUNCTION: (attempt, solution) => { // same as spire/conquest!
        //integers must be exact
        if (Number.isInteger(solution)) return attempt == solution
        //non-integers must be accurate to 3sf
        return (attempt == solution) || (+attempt.toPrecision(3) == solution)
    },

    //no shield decay




}