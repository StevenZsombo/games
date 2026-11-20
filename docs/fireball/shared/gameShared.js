class GameShared extends GameCore {





}


class Player {
    /**@static @type {Player[]} */
    static ALL = []
    static _nextID = 1
    /**@param {Person} person  */
    constructor(person) {
        this.person = person
        this.nameID = person.nameID
        this.id = Player._nextID++
        person.player = this
        this.stampHP()

        const m = this.machine = new SimpleStateMachine()
        this.s = {
            spectating: m.createState(),
            targeting: m.createState(),
            downed: m.createState(),
            figting: m.createState(),
        }
        this.s.spectating.on_enter.push(() => {
            this.canPullFromGrimoire = false
            this.targetable = false
            this.ticking = false
        })
        this.s.figting.on_enter.push(() => {
            this.targetable = true
            this.canPullFromGrimoire = true
            this.ticking = true
        })
        this.s.targeting.on_enter.push(() => {
            this.ticking = false
            this.targetingTimeLeft = RULES.TARGETING_WINDOW_IMMUNITY_SECONDS * 1000
        })
        this.s.targeting.on_leave.push(() => {
            this.wielding = null
            this.targetingTimeLeft = 0
        })
        this.s.downed.on_enter.push(() => {
            this.downedTimeLeft = RULES.REVITALIZE_TIMEOUT_SECONDS * 1000
            this.hp = 0
            this.stampHP()
            this.targetable = false
            this.ticking = false
            this.canPullFromGrimoire = false
            this.actives.forEach(x => x.unbind())
            this.passives.forEach(x => x.unbind())
            this.actives.length = 0
            this.passives.length = 0
        })
        this.s.downed.on_leave.push(() => {
            this.downedTimeLeft = 0
            this.hp = RULES.REVITALIZE_HP
            this.stampHP()
            this.canPullFromGrimoire = true
        })
        m.switch(this.s.spectating)
    }
    targetable = true
    downedTimeLeft = 0
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
    /**@type {[number,number][]} - [id,tier or -1 for failure]*/
    accolades = []
    hp = RULES.START_HP
    hpLog = []
    canPullFromGrimoire = true
    totalKnockedDown = 0
    totalDamageDealt = 0
    totalDamageTaken = 0
    totalHeal = 0
    totalUpgrades = 0

    static byName(findStr) {
        return Player.ALL.find(x => x.person.name.toLowerCase().startsWith(findStr.toLowerCase()))
    }

    stampHP() {
        this.hpLog.push([Date.now(), this.hp])
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
    bucket = 0 //by default
    solution = 8774 //by default.
    img = "blankByDefault"
    static FILL_GRIMOIRE(arr) {
        arr.forEach(({ img, solution, bucket }) => {
            const spell = new Spell()
            spell.id = Spell.GRIMOIRE.length // start with 0
            Spell.GRIMOIRE.push(spell)
            spell.solution = solution
            spell.bucket = bucket ?? 0
            //client won't receive? shouldn't? whatever. anticheat will take care of it!
            spell.img = img
            // spell.isInGrimoire = true //initialzied this way anyways
        })
    }
    unbind() {
        this.isActive = false
        this.isBeingSolvedBy = null

    }
}

//why not lol
Spell.FILL_GRIMOIRE(
    [
        { img: "circletangents", solution: 29, bucket: 1 },
        { img: "improperintegral", solution: 0.667, bucket: 1 },
        { img: "seqeasy", solution: 1380, bucket: 1 },
        { img: "trigdiff", solution: 0.469, bucket: 1 },
        { img: "triggraph", solution: 528, bucket: 1 },
        { img: "trighard", solution: 170, bucket: 1 },
        { img: "trignormal", solution: -6.4, bucket: 1 },
        { img: "trigprod", solution: 140.8, bucket: 1 },
        { img: "trigquad", solution: 1.44, bucket: 1 },
        { img: "trigsimpconst", solution: -32, bucket: 1 },
        { img: "trigsolve", solution: -75, bucket: 1 },
        { img: "trigsolvesec", solution: 98.9, bucket: 1 },
    ]
    //[[1, 5.83], [2, 8.5], [3, 2.5], [4, 17.5], [5, 6.5], [6, -0.5], [7, 2.5], [8, 1.67], [9, 2.5], [10, 20.3], [11, 1.6], [12, 11.5], [13, 6.16], [14, 7.4], [15, 7.5],
    // [16, 11.4], [17, -0.5], [18, 4.1], [19, 2.63], [20, 6.86], [21, 8.33], [22, 2.39], [23, 4.83], [24, 0.414], [25, 2.47]
    //]
)

