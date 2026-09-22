//#region univ
var univ = {
    isOnline: true, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: false,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "auto",
    //BROKEN
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    //BROKEN
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_first_run_blocking: null,
    on_first_run_async: null, //async function. overrides on_first_run_blocking
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: false,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}
//#endregion



/**@type {Listener} */
var listener = new Listener()
var chat = listener.chat


const bpop = str => GameEffects.popup(str, GameEffects.popupPRESETS.sideError)
const gpop = str => GameEffects.popup(str, GameEffects.popupPRESETS.topleftGreen)
let disconnectedIndicator = null
chat.on_disconnect = () => disconnectedIndicator ??= GameEffects.popup("LOST CONNECTION...", { floatTime: Infinity, posFrac: [.5, .2], moreButtonSettings: { color: "red" } })
chat.on_join = () => { disconnectedIndicator?.close(); disconnectedIndicator = null }

class Person extends Participant {
    answers = null
    answersHistory = []
    anwersLastTime = 0
    receive = (arr) => {
        this.answers = arr
        this.answersHistory.push(arr)
        this.anwersLastTime = MM.time()
    }

    kick(serverSideOnly = false) {
        if (serverSideOnly) return listener.persons.delete(this.nameID)
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

var PING = async () => {
    const pings = await Promise.all(
        listener.personsAsArray.map(async p => {
            const start = Date.now()
            const result = await p.wee("ping", null, { retries: 0, interval: 1000 }).catch(() => "TIMEOUT")
            return [p.name, result === "TIMEOUT" ? "TIMEOUT" : Date.now() - start]
        })
    )
    console.table(pings)
}


var CHECK = () => {
    const t = listener.personsAsArray
        // .filter(x => x.answers)
        .map(x => ({
            name: x.name,
            answered: x.answers
        }))

    console.table(t)
    console.log(`Answered: ${t.filter(x => x.answered).length} out of ${t.length} students.`)
}

var REVEAL = () => {
    const t = listener.personsAsArray
        .map(x => [x.name, ...x.answers])
    console.table(t)
}
chat.eggs("log", x => (console.log(x), x))
chat.eggs("answers", (arr, person) => person.receive(arr))





class Game extends GameCore {
    //#region initialize_more
    initialize_more() {
        this.hidden = true


        const bg = Button.fromRect(this.rect.copy.stretch(.8, .8).leftat(100))
        bg.color = "white"
        const table = new Table(bg, () => {
            const players = listener.personsAsArray
            // .filter(p => p.name !== p.nameID)
            const headers = "name nameID conn/pen submitted? answers".split(" ")
            const data = players.map(p => [
                p.name, p.nameID, p.isConnected ? (p.pen ? "TRIG👿" : "") : "LOST",
                p.anwersLastTime || "",
                this.hidden ? "" : p.answers
            ])
            return MM.transposeArray([headers, ...data])
        })
        table.widthWeights = [1, .75, .75, .75, 3]
        table.bottomAutoAdjust = true
        table.fontSize = 36 //from 24

        this.add_drawable(bg)
        this.add_drawable(table)
        Button.make_stretchable(bg, { layer: 4 })

        const serverButton = new Button({ width: 200, height: 100 })
        serverButton.topat(0)
        serverButton.rightat(this.WIDTH)
        this.add_drawable(serverButton)
        serverButton.txt = "SERVER"
        serverButton.on_release =
            () => GameEffects.dropDownBetter(
                [
                    ...listener.personsAsArray.map(p => [
                        p.name,
                        () => {
                            GameEffects.dropDownBetter([
                                ["kick", () => p.kick()],
                                ["reset", () => {
                                    p.eval("localStorage.clear(),chat.silentReload()")
                                    p.kick(true)
                                }],
                                ["rename", () =>
                                    GameEffects.inputBoxFromRectPromise().then(x => p.eval(`chat.forceNameSilent("${x}")`))
                                ],
                                ["fullscreen", () => p.eval(`game.mouser.on_click_once = () => MM.toggleFullscreen(true)`)],
                                ["whitelist", () => p.eval("(window.game?.ac?.whitelist(),window.ac?.whitelist())")],
                                ["message", () =>
                                    GameEffects.inputBoxFromRectPromise().then(x =>
                                        p.eval(`GameEffects.popup("${x}")`))
                                ],
                                ["eval", () =>
                                    GameEffects.inputBoxFromRectPromise().then(x => p.eval(x))
                                ]
                            ])
                        }
                    ]),
                    ["EXCEL", () =>
                        MM.exportExcel(
                            listener.personsAsArray.map(p =>
                                [p.name, p.nameID, p.anwersLastTime, ...p.answers, "record:", ...p.answersHistory.flat()]
                            ),
                            "Quickform" + MM.time())]
                ])
        Object.assign(this, { table, serverButton, bg })


        Anticheat.setupServer()

    }
    //#endregion

    //#region update_more
    update_more(dt) {






    }
    //#endregion


    //#region draw_more
    draw_more(screen) {






    }
    //#endregion

    //#region next_loop_more
    next_loop_more() {




    }//#endregion



    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
