//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: false,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "auto", //options: "auto", "smooth", "crisp-edges", "pixelated"
    //BROKEN
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    //BROKEN
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_first_run_blocking: null,
    on_first_run_async: null,
    //async function. overrides on_first_run_blocking
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: true,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}
//#endregion



const listener = new Listener()
chat = listener.chat
let disconnectedIndicator = null
chat.on_disconnect = () => disconnectedIndicator ??= GameEffects.popup("LOST CONNECTION...", { floatTime: Infinity, posFrac: [.5, .2], moreButtonSettings: { color: "red" } })
chat.on_join = () => { disconnectedIndicator?.close(); disconnectedIndicator = null }
Chat.defaultWeeInterval = 250
Chat.defaultWeeRetries = 5
Chat.defaultSpamRetries = 1000

const ob = new Observatory()
const em = new EventManager()
const EM = {}
const bpop = str => GameEffects.popup(str, GameEffects.popupPRESETS.sideError)
const gpop = str => GameEffects.popup(str, GameEffects.popupPRESETS.leftGreen)
const bigbadpop = str => GameEffects.popup(str, GameEffects.popupPRESETS.bigRed)
const sessionID = MM.randomID() + MM.randomID()

//array of objects
const eventLog = []


class Person extends Participant {
    initialize() {

    }

    /**@type {?Player} */
    player = null

    kick() {
        const i = Player.ALL.indexOf(this.player)
        if (i != -1) Player.ALL.splice(i, 1)
        this.player.targetable = false
        this.player = null
    }

}

class Game extends GameShared {
    //#region initialize_more
    initialize_more() { }
    async initialize_async() {

        await chat.asapPromise()
        chat.eggs("enter", (_, person) => {
            if (!Player.ALL.find(x => x.person === person)) {
                Player.ALL.push(new Player(person))
            }
            return {
                RULES,
                AVAILABLE_NAMES:
                    RULES.STUDENTS.filter(k => !Player.ALL.find(x => x.person.name == k))
            }
        })

        chat.eggs("attempt", ([id, guess], person) => {
            this.attempt(Spell.GRIMOIRE[id], person.player, guess)
        })

        chat.eggs("pull", (_, person) => {
            if (!this.allowPullingFromGrimoire) return
            if (
                person.player.canPullFromGrimoire
                ||
                (RULES.ALLOW_PULLING_FROM_GRIMOIRE_WHENEVER_EMPTY && person.player.actives.length == 0 && person.player.passives.length == 0)
            ) {
                this.pullFromGrimoire(person.player)
                person.player.canPullFromGrimoire = false
            }
        })


        this.allowPullingFromGrimoire = true
        this.tickSpellSecondsInterval = setInterval(
            () => this.tickSpellSeconds(1000),
            1000
        )
        this.tickBroadcastInterval = setInterval(
            () => this.sendBC(),
            MASTER.BROADCAST_INTERVAL
        )




    }
    //#endregion



    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more

    update_more(dt) {
    }

    //#endregion
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region draw_more

    draw_more(screen) {
    }
    //#endregion
    ///end draw_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                            ^^^^DRAW^^^^                                                      ///
    ///                                                                                                              ///
    ///                                              NEXT_LOOP                                                       ///
    ///start next_loop_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region next_loop_more
    next_loop_more() {
    }//#endregion
    ///end next_loop_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                          ^^^^NEXT_LOOP^^^^                                                   ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**@param {Player} player  */
    pullFromGrimoire(player) {
        const availableSpells = Spell.GRIMOIRE.filter(x => x.isInGrimoire)
            .filter(x => !x.ownerHistory.includes(player))
        if (!availableSpells.length) {
            bigbadpop(`${player.person.name} cannot pull any spells from the Grimoire.`)
            player.person.spam("warningpop", "There are no spell left in the Grimoire.")
        }
        const chosenSpell = availableSpells[MM.randomIndex(availableSpells.length)]
        chosenSpell.isInGrimoire = false
        this.assignSpellToPlayer(chosenSpell, player)

        eventLog.push({
            str: `${player.person.name} pulled a Tier ${RULES.TIER_STRINGS[chosenSpell.tier]} spell from the Grimoire.`,
            type: "pullFromGrimoire",
            player,
            spell: chosenSpell
        })

    }

    /**@param {Player} player @param {Spell} spell  */
    assignSpellToPlayer(spell, player) {
        spell.timeLeft = RULES.TIME_FROM_TIER(spell.tier)
        player.actives.push(spell)
        spell.isActive = true
        spell.isBeingSolvedBy = player
        spell.seenHistory.push(player)
        player.seen.push(spell)

    }

    /**@param {Spell} spell @param {Player} player */
    spellFizzlesOn(spell, player) {
        spell.isActive = false
        spell.isBeingSolvedBy = null
        player.actives = player.actives.filter(x => x !== spell)
        const dmg = RULES.DAMAGE_FROM_TIER(spell.tier)
        player.hp -= dmg
        if (player.hp <= 0) return this.playerDowned(player)
        const str = `${player.person.name} took ${dmg} from the tier ${RULES.TIER_STRINGS[spell.tier]} spell`
            + (spell.ownerHistory.at(-1) ?
                ` of ${spell.ownerHistory.at(-1).person.name}`
                : ` from the Grimoire`)
            + `.`
        chat.spam("globalpop", str)

        eventLog.push({
            str: `${player.person.name} took ${dmg} from the tier ${RULES.TIER_STRINGS[spell.tier]} spell`
                + (spell.ownerHistory.at(-1) ?
                    ` of ${spell.ownerHistory.at(-1).person.name}`
                    : ` from the Grimoire`)
                + `.`,
            attacker: spell.ownerHistory.at(-1),
            type: "spellFizzlesOn",
            victim: player,
            spell: spell,
            dmg: dmg,
        })
        setTimeout(() => this.advanceQueue(player), 1000)
    }

    /**@param {Player} player */
    playerDowned(player) {
        player.targetable = false
        player.actives.length = 0
        player.passives.length = 0
        player.hp = 0
        player.canPullFromGrimoire = false
        player.untargetableTimeLeft = RULES.REVITALIZE_TIMEOUT_SECONDS * 1000
        eventLog.push({
            str: `${player.person.name} downed for ${RULES.REVITALIZE_TIMEOUT_SECONDS} seconds.`,
            player: player
        })

    }

    /**@param {Spell} spell @param {Player} player */
    spellUpgradedByPlayer(spell, player) {
        if (!spell.isActive) return //kind of dodgy, but it will do
        spell.isActive = false
        spell.isBeingSolvedBy = null
        const timeLeftMinutes = spell.timeLeft / 60 / 1000
        const tiersUpgraded =
            MM.clamp(Math.floor(timeLeftMinutes),
                1, RULES.MAX_TIERS_UPGRADED_AT_ONCE)
        spell.tier += tiersUpgraded
        if (spell.tier > RULES.MAX_TIER) spell.tier = RULES.MAX_TIER
        const heal = RULES.HEAL_FROM_NUMBER_OF_TIERS_UPGRADED_FUNCTION(tiersUpgraded)
        player.hp += heal
        if (player.hp > RULES.MAX_HP) player.hp = RULES.MAX_HP
        const ind = player.actives.indexOf(spell)
        if (ind != -1) { player.actives.splice(ind, 1) }
        else { console.error("BADNESS upgraded spell isn't active", { player, spell }) }
        player.owned.push(spell)
        player.accolades.push([spell, spell.tier])
        player.person.spam("localpop", `You upgraded the spell by ${tiersUpgraded} tiers!\nYou healed ${heal} hp, and can now target someone to possibly deal ${RULES.DAMAGE_FROM_TIER(spell.tier)} damage!`)
        const str = `${player.person.name} upgraded a spell to Tier ${RULES.TIER_STRINGS[spell.tier]}!`
        chat.targetSpam(
            Player.ALL.filter(x => x != player),
            "globalpop", str
        )
        eventLog.push({
            str,
            player,
            type: "spellUpgradedByPlayer",
            heal
        })

        player.person.wee("targeting")
            .then(_ => gpop(`${player.person.name} began targeting.`))
            .catch(_ => bpop(`BADNESS: ${player.person.name} cannot target!`))

        player.targetingTimeLeft = RULES.TARGETING_WINDOW_IMMUNITY_SECONDS * 1000
        player.wielding = spell


    }

    tickSpellSeconds(dt = 1000) {  //called every second?
        for (const spell of Spell.GRIMOIRE) {
            if (!spell.isActive) continue
            if (!spell.isBeingSolvedBy) continue
            if (spell.isBeingSolvedBy.targetingTimeLeft > 0) continue
            spell.timeLeft -= dt
            if (spell.timeLeft < 0) this.spellFizzlesOn(spell, spell.seenHistory.at(-1))
        }
        for (const pla of Player.ALL) {
            if (pla.targetingTimeLeft) {
                pla.targetingTimeLeft -= dt
                if (pla.targetingTimeLeft < 0) {
                    //let it fizzle lol!
                    eventLog.push({
                        type: "failedTargeting",
                        player: pla,
                        spell: pla.wielding,
                        str: `${pla.person.name} failed targeting their newly upgraded spell, so it blew up in their own face.`
                    })
                    const spell = pla.wielding
                    pla.targetingTimeLeft = 0
                    pla.wielding = null
                    this.spellFizzlesOn(spell, pla)

                }
            }
            if (pla.untargetableTimeLeft) {
                pla.untargetableTimeLeft -= dt
                if (pla.untargetableTimeLeft < 0) {
                    pla.untargetableTimeLeft = 0
                    pla.targetable = true
                    pla.canPullFromGrimoire = true
                    pla.hp = RULES.REVITALIZE_HP
                    eventLog.push({
                        str: `${pla.person.name} is back in the game with ${pla.hp} HP!`,
                        type: "revitalize",
                        player: pla
                    })

                }
            }
        }
    }
    /**@param {Spell} spell @param {Player} player  @param {number} guess  */
    attempt(spell, player, guess) {
        if (!player) return bpop(`BIG BADNESS: player ${player.person.name} made an attempt without being initialized`)
        if (RULES.ACCURACY_FUNCTION(guess, spell.solution)) {
            this.spellUpgradedByPlayer(spell, player)
        } else {
            player.person.spam("localpop", `Your answer of ${guess} is incorrect.`)
        }
    }
    /**@param {Player} attacker  @param {Player} defender*/
    target(attacker, defender) {
        const spell = attacker.wielding
        if (!spell) return bpop(`BADNESS: target command from ${attacker.person.name} but not wielding any spell.`)
        if (!defender.targetable) return (
            attacker.person.spam("localpop", `Selected player cannot be attacked right now.`),
            false
        )
        if (defender.seen.includes(spell)) return (
            attacker.person.spam("localpop", `Selected player already seen that spell.`),
            false
        )
        if (defender.actives.length == RULES.MAX_ACTIVES) {
            if (defender.passives.length == RULES.MAX_PASSIVES
                &&
                !Player.ALL
                    .filter(x => x != attacker)
                    .filter(x => x.targetable)
                    .every(x =>
                        x.actives.length == RULES.MAX_ACTIVES && x.passives.length == RULES.MAX_PASSIVES
                    )
            ) return (
                attacker.person.spam("localpop", `Selected player is not a valid target. They already have too many passive spells.`),
                false
            )
            //passive slot is easy to fill
            defender.passives.push(spell)
            spell.timeLeft = spell.timeLeft = RULES.TIME_FROM_TIER(spell.tier)
        } else this.assignSpellToPlayer(spell, defender)
        attacker.wielding = null
        attacker.targetingTimeLeft = 0
        attacker.person.spam("localpop", `Succesfully attacked ${defender.person.name}.\nThey have ${RULES.TIME_FROM_TIER(spell.tier) / 60 / 1000} minutes to solve, or else they take ${RULES.DAMAGE_FROM_TIER(spell.tier)} damage.`)
        eventLog.push({
            str: `${attacker.person.name} attacks ${defender.person.name} with a Tier ${RULES.TIER_STRINGS[spell.tier]} spell.`,
            attacker,
            defender,
            spell
        })

        setTimeout(() => this.advanceQueue(player), 1000)
        return true //successful attack!

    }
    /**@param {Player} player */
    advanceQueue(player) {
        if (player.actives.length == RULES.MAX_ACTIVES) return
        if (player.passives.length == 0) return
        const firstPassive = player.passives.shift()
        this.assignSpellToPlayer(firstPassive, player)
    }


    sendBC() {
        // const playersData = Player.ALL.map(x => x.person.name)
        const playersData = Player.ALL.map(p => {
            return {
                n: p.person.name,
                h: p.hp,
                i: p.person.nameID,
                a: p.actives.map(x => [x.id, x.timeLeft]),
                p: p.passives.map(x => [x.id, x.timeLeft]),
                t: p.targetable,
                d: p.untargetableTimeLeft,
                f: p.targetingTimeLeft,
            }
        })

        chat.spam("bc", playersData)
    }


} //this is the last closing brace for class Game




//#region dev options
/// dev options dev.dev.dev.
const dev = {
}/// end of dev

