const listener = new Listener()
chat = listener.chat
const ob = new Observatory()
const bpop = str => GameEffects.popup(str, GameEffects.popupPRESETS.sideError)
const RELOAD = () => chat.spam("eval", "chat.delayedReload()")
const sessionID = MM.randomID() + MM.randomID()
class Person extends Participant {
    enter(emoji) {
        const resp = {}
        const othersWithSame = listener.personsAsArray.filter(x => x.emoji == emoji)
        if (othersWithSame.some(x => x.nameID !== this.nameID)) resp.good = false
        else {
            this.emoji = emoji
            resp.good = true
        }
        resp.sessionID = sessionID
        resp.state = sm.currentKey
        return resp
    }
    initialize() {
        this.full = null
        this.headed = new Set()
        this.solved = new Set()
        this.failed = new Set()
        this.boss = false
    }
    get pretty() { return `${this.emoji} ${this.name}` }
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
        this.spire.forEach(s => s.solvedList = new Set())
        chat.eggs("correct",/**@param {number} id @param {Person} person */
            (id, person) => {
                if (id == null) return
                person.solved.add(id)
                this.spire[id].solvedList.add(person)
            })
        this.heads.forEach(s => s.headedList = new Set())
        chat.eggs("head",/**@param {number} id @param {Person} person */
            (id, person) => {
                if (id == null) return
                person.headed.add(id)
                this.heads[id].headedList.add(person)
            })
        this.heads.forEach(s => s.failedList = new Set())
        chat.eggs("fail",/**@param {number} id @param {Person} person */
            (id, person) => {
                if (id == null) return
                person.failed.add(id)
                this.heads[id].failedList.add(person)
            })
        chat.eggs("boss",/**@param {number} id @param {Person} person */
            (_, person) => person.boss = true)
        chat.eggs("taken", () => ({
            names: listener.personsAsArray.filter(x => x.emoji).map(x => x.name) || [],
            emo: listener.personsAsArray.map(x => x.emoji).join("") || ""
        }))

        this.initServerStats()
        this.initBCreceive(true)
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
            listener.personsAsArray.map(x => [x.emoji, x.name, x.boss ? "✔️" : "...",
            ...[x.solved, x.headed, x.failed].map(u => Array.from(u).join(",")),
            `  ${x.headed.size}+${x.solved.size}`
            ])
            , ["icon", "player", "boss?", "solved", "headed", "failed", "  progress"], 1)


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
        parr.push(["FLUSH leftovers", () => listener.persons.clear()])
        const ddm = GameEffects.dropDrownBetter(parr, { moreButtonSettings: { width: 400 } })
        ddm.autoClose()
    }

    /**@param {Person} person  */
    individualMenu(person) {
        const parr = [
            ["flush", () => {
                person.wee("eval", "localStorage.clear();chat.delayedReload();").catch(bpop)
                listener.persons.delete(person.nameID)
            }],
            ["reload", () => person.wee("eval", "chat.delayedReload();").catch(bpop)],
            ["rename", async () => {
                const newName = await GameEffects.inputBoxFromRectPromise()
                if (!newName) return bpop("invalid name given.")
                person.wee("eval", `chat.forceName("${newName}")`).catch(bpop)
                    .then(() => GameEffects.popup(`Renamed to ${newName}`))
            }]
            // ["kick", () => listener.persons.delete(person.nameID)],
        ]
        const ddm = GameEffects.dropDrownBetter(parr, { moreButtonSettings: { width: 400 } })
        ddm.autoClose()

    }


    initBroadcasts() {
        this.updateBroadcasts()
        this.BCint = setInterval(() => this.updateBroadcasts(), RULES.SERVER_BROADCAST_INTERVAL)
    }
    updateBroadcasts() {
        const players = listener.personsAsArray.filter(x => x.emoji).sort((a, b) =>
            b.headed.size - a.headed.size || b.solved.size - a.solved.size)
        /*const s = this.spire.map(x => players.filter(p => p.solved.has(x.id)).map(p => p.emoji).join(""))
        const h = this.heads.map(x => players.filter(p => p.headed.has(x.id)).map(p => p.emoji).join(""))
        const f = this.heads.map(x => players.filter(p => p.failed.has(x.id)).map(p => p.emoji).join(""))        */
        const s = this.spire.map(x => Array.from(x.solvedList).map(p => p.emoji).join(""))
        const h = this.heads.map(x => Array.from(x.headedList).map(p => p.emoji).join(""))
        const f = this.heads.map(x => Array.from(x.failedList).map(p => p.emoji).join(""))
        const n = players.map(x => x.pretty)
        const obj = { s, h, f, n }
        chat.spam("bc", obj)
        this.lastBC = obj

        this.receiveBroadcast(obj)

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
