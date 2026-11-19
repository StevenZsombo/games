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
const pop =
{
    "local": (str) => GameEffects.popup(str,
        { moreButtonSettings: { isBlocking: false, color: "lightblue" }, travelTime: 300, floatTime: 5000, sizeFrac: [.55, .125], posFrac: [.5, .725] }),
    "global": (str) => GameEffects.popup(str,
        { moreButtonSettings: { isBlocking: false, color: "pink" }, travelTime: 300, floatTime: 5000, sizeFrac: [.65, .125], posFrac: [.5, .825] }),
    "server": (str) => GameEffects.popup(str,
        { moreButtonSettings: { isBlocking: false, color: "yellow" }, travelTime: 300, floatTime: 5000, sizeFrac: [.55, .125], posFrac: [.5, .925] }),
    "info": (str) => GameEffects.popup(str,
        { moreButtonSettings: { isBlocking: false, color: "lightgray" }, travelTime: 300, floatTime: 5000, sizeFrac: [.55, .125], }),
    "error": (str) => GameEffects.popup(str,
        { moreButtonSettings: { isBlocking: false, color: "red" }, travelTime: 300, floatTime: 5000, sizeFrac: [.8, .25], posFrac: [.5, .2] }),
}


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
        const sessionID = enter.sessionID
        const existingSessionID = localStorage.getItem("sessionID")
        if (
            MASTER.SESSION_ID_CHECK &&
            existingSessionID != null &&
            existingSessionID != sessionID) {
            localStorage.clear()
            await new Promise.resolve()
            chat.silentReload()
        }
        localStorage.setItem("sessionID", sessionID)
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
        chat.eggs("eval", eval)

        chat.eggs("localpop", pop.local)
        chat.eggs("globalpop", pop.global)
        chat.eggs("infopop", pop.info)
        chat.eggs("serverpop", pop.server)
        chat.eggs("errorpop", pop.error)

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


        const botBG = this.botBG = Button.fromRectShallow(
            this.rect.copy
                .leftat(GRAPHICS.LEFT)
                .rightstretchat(this.WIDTH - GRAPHICS.RIGHT)
                .topat(this.HEIGHT - GRAPHICS.GRIMOIREHEIGHT - GRAPHICS.GRIMOIREPADDINGBOTTOM)
                .bottomstretchat(this.HEIGHT - GRAPHICS.GRIMOIREPADDINGBOTTOM)
        )
        botBG.update = () => {
            const targeting = this.ownData?.w != null
            if (targeting) {
                botBG.txt = `Click on a player ${RULES.CLICK_COUNT_TO_ATTACK} times to attack them!`
                botBG.fontSize = 80 * this.gentleAmp
            } else {
                botBG.txt = ""
            }

        }
        botBG.font_color = "red"
        botBG.transparent = true
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
            chat.wee("pull").then(() => { }).catch(() => pop.error("Could not contact server, ask the teacher for help."))
        }
        grim.txt = `PULL A NEW \nSPELL\nFROM THE\nGRIMOIRE`
        grim.update = () => {
            grim.rad = this.gentleSin * 0.05
        }
        grim.deactivate() //let server activate it!
        this.defaultModeMall = new Malleable(grim, ...activeButs, botBG)
        this.add_drawable(this.defaultModeMall)

        this.underFullView = Button.fromRectShallow(this.rect.copy, { isBlocking: true })
        this.underFullView.color = GRAPHICS.FULLVIEWER_COLOR
        this.underFullView.on_release = () => this.questionModeMall.deactivate()
        const questionModeMall = this.questionModeMall
            = new Malleable(this.underFullView, fullViewer, ...activeGhostButs)
        this.questionModeMall.isBlocking = true
        this.questionModeMall.deactivate()
        this.add_drawable(this.questionModeMall, 6)


        const cBG = new Button({ width: 50, height: 100 }) //what?
            .stretch(GRAPHICS.CALCULA_SCALEFACTOR, GRAPHICS.CALCULA_SCALEFACTOR)
            .rightat(this.WIDTH - GRAPHICS.CALCULA_RIGHT)
            .bottomat(this.HEIGHT - GRAPHICS.CALCULA_BOTTOM)

        const calcula = this.calcula =
            new CalculatorButtons(cBG)
        calcula.ans.color = "white"
        calcula.ans.on_release = () => {
            calcula.calculatorButtons.forEach(x => {
                if (x != calcula.ans) x.toggleActive()
            })
        }
        const ansOver = Button.fromRectShallow(calcula.ans.copyRect,
            {
                interactable: false, transparent: true,
                fontSize: 28
            }
        )
        ansOver.dynamicText = () => calcula.ans.txt ? "" : "Click to hide/show buttons"
        this.questionModeMall.push(calcula)
        this.questionModeMall.push(ansOver)
        calcula.verifyAnswerAsync = async (guess) => {
            const resp = await chat.wee("attempt",
                [this.spellIDCurrentlyBeingSolved, guess])
            console.log(resp)
            if (!resp?.correct) pop.server(`You answer of ${guess} is incorrect.`)
            return resp //built-in correct and all that!
        }

        const targetingDrawable = {
            draw: (ctx) => {
                if (this.questionModeMall.visible) return //only when invis
                if (!this.ownData) return
                if (!this.ownData.f) return
                const w = this.ownData.w
                if (w == null) return
                this.cards.forEach(c => {
                    if (c.info.nameID == chat.nameID) return //myself
                    if (c.info.data.v.includes(w)) return //has seen the spell
                    MM.drawEllipse(ctx,
                        c.cx,
                        c.cy,
                        c.width * this.gentleAmp * .6,
                        c.height * this.gentleAmp * .6,
                        { color: null, outline: 5, outline_color: "red" }
                    )
                })
            }
        }
        this.add_drawable(targetingDrawable, 4)


        if (RULES.SHOW_LAST_BC_TIME) {
            const lastBCtimeIndicator = new Button({ width: 300, height: 300, y: 0 })
            lastBCtimeIndicator.rightat(this.WIDTH - 10)
            lastBCtimeIndicator.transparent = true
            lastBCtimeIndicator.textSettings.textAlign = "right"
            lastBCtimeIndicator.textSettings.textBaseline = "top"
            lastBCtimeIndicator.fontSize = 16
            lastBCtimeIndicator.update = () => {
                const diff = Date.now() - this.lastBCtime
                lastBCtimeIndicator.txt =
                    diff + " ms"
                    + `\n${chat.name}\n${chat.nameID}`
                    + `\n${chat.isConnected ? "" : "DISCONNECTED!!!"}`
                lastBCtimeIndicator.font_color =
                    diff < 1500 ? "black" :
                        diff < 2000 ? "yellow" :
                            diff < 3000 ? "orange" :
                                "red"
            }
            this.add_drawable(lastBCtimeIndicator, 9)
            lastBCtimeIndicator.on_release = () => {
                // lastBCtimeIndicator.visible ^= 1
                MM.toggleFullscreen(true)
            }
        }

        if (GRAPHICS.FOUR_FULLSCREEN_START && !localStorage.getItem("nameID")) {
            await GameEffects.clickMeFourTimes()
        }
    }



    //#endregion

    //#region update_more
    update_more(dt) {
        this.gentleSin = Math.sin(this.dtTotal / 500)
        this.gentleAmp = 1 + 0.12 * this.gentleSin
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
    lastBCtime = null
    receiveBC(data) {
        this.lastBCtime = Date.now()
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
                Math.ceil(data.length / RULES.CARD_COLUMNS),
                RULES.CARD_COLUMNS
            ).flat().map(x => Button.fromRectShallow(x))
                .slice(0, data.length)
        cards.forEach((x, i) => {
            x.deflate(20, 20)
            x.color = "white"
            x.textSettings.textAlign = "left"
            x.textSettings.textBaseline = "top"
            x.fontSize = GRAPHICS.CARD_FONTSIZE
            x.info = { //kinda redundant but whatevs
                playerID: i,
                name: data[i].n,
                nameID: data[i].i,
                data: data[i]
            }
            let clickCount = 0
            x.on_click = () => {
                if (!this.ownData?.f) return //f - targeting mode in BC
                clickCount++
                setTimeout(() => clickCount = 0, 5000)
                if (clickCount >= RULES.CLICK_COUNT_TO_ATTACK) {
                    chat.wee("attack", x.info.nameID)
                        .then(pop.server)
                        .catch(() => pop.error("Failed to reach the server.\nASK TEACHER FOR HELP"))
                    clickCount = 0
                }
            }
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
            x.color =
                GRAPHICS.HIGHLIGHT_SELF_CARD && isOwnData
                    ? "lightblue" : "white"
            x.txt =
                [
                    `${k.n} - ${k.h}HP`,
                    `Actives: ${k.a.map(u => `${RULES.SPELL_NAMES[u[0]]} ${RULES.TIER_STRINGS[u[1]]} (${MM.toMMSS(u[2])})`)}`,
                    `Passives: ${k.p.map(u => `${RULES.SPELL_NAMES[u[0]]} ${RULES.TIER_STRINGS[u[1]]}  (${MM.toMMSS(u[2])})`)}`,
                    (`${k.d ? `KNOCKED OUT for ${MM.toMMSS(k.d)}` : !k.t ? "UNTARGETABLE" : ""}`) +
                    (`${k.f ? `TARGETING A SPELL FOR ${MM.toMMSS(k.f)}` : ""}`),
                    k.s.length ? `Seen:\n` + k.s.map(x => RULES.SPELL_NAMES[x]).join(",") : ""
                ].join("\n")

            x.info.playerID = i
            x.info.name = data[i].n
            x.info.nameID = data[i].i
            x.info.data = data[i]

        })
        if (!ownData) return
        this.grim.activeState =
            ownData.c
        if (!ownData.a.map(u => u[0]).some(x => x == this.spellIDCurrentlyBeingSolved))
            this.questionModeMall.deactivate() //the spell being solved is no longer active (or yours)
        if (ownData.w != null) this.questionModeMall.deactivate() //force targeting mode?
        this.activeButs.forEach((x, i) => {
            if (i < ownData.a.length) {
                const u = ownData.a[i]
                x.color = "yellow"
                const str =
                    `${RULES.SPELL_NAMES[u[0]]} ${RULES.TIER_STRINGS[u[1]]} \nTime left: \n${MM.toMMSS(u[2])} `
                x.txt = str + "\n\n(Click here to solve.)"
                this.activeGhostButs[i].txt = str
                x.isBlocking = true
                x.on_release =
                    () => {
                        if (ownData.w != null) return
                        this.setFullViewerOn(Spell.GRIMOIRE[u[0]].img)
                        this.spellIDCurrentlyBeingSolved = u[0]
                    }
            } else {
                x.color = "lightgray"
                x.txt = ""
                this.activeGhostButs[i].txt = "" //consistency!
                x.isBlocking = false
                x.on_release = null
            }

        })
    }
    spellIDCurrentlyBeingSolved = null
    imgBANK = new Map() // could be a weak map? probably not? doesn't matter.
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
