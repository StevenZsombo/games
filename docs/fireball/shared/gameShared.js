class GameShared extends GameCore {





}


class Player {
    /**@param {Person} person  */
    constructor(person) {
        this.person = person
        this.id = person.nameID
    }
    /**@static @type {Player[]} */
    static ALL = []
    targetable = true
    actives = []
    passives = []
    //contains objects
    owned = []
    hp = RULES.START_HP
}

class Spell {
    /**@static @type {Spell[]} */
    static GRIMOIRE = []
    tier = RULES.START_TIER
    /**@type {Player[]} */
    ownerHistory = []
    /**@type {Player[]} */
    seenHistory = []
    timeLeft = 10 * 60 * 1000
    isInGrimoire = true
    isActive = false
    id = -1 //invalid. of course.
}

