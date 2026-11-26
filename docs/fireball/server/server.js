//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
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

/**@type {{str:str,time:number,type:str}[]} - and other details*/
const eventLog = []


class Person extends Participant {
    initialize() {

    }

    /**@type {?Player} */
    player = null

    kick() {
        this.wee("eval",
            "setTimeout(()=>{localStorage.clear();chat.silentReload();},100)"
        )
            .then(() => gpop("Kicked " + this.name))
            .catch(() => bpop("Failed to kick " + this.name))
            .finally(() => {
                const i = Player.ALL.indexOf(this.player)
                if (i != -1) Player.ALL.splice(i, 1)
                this.player.targetable = false
                this.player = null
                listener.persons.delete(this.nameID)
            })
    }

    rename(newName) {
        this.wee("eval", `chat.forceNameSilent("${newName}")`)
            .then(() => gpop("Renamed to " + this.name))
            .catch(() => bpop("Failed to rename " + this.name))
    }

}

class Game extends GameShared {
    //#region initialize_more
    initialize_more() {

    }
    initServerUI() {
        const logWindow = this.logWindow =
            Button.fromRectShallow(this.rect.copy.stretch(.8, .8))
        let startIndex = 0
        const totalRows = 25
        logWindow.dynamicText = () =>
            `(Displaying ${startIndex}-${Math.min(startIndex + totalRows, eventLog.length)}/${eventLog.length})\n` +
            eventLog.map(x => x.str).slice(startIndex, startIndex + totalRows).join("\n")
        logWindow.on_wheel = (delta) => {
            startIndex += (delta > 0 ? 1 : -1)
            startIndex = MM.clamp(startIndex, 0, eventLog.length - 2)
        }
        logWindow.color = "white"
        logWindow.outline = 3
        // this.add_drawable(logWindow, 3)
        logWindow.font_font = "myMonospace"
        logWindow.fontSize = 28
        logWindow.textSettings.textAlign = "left"
        logWindow.textSettings.textBaseline = "top"
        logWindow.leftat(this.rect.left)
        logWindow.centeratY(this.rect.centerY)
        // Button.make_stretchable(logWindow, { layer: 3 })
        Button.make_draggable(logWindow)


        const serverButton = this.serverButton = new Button({
            width: 200, height: 100, txt: "SERVER",
            y: 0, x: this.WIDTH - 200,
            isBlocking: true,
        })
        /**@param {Player} p */
        const playerDDM = p => {
            GameEffects.dropDownBetter(
                [
                    ["Rename", () => GameEffects.inputBoxFromRectPromise().then(
                        x => { if (x && x.length > 2) p.person.rename(x) }
                    )],
                    ["Kick", () => p.person.kick()],
                    ["eval", () => GameEffects.inputBoxFromRectPromise().then(
                        x => p.person.wee("eval", x)
                            .then(() => gpop("Eval sent to " + p.person.name))
                            .catch(() => bpop("Failed to send eval to " + p.person.name))
                    )
                    ]
                ]
            )
        }
        serverButton.on_release = () => {
            if (!Player.ALL.length) return
            const d = GameEffects.dropDownBetter(
                Player.ALL.map(x => [x.person.name, () => playerDDM(x)])
            )

        }
        this.add_drawable(serverButton, 6)


        const table = this.table = new Button({
            color: "white",
            width: this.WIDTH * .8,
            height: this.HEIGHT * .6,
            textSettings: { textAlign: "left", textBaseline: "top" },
            isBlocking: true,
            font_font: "myMonospace"
        })
        table.bottomat(this.rect.bottom); table.rightat(this.rect.right)
        table.dynamicText = () => MM.tableStr(
            Player.ALL.map(p => [
                p.person.name, p.person.nameID,
                p.id,
                p.picID,
                p.machine.current.id,
                p.person.isConnected ? "OK" : "DISCONNECTED",
                p.hp, p.canPullFromGrimoire,
                p.actives.length,
                p.passives.length,
                p.seen.length,
                p.totalDamageDealt,
                p.totalDamageTaken,
                p.totalHeal,
                p.totalUpgrades,
                p.totalKnockedDown,

            ]),
            "name nameID ID picID s conn hp pull? #act #pas #seen DEALT TAKEN HEAL UP KNOCK".split(" ")
        )
        // Button.make_stretchable(table, { layer: 5 })
        Button.make_draggable(table)
        // this.add_drawable(table, 5)

        const grimTable = this.grimTable = new Button({
            color: "white",
            width: this.WIDTH * .7,
            height: this.HEIGHT * .6,
            textSettings: { textAlign: "left", textBaseline: "top" },
            isBlocking: true,
            font_font: "myMonospace"
        })
        grimTable.dynamicText = () => MM.tableStr(
            Spell.GRIMOIRE.map(x => [
                x.id,
                RULES.SPELL_NAMES[x.id],
                x.isActive,
                x.seenHistory.map(x => x.person.name ?? "?").join(","),
                x.isBeingSolvedBy?.person?.name ?? "",
                x.isInGrimoire,
                RULES.TIER_STRINGS[x.tier],
                x.isActive ? MM.toMMSS(x.timeLeft) : ""
            ]),
            "id _ isActive seenBy isSolvedBy isInGrim Tier MMSS".split(" ")
        )
        grimTable.topleftat(70, 170)
        // Button.make_stretchable(grimTable, { layer: 5 })
        Button.make_draggable(grimTable)
        // this.add_drawable(grimTable, 5)
        this.tableMall = new Malleable(grimTable, table, logWindow)
        this.tableMall.components.forEach(x => {
            x.isBlocking = true
            x.on_click = () => {
                this.tableMall.components =
                    MM.putAsLast(x, this.tableMall.components)
            }
        })
        this.add_drawable(this.tableMall, 5)
        const grimButton = serverButton.copy
        grimButton.move(-grimButton.width, 0)
        grimButton.txt = "Grimoire"
        grimButton.on_release = () => GameEffects.dropDownBetter(
            // Spell.GRIMOIRE.map(x=>)
            [
                [
                    `allowPullingFromGrimoire = ${this.allowPullingFromGrimoire}`,
                    () => this.allowPullingFromGrimoire = !this.allowPullingFromGrimoire
                ],
                [
                    `masterPause = ${this.masterPause}`, () => this.masterPause = !this.masterPause
                ],
                /*
                ["Reset all inactive tiers", () => Spell.GRIMOIRE.forEach(x => {
                    if (!x.isActive) x.tier = 0
                })],
                ["Put all inactive back", () =>
                    Spell.GRIMOIRE.forEach(x => {
                        if (!x.isActive) x.isInGrimoire = true
                    })],
                */
                ["Spells/Players/Logs", () => GameEffects.dropDownBetter([
                    [grimTable.visible ? "Hide spells" : "Show spells", () => grimTable.toggleActive()],
                    [table.visible ? "Hide players" : "Show players", () => table.toggleActive()],
                    [logWindow.visible ? "Hide logs" : "Show logs", () => logWindow.toggleActive()],
                ])],
                ["advanceQueue ALL", () => Player.ALL.map(p => this.advanceQueue(p))],
                ["let pull all", () => Player.ALL.forEach(x => x.canPullFromGrimoire = true)],
                ["MASS EVAL", () => GameEffects.inputBoxFromRectPromise().then(
                    x => chat.spam("eval", x))],
                ["EXPORT all", () => this.exportALL()]
            ], { moreButtonSettings: { width: 500 } }
        )
        this.add_drawable(grimButton, 6)



        eventLog.push({
            str: "Game has been initialized.",
            type: "init",
            time: Date.now(),
        })

    }
    async initialize_async() {

        await chat.asapPromise()
        chat.spam("eval", "chat.silentReload()")
        chat.eggs("enter", (_, person) => {
            if (!Player.ALL.find(x => x.person === person)) {
                Player.ALL.push(new Player(person))
            }
            return {
                RULES,
                sessionID,
                AVAILABLE_NAMES:
                    RULES.STUDENTS.filter(k => !Player.ALL.find(x => x.person.name == k)),
            }
        })
        chat.eggs("isnamecool", val => Player.ALL.map(x => x.person.name).indexOf(val) == -1)
        chat.eggs("setmypic", (val, person) => person.player.picID = val)
        chat.eggs("whatsmyid", /**@param {Person} person */(_, person) => {
            return person.player.id
        })

        chat.eggs("attempt", ([id, guess], person) => {
            return this.attempt(Spell.GRIMOIRE[id], person.player, guess)
        })

        chat.eggs("pull", (_, person) => {
            if (!this.allowPullingFromGrimoire) return
            if (
                person.player.canPullFromGrimoire
            ) {
                this.pullFromGrimoire(person.player)
                person.player.canPullFromGrimoire = false
            }
        })

        chat.eggs("attack", (targetNameID, person) => {
            return this.target(
                person.player,
                Player.ALL.find(x => x.person.nameID == targetNameID)
            )
        })

        this.initServerUI()

        this.masterPause = false
        this.masterPauseBC = false

        this.allowPullingFromGrimoire = MASTER.ALLOW_PULLING_ON_START
        this.tickSpellSecondsInterval = setInterval(
            () => this.tickSpellSeconds(1000),
            1000
        )
        this.tickBroadcastInterval = setInterval(
            () => this.sendBC(),
            MASTER.BROADCAST_INTERVAL
        )
        if (MASTER.AUTOSAVE_INTERVAL_FULL)
            this.autoSaveIntervalFull = setInterval(
                () => this.exportALL(), MASTER.AUTOSAVE_INTERVAL_FULL)
        if (MASTER.AUTOSAVE_INTERVAL_MINIMAL)
            this.autoSaveIntervalMinimal = setInterval(
                () => this.exportALL({ minimalOnly: true }), MASTER.AUTOSAVE_INTERVAL_MINIMAL)




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
        if (player.actives.length >= RULES.MAX_ACTIVES) return //will reset canPullState externally
        const availableSpells = Spell.GRIMOIRE
            .filter(x => x.isInGrimoire)
            .filter(x => !player.seen.includes(x))
        if (!availableSpells.length) {
            bigbadpop(`${player.person.name} cannot pull any spells from the Grimoire.`)
            player.person.spam("infopop", "There are no spell left in the Grimoire.")
            return //missed the early return, oops!
        }
        const leastSeenNumber = Math.min(...availableSpells.map(x => x.seenHistory.length))
        let leastSeenFiltered = availableSpells.filter(x => x.seenHistory.length == leastSeenNumber)
        if (!leastSeenFiltered.length) leastSeenFiltered = availableSpells
        const lowestBucket = Math.min(...leastSeenFiltered.map(x => x.bucket))
        let lowestFiltered = leastSeenFiltered.filter(x => x.bucket == lowestBucket)
        if (!lowestFiltered.length) lowestFiltered = leastSeenFiltered
        const chosenSpell =
            lowestFiltered[MM.randomIndex(lowestFiltered.length)]
        chosenSpell.isInGrimoire = false
        if (RULES.HEAL_WHEN_PULLING_FROM_GRIMOIRE) {
            player.hp += RULES.HEAL_WHEN_PULLING_FROM_GRIMOIRE
            player.totalHeal += RULES.HEAL_WHEN_PULLING_FROM_GRIMOIRE
            eventLog.push({
                str: `${player.person.name} healed for ${RULES.HEAL_WHEN_PULLING_FROM_GRIMOIRE} HP by pulling a spell from the Grimoire.`,
                type: "healFromGrimoire",
                time: Date.now(),
                player: player
            })
            if (player.hp > RULES.MAX_HP) player.hp = RULES.MAX_HP
            player.stampHP()
        }
        this.assignSpellToPlayer(chosenSpell, player)

        eventLog.push({
            str: `${player.person.name} pulled ${RULES.SPELL_NAMES[chosenSpell.id]} ${RULES.TIER_STRINGS[chosenSpell.tier]} from the Grimoire.`,
            type: "pullFromGrimoire",
            player,
            spell: chosenSpell,
            time: Date.now(),
        })

    }

    /**@param {Player} player @param {Spell} spell  */
    assignSpellToPlayer(spell, player) {
        spell.timeLeft = RULES.TIME_FROM_TIER(spell.tier)
        player.actives.push(spell)
        spell.isActive = true
        spell.isBeingSolvedBy = player
        spell.seenHistory.push(player)
        spell.placeHistory.push(player.id)
        player.seen.push(spell)

    }

    /**@param {Spell} spell @param {Player} player */
    spellFizzlesOn(spell, player, { notAddedToStats = false } = {}) {
        spell.unbind()
        player.actives = player.actives.filter(x => x !== spell)
        player.accolades.push([spell.id, -1]) //tier -1 means failure!
        spell.placeHistory.push(-1) //-1 means back to grimoire
        const dmg = RULES.DAMAGE_FROM_TIER(spell.tier)
        player.hp -= dmg
        player.totalDamageTaken += dmg //taken is always added to stats...
        if (!notAddedToStats) { //should exclude grimoire somehow
            if (spell.placeHistory.at(-1) != -1) //find by id. ownerhistory is practically useless
            {
                const lastOwner = Player.ALL.find(x => x.id == spell.placeHistory.at(-1))
                if (!lastOwner) {
                    console.error("ERROR: last owner somehow does not exist")
                    bpop(`Last owner of spell ${spell.id}:${spell.placeHistory} somehow does not exist`)
                }
                else { lastOwner.totalDamageDealt += dmg }

            }
        }
        if (player.hp <= 0) return this.playerDowned(player)
        const str = `${player.person.name} took ${dmg} damage from ${RULES.SPELL_NAMES[spell.id]} ${RULES.TIER_STRINGS[spell.tier]} spell`
            + (spell.ownerHistory.at(-1) ?
                ` of ${spell.ownerHistory.at(-1).person.name}`
                : ` from the Grimoire`)
            + `.`
        chat.spam("globalpop", str)



        eventLog.push({
            str: str,
            attacker: spell.ownerHistory.at(-1),
            type: "spellFizzlesOn",
            victim: player,
            spell: spell,
            dmg: dmg,
            time: Date.now(),
        })
        player.stampHP()
        // this.advanceQueue(player)

        if (RULES.FIZZLE_AUTO_RETURN_WITHOUT_SERVER) {
            spell.tier =
                RULES.FIZZLE_AUTO_RETURN_WITHOUT_SERVER_TIER_FUNCTION(spell.tier)
            spell.isInGrimoire = true
        }
        if (RULES.ALLOW_PULLING_FROM_GRIMOIRE_AFTER_ANY_FIZZLE)
            player.canPullFromGrimoire = true
    }

    /**@param {Player} player */
    playerDowned(player) {
        player.s.downed.setAsCurrent()
        player.totalKnockedDown += 1 //stats should not be part of state change.
        eventLog.push({
            str: `${player.person.name} downed for ${RULES.REVITALIZE_TIMEOUT_SECONDS} seconds.`,
            player: player,
            type: "playerDowned",
            time: Date.now(),
        })

    }

    /**@param {Spell} spell @param {Player} player */
    spellUpgradedByPlayer(spell, player) {
        if (spell.isBeingSolvedBy != player) return console.error("BADNESS spell upgraded by player it is not being solved by", { player, spell }) //weird stuff?
        spell.unbind()
        const timeLeftMinutes = spell.timeLeft / 60 / 1000
        const tiersUpgraded =
            MM.clamp(Math.floor(timeLeftMinutes),
                RULES.MIN_TIERS_UPGRADED_AT_ONCE,
                RULES.MAX_TIERS_UPGRADED_AT_ONCE)
        spell.tier += tiersUpgraded
        if (spell.tier > RULES.MAX_TIER) spell.tier = RULES.MAX_TIER
        const heal = RULES.HEAL_FROM_NUMBER_OF_TIERS_UPGRADED_FUNCTION(tiersUpgraded)
        player.hp += heal
        player.totalHeal += heal
        player.totalUpgrades += tiersUpgraded
        if (player.hp > RULES.MAX_HP) player.hp = RULES.MAX_HP
        player.stampHP()
        const ind = player.actives.indexOf(spell)
        if (ind != -1) { player.actives.splice(ind, 1) }
        else { console.error("BADNESS upgraded spell isn't active", { player, spell }) }
        player.owned.push(spell)
        spell.ownerHistory.push(player)
        player.accolades.push([spell.id, spell.tier])
        player.person.spam("localpop", `You upgraded ${RULES.SPELL_NAMES[spell.id]} by ${tiersUpgraded} tiers!\nYou healed ${heal} hp, and can now target someone to possibly deal ${RULES.DAMAGE_FROM_TIER(spell.tier)} damage!`)
        const str = `${player.person.name} upgraded ${RULES.SPELL_NAMES[spell.id]} to Tier ${RULES.TIER_STRINGS[spell.tier]}, and healed for ${heal}HP.`
        chat.targetSpam(
            Player.ALL.filter(x => x != player),
            "globalpop", str
        )
        eventLog.push({
            str,
            player,
            type: "spellUpgradedByPlayer",
            heal,
            time: Date.now(),
        })

        //if no valid target is left:
        if (Player.ALL.every(x => x.seen.includes(spell))) {
            player.person.wee("serverpop", `Everyone has already seen that spell, so you cannot attack anyone with it.`)
                .then(_ => gpop(`${player.person.name} ran out of targets.`))
                .catch(_ => bpop(`BADNESS: ${player.person.name} could not be notified about running out of targets.`))
            if (RULES.HEAL_WHEN_OUT_OF_TARGETS) {
                player.hp += RULES.HEAL_WHEN_OUT_OF_TARGETS
                if (player.hp > RULES.MAX_HP) player.hp = RULES.MAX_HP
                player.stampHP()
            }
            eventLog.push({
                type: "outOfTargets",
                player: player,
                spell: spell,
                time: Date.now(),
                str: `${RULES.SPELL_NAMES[spell.id]} ${RULES.TIER_STRINGS[spell.tier]} of ${player.person.name} has no targets available` +
                    RULES.HEAL_WHEN_OUT_OF_TARGETS ? ` and is instead consumed for ${RULES.HEAL_WHEN_OUT_OF_TARGETS} HP.` : "."
            })
            // this.advanceQueue(player)
            return
        }

        player.wielding = spell
        player.s.targeting.setAsCurrent()

        player.person.wee("targeting") //notify last!
            .then(_ => gpop(`${player.person.name} began targeting.`))
            .catch(_ => bpop(`BADNESS: ${player.person.name} cannot target!`))

        if (RULES.ALLOW_PULLING_FROM_GRIMOIRE_AFTER_ANY_SOLVE)
            player.canPullFromGrimoire = true
    }

    tickSpellSeconds(dt = 1000) {  //called every second?
        if (this.masterPause) return
        for (const player of Player.ALL) {
            if (player.ticking) { //instead of a managed state?
                player.actives.forEach(spell => {
                    spell.timeLeft -= dt
                    if (spell.timeLeft < 0) this.spellFizzlesOn(spell, player)
                })
            }
            if (player.s.targeting.isCurrent) {
                player.targetingTimeLeft -= dt
                if (player.targetingTimeLeft <= 0) {
                    //let it fizzle lol!
                    eventLog.push({
                        type: "failedTargeting",
                        player: player,
                        spell: player.wielding,
                        str: `${player.person.name} failed targeting their newly upgraded spell, so it blew up in their own face.`,
                        time: Date.now(),
                    })
                    this.spellFizzlesOn(player.wielding, player, { notAddedToStats: true })
                    player.s.fighting.setAsCurrent()
                }
            } else if (player.s.downed.isCurrent) {
                player.downedTimeLeft -= dt
                if (player.downedTimeLeft <= 0) {
                    eventLog.push({
                        str: `${player.person.name} is back in the game with ${player.hp} HP!`,
                        type: "revitalize",
                        player: player,
                        time: Date.now(),
                    })
                    player.s.fighting.setAsCurrent()
                }
            } else this.advanceQueue(player)
        }
    }

    /**@param {Spell} spell @param {Player} player  @param {number} guess  */
    attempt(spell, player, guess) {
        if (!spell || !player || (spell.isBeingSolvedBy != player)) {
            console.error("invalid attempt", spell, player, guess)
            bpop("BADNESS: see console")
            return { correct: false, reason: "Error. Server failure." }
        }
        if (RULES.ACCURACY_FUNCTION(guess, spell.solution)) {
            this.spellUpgradedByPlayer(spell, player)
            return { correct: true }
        } else {
            return { correct: false, reason: `Your answer of ${guess} is incorrect.` }
        }
    }
    /**@param {Player} attacker  @param {Player} defender*/
    target(attacker, defender) {
        const spell = attacker.wielding
        if (!spell) return (bpop(`BADNESS: target command from ${attacker.person.name} but not wielding any spell.`), "ERROR: INVALID REQUEST")
        if (attacker == defender) return `Can't target yourself, dummy.`
        if (!defender) return `ERROR: Selected player somehow doesn't exist??`
        if (!defender.targetable) return `Selected player cannot be attacked right now.`
        if (defender.seen.includes(spell)) return `Selected player already seen that spell.`

        if (defender.actives.length == RULES.MAX_ACTIVES) {
            if (defender.passives.length == RULES.MAX_PASSIVES
                &&
                !Player.ALL
                    .filter(x => x != attacker)
                    .filter(x => x.targetable)
                    .every(x =>
                        x.actives.length == RULES.MAX_ACTIVES && x.passives.length == RULES.MAX_PASSIVES
                    )
            ) return `Selected player is not a valid target. They already have too many passive spells.`
            //passive slot is easy to fill
            defender.passives.push(spell)
            spell.timeLeft = spell.timeLeft = RULES.TIME_FROM_TIER(spell.tier)
        } else this.assignSpellToPlayer(spell, defender)
        attacker.wielding = null
        attacker.targetingTimeLeft = 0
        eventLog.push({
            str: `${attacker.person.name} attacks ${defender.person.name} with a Tier ${RULES.TIER_STRINGS[spell.tier]} spell.`,
            attacker,
            defender,
            spell,
            type: "target",
            time: Date.now(),
        })
        attacker.s.fighting.setAsCurrent()
        this.advanceQueue(attacker)
        return `Succesfully attacked ${defender.person.name}.\nThey have ${MM.toMMSS(RULES.TIME_FROM_TIER(spell.tier))} to solve, or else they take ${RULES.DAMAGE_FROM_TIER(spell.tier)} damage.` //successful attack!

    }
    /**@param {Player} player */
    advanceQueue(player) {
        if (RULES.ALLOW_PULLING_FROM_GRIMOIRE_WHENEVER_EMPTY
            && player.actives.length == 0
            && player.passives.length == 0
        ) player.canPullFromGrimoire = true
        if (player.actives.length == RULES.MAX_ACTIVES) return
        if (player.passives.length == 0) return
        const firstPassive = player.passives.shift()
        this.assignSpellToPlayer(firstPassive, player)
    }



    sendBC() {
        if (this.masterPauseBC) return
        // const playersData = Player.ALL.map(x => x.person.name)
        const BCdata = this.getBCdata()

        chat.spam("bc", BCdata)
    }

    localStorageReadLatestSave() {
        localStorage.getItem(MASTER.LOCALSTORAGE_KEY_MINIMAL) //only minimal is saved to local now
        /*
        return {
            full: localStorage.getItem(MASTER.LOCALSTORAGE_KEY),
            minimal: localStorage.getItem(MASTER.LOCALSTORAGE_KEY_MINIMAL),
        }
        */
    }
    exportALL({ minimalOnly = false } = {}) {
        console.log("Attempting to save...")
        const minimalBackup =
            JSON.stringify({
                eventLogStr: eventLog.map(x => x.str),
                eventLogStrTypeTime: eventLog.map(x => [x.str, x.type, x.time]),
                table: this.table.txt,
                grimTable: this.grimTable.txt,
            })
        MM.localStorageBackup(MASTER.LOCALSTORAGE_KEY_MINIMAL, 5)
        localStorage.setItem(MASTER.LOCALSTORAGE_KEY_MINIMAL, minimalBackup)
        console.log("created minimal backup")
        if (minimalOnly) return
        const str =
            MM.safeStringify({
                BC: this.getBCdata(),
                grim: Spell.GRIMOIRE,
                players: Player.ALL,
                // chat: chat, //DONT EVER, IDIOT
                hpLog: Player.ALL.map(p =>
                    [p.person.name, p.person.nameID, p.hpLog]),
                eventLog,
            })
        /*
        try {
            console.log("Successful safeStringify!")
            MM.localStorageBackup(MASTER.LOCALSTORAGE_KEY, 5)
            console.log("Made backups")
            localStorage.setItem(MASTER.LOCALSTORAGE_KEY, str)
            console.log("Save to local successful!")
        } catch { }
        */
        try {
            MM.downloadFile(
                str, "fireball" + MM.dateAndTimeShort() + ".json"
            )
            console.log("Save to file successful!")
        } catch { }
        return str
    }


} //this is the last closing brace for class Game




//#region dev options
/// dev options dev.dev.dev.
const dev = {
    cheat: () => {
        console.table(Spell.GRIMOIRE.map(x => [x.id, RULES.SPELL_NAMES[x.id], x.solution]))
    },
}/// end of dev

