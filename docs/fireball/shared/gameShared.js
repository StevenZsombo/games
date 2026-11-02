class GameShared extends GameCore {





}


class Player {
    /**@param {Person} person  */
    constructor(person) {
        this.person = person
        this.id = person.nameID
        person.player = this
    }
    /**@static @type {Player[]} */
    static ALL = []
    targetable = true
    actives = []
    passives = []
    //contains objects
    owned = []
    seen = []
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
    solution = 8774 //by default.
    img = "blankByDefault"
    static FILL_GRIMOIRE(imgSolArray) {
        imgSolArray.forEach(([img, solution]) => {
            const spell = new Spell()
            spell.id = Spell.GRIMOIRE.length // start with 0
            Spell.GRIMOIRE.push(spell)
            spell.solution = solution //client won't receive? shouldn't? whatever
            spell.img = img
        })

    }
}

