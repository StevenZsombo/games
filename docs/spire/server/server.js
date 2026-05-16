const listener = new Listener()
chat = listener.chat
const bpop = str => GameEffects.popup(str, GameEffects.popupPRESETS.sideError)
const RELOAD = () => chat.spam("eval", "chat.delayedReload()")
class Person extends Participant {
    enter(emoji) {
        const othersWithSame = listener.personsAsArray.filter(x => x.emoji == emoji)
        if (othersWithSame.some(x => x.nameID !== this.nameID)) return false
        else {
            this.emoji = emoji
            return true
        }
    }
    initialize() {
        this.full = null
        this.headed = new Set()
        this.solved = new Set()
        this.failed = new Set()
        this.boss = false
    }
}

class Game extends GameShared {
    //#region initialize_more
    initialize_more() { }
    async initialize_async() {
        /*if (!RULES.EDITOR) GameEffects.clickMeFourTimes().then(() => this.initShared())
        else this.initShared()*/
        RULES.FAKE = true
        // if (!RULES.EDITOR && !RULES.SKIP_INTRO && !location.href.includes("localhost")) GameEffects.clickMeFourTimes()
        this.initShared()
        await this.hasRetrievedData
        this.fake.txt = "SERVER"

        await chat.asapPromise()
        RELOAD()
        Array.from(["plan", "climb", "fin", "win"]).forEach(x => em.on(x, () => chat.spam(x)))


        chat.eggs("enter",/**@param {Person} person */
            (emoji, person) => person.enter(emoji))
        chat.eggs("full",/**@param {number} id @param {Person} person */
            (id, person) => person.full = id)
        chat.eggs("head",/**@param {number} id @param {Person} person */
            (id, person) => person.headed.add(id))
        chat.eggs("correct",/**@param {number} id @param {Person} person */
            (id, person) => (id != null) && person.solved.add(id))
        chat.eggs("fail",/**@param {number} id @param {Person} person */
            (id, person) => (id != null) && person.failed.add(id))
        chat.eggs("boss",/**@param {number} id @param {Person} person */
            (_, person) => person.boss = true)
        chat.eggs("taken", () => ({
            names: listener.personsAsArray.map(x => x.name) || [],
            emo: listener.personsAsArray.map(x => x.emoji).join("") || ""
        }))

        this.initServerStats()
        this.initBroadcasts()
    }
    //#endregion

    initServerStats() {
        const stats = Button.fromRectShallow(this.rect)
        stats.topat(this.fake.bottom)
        stats.bottomstretchat(this.bot.top)
        stats.stretch(.9, 1)
        stats.font_font = "myMonospace"
        stats.textSettings = { textAlign: "left", textBaseline: "top" }
        stats.color = "white"
        stats.fontSize = 24

        stats.dynamicText = () => MM.tableStr(
            listener.personsAsArray.map(x => [x.emoji, x.name, x.boss,
            ...[x.solved, x.headed, x.failed].map(u => Array.from(u).join(","))
            ])
            , ["icon", "player", "boss?", "solved", "headed", "failed"], 3)


        const statsShowHide = Button.fromButton(this.fake)
        statsShowHide.rightat(this.fake.left)
        statsShowHide.txt = "Players"
        statsShowHide.eraseClickables()
        statsShowHide.on_release = () => stats.toggleActive()


        const order = Button.fromButton(statsShowHide)
        order.rightat(statsShowHide.left)
        order.on_release = () => this.playersMenu()
        order.txt = "ORDER"

        this.add_drawable(order, 7)
        this.add_drawable(statsShowHide, 7)
        this.add_drawable(stats, 7)
    }

    playersMenu() {
        const parr = listener.personsAsArray.map(x => [x.name, () => this.individualMenu(x)])
        parr.push(["RELOAD everyone", RELOAD])
        const ddm = GameEffects.dropDrownBetter(parr, { moreButtonSettings: { width: 400 } })
        ddm.autoClose()
    }

    /**@param {Person} person  */
    individualMenu(person) {
        const parr = [
            ["reload", () => person.wee("eval", "chat.delayedReload();").catch(bpop)],
            ["flush", () => {
                person.wee("eval", "localStorage.clear();chat.delayedReload();").catch(bpop)
                listener.persons.delete(person.nameID)
            }],
        ]
        const ddm = GameEffects.dropDrownBetter(parr, { moreButtonSettings: { width: 400 } })
        ddm.autoClose()

    }


    initBroadcasts() {
        const ob = new Observatory()
        this.spire.forEach(x => ob.createItem("s" + x.id, ""))
        this.heads.forEach(x => ob.createItem("f" + x.id, ""))
        this.heads.forEach(x => ob.createItem("h" + x.id, ""))
    }

    updateBroadcasts() {

    }

    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    dtSin = 0
    gentleSin = 1
    update_more(dt) {
        this.dtSin = Math.sin(this.dtTotal / 90) * 0.2
        this.gentleSin = Math.sin(this.dtTotal / 180) * 0.02 + 1





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
