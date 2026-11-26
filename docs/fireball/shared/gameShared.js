var IMAGES = { grimpic: null, wizards: [], runes: [] }
class GameShared extends GameCore {


    async init_shared() {
        /*await Promise.all(
            Object.keys(IMAGES).map(async key =>
                IMAGES[key] = await Cropper.loadImagePromise(
                    RULES.PICTURES_FOLDER_PATH + key + ".png")
            ))*/
        const grab = str => Cropper.loadImagePromise(RULES.PICTURES_FOLDER_PATH + str + ".png")
        IMAGES.grimpic = await grab("grimpic")
        IMAGES.wizards = this.cropper.cropGrid(
            await grab("wizards12"), 1, 12).flat()
        IMAGES.runes = this.cropper.cropGrid(
            await grab("runes6x4"), 4, 6).flat()
        console.log("IMAGES", IMAGES)
        Spell.GRIMOIRE.forEach((x, i) => x.pic = IMAGES.runes[i])
        wDiv.addLine("IMAGES loaded!")

    }

    getBCdata() {
        const pd = Player.ALL.map(p => {
            return {
                n: p.person.name,
                h: p.hp,
                i: p.person.nameID,
                x: p.id, //pool id
                a: p.actives.map(x => x.id),
                p: p.passives.map(x => x.id),
                v: p.seen.map(x => x.id), //just all seen
                c: p.canPullFromGrimoire && this.allowPullingFromGrimoire && p.BACKUPcanPullFromGrimoire, //two redundancies to prevent false pulls or flooding the server
                s: p.getStateInfo(),
                w: p.picID,
            }
        })
        /**@type {[number,number,number,number[]]} */
        const sd = Spell.GRIMOIRE.map(s => {
            return [s.id, s.tier, s.timeLeft, s.placeHistory]
        })
        return { pd, sd }
    }



}


class Player {
    /**@static @type {Player[]} */
    static ALL = []
    static _nextID = 1
    /**@type {Map<string,Player>} */
    static poolBANK = new Map()
    static pool(id, on_creation = null) {
        const p = this.poolBANK.get(id)
        if (p) return p
        let found = this.ALL.find(x => x.id == id)
        if (!found) {
            const created = new Player()
            created.id = id
            this.poolBANK.set(id, created)
            on_creation?.(created)
            return created
        }
        this.poolBANK.set(id, found)
        return found
    }
    /**@param {Person} person  */
    constructor(person) {
        if (!chat.isServer) return this.makeGhost()
        this.person = person
        this.nameID = person.nameID
        this.id = Player._nextID++
        this.picID = 0 //must be set
        person.player = this
        this.stampHP()

        const m = this.machine = new SimpleStateMachine()
        this.s = {
            spectating: m.createState(),
            targeting: m.createState(),
            downed: m.createState(),
            fighting: m.createState(),
        }
        this.s.spectating.on_enter.push(() => {
            this.canPullFromGrimoire = false
            this.targetable = false
            this.ticking = false
        })
        this.s.fighting.on_enter.push(() => {
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
        if (MASTER.AUTO_JOIN_INSTEAD_OF_SPECTATE) {
            m.switch(this.s.fighting)
        }
    }
    makeGhost() {

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
    BACKUPcanPullFromGrimoire = true
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
    getStateID() { return this.machine.current.id }
    getStateInfo() {
        switch (this.machine.current.id) {
            case 0: //spectating
                return [0]
            case 1: //targeting
                return [1, this.targetingTimeLeft, this.wielding.id]
            case 2: //downed
                return [2, this.downedTimeLeft]
            case 3: //fighting
                return [3]
        }
    }
    sid = -1 //invalid at the start
    updateStateInfo(stateInfo) {
        const sid = this.sid = stateInfo[0]
        if (sid == 0) {//spectating
            this.targetable = false
            this.hp = 0
        } else if (sid == 1) {//targeting
            this.targetingTimeLeft = stateInfo[1]
            this.targetable = true
            this.wielding = Spell.GRIMOIRE[stateInfo[2]]
        } else if (sid == 2) {//downed
            this.targetable = false
            this.downedTimeLeft = stateInfo[1]
        } else if (sid == 3) {//fighting
            this.targetable = true
        }

    }
    createGraphics() {
        const button = this.button = new Button({
            width: GRAPHICS.WIZARD_WIDTH,
            height: GRAPHICS.WIZARD_HEIGHT,
            transparent: true,
            img: IMAGES.wizards[this.picID],
            tag: "wizardButton",
            // isBlocking: true
        })
        button.draw_more = (ctx) => {
            MM.drawText(ctx,
                `${this.name ?? this.nameID}\n${this.hp} HP`,
                {
                    ...button,
                    height:
                        -2.4 * GRAPHICS.WIZARD_NAME_FONTSIZE
                },
                {
                    fontSize: GRAPHICS.WIZARD_NAME_FONTSIZE,
                    color: "black"
                }
            )
        }
        if (RULES.WIZARDS_ARE_DRAGGABLE)
            Button.make_draggable(button)
        this.mall = new Malleable(button)
        this.mall.tag = "wizard"
        return this.mall
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
    /**@type {number[]} */ //start from -1 beacuse why not
    placeHistory = [-1]
    timeLeft = 10 * 60 * 1000
    isInGrimoire = true
    isActive = false
    id = -1 //invalid. of course.
    bucket = 0 //by default
    solution = 8774 //by default.
    img = "blankByDefault"
    pic = "iconRune"
    color = "black"
    transColor = "black"
    static FILL_GRIMOIRE(arr) {
        arr.forEach(({ img, solution, bucket }) => {
            const spell = new Spell()
            spell.id = Spell.GRIMOIRE.length // start with 0
            Spell.GRIMOIRE.push(spell)
            spell.solution = solution
            spell.bucket = bucket ?? 0
            //client won't receive? shouldn't? whatever. anticheat will take care of it!
            spell.img = img
            spell.pic = null //let init_shared take care of it
            spell.color = `hsl(${spell.id / arr.length * 360} 50% 50%)`
            spell.transColor = `hsl(${spell.id / arr.length * 360} 50% 50% / 0.75)`
            // spell.isInGrimoire = true //initialzied this way anyways
        })
    }
    unbind() {
        this.isActive = false
        this.isBeingSolvedBy = null
    }
    createGraphics() {
        this.isInActiveSize = true
        const button = this.button =
            Button.make_roundedRect(new Button(
                {
                    width: GRAPHICS.SPELL_BUTTON_WIDTH,
                    height: GRAPHICS.SPELL_BUTTON_HEIGHT,
                    img: this.pic,
                    color: this.color,
                    outline: 3,
                    outline_color: "black",
                    tag: "runeButton",
                }
            ))

        button.draw_more = (ctx) => {
            MM.drawText(ctx,
                `${RULES.SPELL_NAMES[this.id]} ${RULES.TIER_STRINGS[this.tier]}`
                + "\n"
                + MM.toMMSS(this.timeLeft),
                {
                    width: button.width, height: button.height * .5,
                    y: button.y + button.height * .5,
                    x: button.x
                }, {
                fontSize:
                    this.isInActiveSize ?
                        GRAPHICS.SPELL_BUTTON_ROMAN_FONTSIZE
                        : GRAPHICS.SPELL_BUTTON_ROMAN_FONTSIZE_PASSIVE,
                color: "black",
                font: "mySerif"
                // textAlign: "middle",
                // textBaseline: "center"
            }
            )
        }
        this.mall = new Malleable(button)
        this.mall.tag = "rune"
        return this.mall
    }
}

//why not lol
Spell.FILL_GRIMOIRE(
    [
        { "img": "vec1", "solution": -6, "bucket": 1 },
        { "img": "vec2", "solution": 2.67, "bucket": 1 },
        { "img": "vec3", "solution": 0.636, "bucket": 2 },
        { "img": "vec4", "solution": 80.5, "bucket": 1 },
        { "img": "vec5", "solution": 25, "bucket": 1 },
        { "img": "vec6", "solution": -5, "bucket": 1 },
        { "img": "vec7", "solution": 0.2, "bucket": 1 },
        { "img": "vec8", "solution": 11.2, "bucket": 1 },
        { "img": "vec9", "solution": 3.5, "bucket": 1 },
        { "img": "vec10", "solution": 3, "bucket": 2 },
        { "img": "vec11", "solution": 0.714, "bucket": 2 },
        { "img": "vec12", "solution": -14, "bucket": 2 },
        { "img": "vec13", "solution": 0.2, "bucket": 2 }
    ]
    /*
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
        */
    //[[1, 5.83], [2, 8.5], [3, 2.5], [4, 17.5], [5, 6.5], [6, -0.5], [7, 2.5], [8, 1.67], [9, 2.5], [10, 20.3], [11, 1.6], [12, 11.5], [13, 6.16], [14, 7.4], [15, 7.5],
    // [16, 11.4], [17, -0.5], [18, 4.1], [19, 2.63], [20, 6.86], [21, 8.33], [22, 2.39], [23, 4.83], [24, 0.414], [25, 2.47]
    //]
)

