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
const gpop = str => GameEffects.popup(str, GameEffects.popupPRESETS.topleftGreen)
const sessionID = MM.randomID() + MM.randomID()


class Person extends Participant {
    initialize() {

    }

    records = []
    latest = 0
    best = 0

    addRecord(totacc) {
        this.records.push(totacc)
        this.latest = totacc
        this.best = Math.max(...this.records)
    }

    kick() {
        this.wee("eval", "chat.silentReload()")
            .then(() => gpop(`kicked ${this.name}`))
            .catch(() => bpop(`responseless kick ${this.name}`))
            .finally(() => listener.persons.delete(this.nameID))
    }
    eval(code) {
        this.wee("eval", code)
            .then(() => gpop(`${this.name} eval success!`))
            .catch(() => bpop(`Failed to reach ${this.name} with eval`))
    }
}

class Game extends GameShared {
    //#region initialize_more
    initialize_more() { }
    async initialize_async() {
        await chat.asapPromise()

        chat.eggs("totacc", (v, person) => person.addRecord(v))

        const bg = Button.fromRect(this.rect.copy.stretch(.8, .8))
        bg.color = "white"
        const table = new Table(bg, () => {
            const players = listener.personsAsArray
            // .filter(p => p.name !== p.nameID)
            const headers = "name nameID conn #rounds latest best".split(" ")
            const data = players.map(p => [
                p.name, p.nameID, p.isConnected ? "" : "DISCONNECTED",
                p.records.length, p.latest, p.best,
            ])
            return MM.transposeArray([headers, ...data])
        })
        table.bottomAutoAdjust = true

        this.add_drawable(bg)
        this.add_drawable(table)
        Button.make_stretchable(bg, { layer: 4 })

        const serverButton = new Button({ width: 200, height: 100 })
        serverButton.topat(0)
        serverButton.rightat(this.WIDTH)
        this.add_drawable(serverButton)
        serverButton.txt = "SERVER"
        serverButton.on_release =
            () => listener.personsAsArray.length && GameEffects.dropDownBetter(
                listener.personsAsArray.map(p => [
                    p.name, async () => {
                        const e = await GameEffects.inputBoxFromRectPromise()
                        if (!e) p.kick()
                        else (p.eval(e))
                    }
                ])
            )
        Object.assign(this, { table, serverButton, bg })

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
