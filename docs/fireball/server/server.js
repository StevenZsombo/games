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


class Person extends Participant {
    initialize() {

    }

}

class Game extends GameShared {
    //#region initialize_more
    initialize_more() { }
    async initialize_async() {

        await chat.asapPromise()
        chat.eggs("enter", (person) => {
            if (!Player.ALL.find(x => x.person === person)) {
                Player.ALL.push(new Player(person))
            }
            return {
                RULES,
                AVAILABLE_NAMES:
                    RULES.STUDENTS.filter(k => !Player.ALL.find(x => x.person.name != k))
            }
        })




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

    }

    /**@param {Player} player @param {Spell} spell  */
    assignSpellToPlayer(spell, player) {
        spell.timeLeft = RULES.TIME_FROM_TIER(spell.tier)
        player.actives.push(spell)
        spell.isActive = true
        spell.seenHistory.push(player)

    }

    /**@param {Spell} spell @param {Player} player */
    spellFizzlesOn(spell, player) {
        spell.isActive = false
        const dmg = RULES.DAMAGE_FROM_TIER(spell.tier)
        player.hp -= dmg
        if (player.hp <= 0) return this.playerDowned(player)
        chat.spam("globalpop", `${player.person.name} took ${dmg} from the tier ${RULES.TIER_STRINGS[spell.tier]} spell`
            + (spell.ownerHistory.at(-1) ?
                ` of ${spell.ownerHistory.at(-1).person.name}`
                : ` from the Grimoire`)
            + `.`

        )
    }

    /**@param {Player} player */
    playerDowned(player) {

    }

    /**@param {Spell} spell @param {Player} player */
    spellUpgradedByPlayer(spell, player) {

    }


} //this is the last closing brace for class Game







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


//#region dev options
/// dev options dev.dev.dev.
const dev = {
}/// end of dev
