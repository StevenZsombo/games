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
    untargetableTimeLeft = 0
    targetingTimeLeft = 0 //determines state!
    /**@type {Spell} */
    wielding = null
    /**@type {Spell[]} */
    actives = []
    /**@type {Spell[]} */
    passives = []
    //contains objects
    /**@type {Spell[]} */
    owned = []
    /**@type {Spell[]} */
    seen = []
    /**@type {[Spell,number][]} */
    accolades = []
    hp = RULES.START_HP
    canPullFromGrimoire = true


    static byName(findStr) {
        return Player.ALL.find(x => x.person.name.toLowerCase().startsWith(findStr.toLowerCase()))
    }
}

class Spell {
    /**@static @type {Spell[]} */
    static GRIMOIRE = []
    tier = RULES.START_TIER
    /**@type {Player[]} */
    ownerHistory = []
    /**@type {Player[]} */
    seenHistory = []
    /**@type {?Player} */
    isBeingSolvedBy = null
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
            spell.solution = solution
            //client won't receive? shouldn't? whatever. anticheat will take care of it!
            spell.img = img
            // spell.isInGrimoire = true //initialzied this way anyways
        })

    }
}

//why not lol
Spell.FILL_GRIMOIRE(
    [
        [1, 5.83], [2, 8.5], [3, 2.5], [4, 17.5], [5, 6.5], [6, -0.5], [7, 2.5], [8, 1.67], [9, 2.5], [10, 20.3], [11, 1.6], [12, 11.5], [13, 6.16], [14, 7.4], [15, 7.5], [16, 11.4], [17, -0.5], [18, 4.1], [19, 2.63], [20, 6.86], [21, 8.33], [22, 2.39], [23, 4.83], [24, 0.414], [25, 2.47]
    ]
)

