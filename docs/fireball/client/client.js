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

        const fullViewer = this.fullViewer = Button.fromRectShallow(this.rect.copy.deflate(
            GRAPHICS.FULLVIEWER_PADDING,
            GRAPHICS.FULLVIEWER_PADDING
        ))
        fullViewer.bottomstretchat(this.HEIGHT - GRAPHICS.FULLVIEWER_PADDING
            - GRAPHICS.BENEATH_FULLVIEWER_SPACE)
        // fullViewer.color = "antiquewhite"
        fullViewer.color = null
        // fullViewer.isBlocking = true //underFullView takes care of this!


        const botBG = Button.fromRectShallow(
            this.rect.copy
                .leftat(GRAPHICS.LEFT)
                .rightstretchat(this.WIDTH - GRAPHICS.RIGHT)
                .topat(this.HEIGHT - GRAPHICS.GRIMOIREHEIGHT - GRAPHICS.GRIMOIREPADDINGBOTTOM)
                .bottomstretchat(this.HEIGHT - GRAPHICS.GRIMOIREPADDINGBOTTOM)
        ) //need not be a button but whatevs
        const botButs = this.botButs =
            botBG.splitCol(...Array(RULES.MAX_ACTIVES).fill(1), 1)
                .map(x => Button.fromRectShallow(x))
        botButs.forEach(x => x.deflate(10, 10))
        const activeButs = this.activeButs = botButs.slice(0, -1)
        botButs.forEach(x => {
            x.fontSize = 40
        })
        const activeGhostButs = this.activeGhostButs =
            activeButs.map(x => x.copy) //might be good?
        activeGhostButs.forEach((x, i) => {
            x.height = GRAPHICS.BENEATH_FULLVIEWER_SPACE - 2 * GRAPHICS.BENEATH_FULLVIEWER_PADDING
            x.bottomat(this.HEIGHT - GRAPHICS.BENEATH_FULLVIEWER_PADDING)
            //some beautiful spaghetti here!
            Object.defineProperty(x, "color", { get() { return activeButs[i].color } })
            Object.defineProperty(x, "on_release", { get() { return activeButs[i].on_release } })
            Object.defineProperty(x, "isBlocking", { get() { return activeButs[i].isBlocking } })
        })
        const grim = this.grim = botButs[botButs.length - 1]
        grim.color = "pink"
        let timeOutTillNextPullInput = 0
        grim.on_release = () => {
            if (timeOutTillNextPullInput > Date.now()) return
            timeOutTillNextPullInput = Date.now() + 3000 //cooldown
            chat.spam("pull")
        }
        grim.txt = `PULL A NEW \nSPELL\nFROM THE\nGRIMOIRE`
        this.defaultModeMall = new Malleable(grim, ...activeButs)
        this.add_drawable(this.defaultModeMall)

        this.underFullView = Button.fromRectShallow(this.rect.copy, { isBlocking: true })
        this.underFullView.color = "antiquewhite"
        this.underFullView.on_release = () => this.questionModeMall.deactivate()
        this.questionModeMall = new Malleable(this.underFullView, fullViewer, ...activeGhostButs)
        this.questionModeMall.isBlocking = true
        this.questionModeMall.deactivate()
        this.add_drawable(this.questionModeMall, 6)


        const cBG = new Button({ width: 400, height: 800 }) //what?
            .rightat(this.WIDTH - GRAPHICS.CALCULA_RIGHT)
            .bottomat(this.HEIGHT - GRAPHICS.CALCULA_BOTTOM)

        const calcula = this.calcula =
            new CalculatorButtons(cBG)
        this.questionModeMall.push(calcula)
        calcula.verifyAnswerAsync = async (guess) => {
            const resp = await chat.wee("attempt",
                [this.spellCurrentlyBeingSolved, guess])
            return { correct: !!resp }
        }


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
        this.questionModeMall.deactivate()
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
        let ownData
        this.cards.forEach((x, i) => {
            const k = data[i]
            const isOwnData = k.n == chat.name
            if (isOwnData)
                ownData = this.ownData = k
            x.color = isOwnData ? "lightblue" : "white"
            x.txt =
                [
                    `${k.n} - ${k.h}HP`,
                    `Actives: ${k.a.map(u => `${RULES.SPELL_NAMES[u[0]]} ${RULES.TIER_STRINGS[u[1]]} (${MM.toMMSS(u[2])})`)}`,
                    `Passives: ${k.p.map(u => `${RULES.SPELL_NAMES[u[0]]} ${RULES.TIER_STRINGS[u[1]]}  (${MM.toMMSS(u[2])})`)}`,
                    `${k.d ? `KNOCKED OUT for ${MM.toMMSS(k.d)}` : !k.t ? "UNTARGETABLE" : ""}`,
                    `${k.f ? `TARGETING A SPELL FOR ${MM.toMMSS(k.f)}` : ""}`
                ].join("\n")
        })
        if (!ownData) return
        this.grim.activeState =
            ownData.a.length == 0 && ownData.p.length == 0 && ownData.f == 0 && ownData.d == 0 && ownData.t != 0
        if (!ownData.a.map(u => u[0]).some(x => x == this.spellCurrentlyBeingSolved))
            this.questionModeMall.deactivate() //the spell being solved is no longer active (or yours)
        this.activeButs.forEach((x, i) => {
            if (i < ownData.a.length) {
                const u = ownData.a[i]
                x.color = "yellow"
                const str =
                    `${RULES.SPELL_NAMES[u[0]]} ${RULES.TIER_STRINGS[u[1]]}\nTime left:\n${MM.toMMSS(u[2])}`
                x.txt = str + "\n\n(Click here to solve.)"
                this.activeGhostButs[i].txt = str
                x.isBlocking = true
                x.on_release =
                    () => {
                        this.setFullViewerOn(Spell.GRIMOIRE[u[0]].img)
                        this.spellCurrentlyBeingSolved = u[0]
                    }
            } else {
                x.color = "lightgray"
                x.txt = ""
                x.isBlocking = false
                x.on_release = null
            }

        })
    }
    spellCurrentlyBeingSolved = null
    imgBANK = new Map()
    imgCache(img) {
        if (!this.imgBANK.has(img)) {
            console.log("loading img", RULES.PICTURES_FOLDER_PATH + img + ".png")
            this.imgBANK.set(img,
                this.cropper.load_img(RULES.PICTURES_FOLDER_PATH + img + ".png")
            )
        }
        return this.imgBANK.get(img)

    }
    setFullViewerOn(img) {
        this.questionModeMall.activate()
        this.fullViewer.img = this.imgCache(img)
    }

    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
