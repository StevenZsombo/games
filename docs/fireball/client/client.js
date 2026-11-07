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

const smallpop = (str) => GameEffects.popup(str,
    { posFrac: [.1, .9], sizeFrac: [.1, .1], moreButtonSettings: { color: "pink" } })

class Game extends GameShared {
    //#region initialize_more
    initialize_more() {
        this.biginit()
    }
    async biginit() {
        wDiv.addLine("Establishing connection.")
        await chat.asapPromise()

        const enter = await chat.wee("enter", undefined, {
            retries: 10, interval: 1000, on_retry: (i) => wDiv.addLine(`Attempting to join... (${i})`)
        })
        wDiv.addLine("Rules received.")
        console.log("enter.RULES", enter.RULES)
        Object.assign(RULES, enter.RULES)



        chat.acquireName()
        if (chat.name == chat.nameID) {
            const nameSelected = GameEffects.nameSelect(
                enter.AVAILABLE_NAMES
            )
            const nameChosen = await nameSelected.promise()
            chat.forceNameSilent(nameChosen)
            console.log("nameChosen", nameChosen)
        } else console.log("name retrieved:", chat.name)

        chat.wee("bounce") //empty call, automatic name adjust!


        chat.eggs("globalpop", str => GameEffects.popup(str, GameEffects.popupPRESETS.bigYellow))
        chat.eggs("localpop", str => GameEffects.popup(str, GameEffects.popupPRESETS.bigBlue))
        chat.eggs("warningpop", str => GameEffects.popup(str, GameEffects.popupPRESETS.bigRed))

        chat.eggs("targeting", () => this.enterTargeting())

        chat.eggs("bc", data => this.receiveBC(data))

        this.buts = new Malleable()
        this.add_drawable(this.buts, 4)
        this.cards = []


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




    enterTargeting() {
        GameEffects.popup("Correct!\nSelect a valid target to attack with your spell!")
    }

    shared = null
    receiveBC(data) {
        const shared = this.shared
        if (!shared ||
            shared.length != data.length
        ) this.initUI(data)
        this.refreshUI(data)
        this.shared = data
    }


    initUI(data) {
        this.buts.components.length = 0
        this.cards.length = 0
        const bg = this.rect.copy
        bg.topat(GRAPHICS.TOP)
        bg.leftat(GRAPHICS.LEFT)
        bg.bottomstretchat(
            this.HEIGHT - GRAPHICS.GRIMOIREHEIGHT - GRAPHICS.GRIMOIREPADDINGBOTTOM)
        bg.rightstretchat(this.WIDTH - GRAPHICS.RIGHT)
        console.log(bg)
        const cards =
            bg.splitGrid(
                RULES.CARD_ROWS,
                RULES.CARD_COLUMNS
            ).flat().map(x => Button.fromRectShallow(x))
                .slice(0, data.length)
        cards.forEach((x, i) => {
            x.deflate(20, 20)
            x.color = "white"
            x.textSettings.textAlign = "left"
            x.textSettings.textBaseline = "top"
            x.fontSize = GRAPHICS.CARD_FONTSIZE
        })
        this.buts.push(...cards)
        this.cards.push(...cards)
    }
    refreshUI(data) {
        this.cards.forEach((x, i) => {
            const k = data[i]
            x.txt =
                [
                    `${k.n} - ${k.h}HP`,
                    `Actives: ${k.a.map(u => `${RULES.SPELL_NAMES[u[0]]} (${MM.toMMSS(u[1])})`)}`,
                    `Passives: ${k.p.map(u => `${RULES.SPELL_NAMES[u[0]]} (${MM.toMMSS(u[1])})`)}`,
                    `${k.d ? `UNTARGETABLE for ${MM.toMMSS(k.d)}` : !k.t ? "UNTARGETABLE" : "(can target)"}`
                    + `${k.f ? `TARGETING A SPELL FOR ${MM.toMMSS(k.f)}` : ""}`
                ].join("\n")
        })
    }
    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
