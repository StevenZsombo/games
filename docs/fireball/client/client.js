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
        this.initWithStatesFullProcess()
    }
    async initWithStatesFullProcess() {
        wDiv.show()
        await this.initWithStatesConnection()
        await this.initWithStates()
        await this.initWithStatesGrimButton()
        await this.initWithStatesDiagnostic()
        wDiv.hide()
    }



    async initWithStatesConnection() {
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

        chat.eggs("targeting", () => this.ui.targeting.setAsCurrent())

        chat.eggs("bc", data => this.receiveBC(data))

    }
    async initWithStates() {
        const w = this.w = new GameWorld(this.rect.copy)
        this.add_drawable(w, 4)
        const playground = this.playground = new GameWorld(this.rect.copy)
        this.add_drawable(playground, 4)
        const fullViewer = this.fullViewer = Button.fromRect(this.rect.copy)
        fullViewer.deflate(
            GRAPHICS.FULLVIEWER_PADDING * 2,
            GRAPHICS.FULLVIEWER_PADDING * 2)
        fullViewer.color = GRAPHICS.FULLVIEWER_COLOR
        w.add_drawable(fullViewer, 7) //way above other stuff
        const cBG = new Button({ width: 50, height: 100 }) //what?
            .stretch(
                GRAPHICS.CALCULA_SCALEFACTOR,
                GRAPHICS.CALCULA_SCALEFACTOR)
            .rightat(this.WIDTH - GRAPHICS.CALCULA_RIGHT)
            .bottomat(this.HEIGHT - GRAPHICS.CALCULA_BOTTOM)
        const calcula = this.calcula =
            new CalculatorButtons(cBG)
        const waveWhenApplicable = () => ansOver.rad = this.fasterAmp
        calcula.animToggle = () => {
            if (!calcula.visible) {
                calcula.activate()
                ansOver.transparent = true
                ansOver.update = null
                ansOver.rad = 0
                calcula.calculatorButtons.forEach(b =>
                    this.animator.add_anim(new Anim(
                        b, 500, Anim.f.moveFrom,
                        {
                            x: b.x, y: calcula.ans.y,
                            ditch: true
                        }
                    )))
            } else {
                calcula.deactivate()
                calcula.ans.txt = "" //also clears!
                ansOver.transparent = false
                ansOver.update = waveWhenApplicable
            }

        }
        const ansOver = calcula.ans.copy
        ansOver.eraseClickables()
        ansOver.fontSize = 28
        ansOver.color = calcula.ans.color = "white"
        ansOver.on_release = () => calcula.animToggle()
        ansOver.dynamicText = () => calcula.ans.txt ? "" : "Click to hide/show buttons"
        w.add_drawable(calcula, 5)
        w.add_drawable(ansOver, 5) //just on top of it
        calcula.verifyAnswerAsync = async (guess) => {
            const resp = await chat.wee("attempt",
                [this.spellIDCurrentlyBeingSolved, guess])
            console.log(resp)
            if (!resp?.correct) pop.server(`You answer of ${guess} is incorrect.`)
            return resp //built-in correct and all that!
        }


        this.uiMachine = new SimpleStateMachine()
        this.ui = { //must coincide with Player .s
            spectating: this.uiMachine.createState(),
            targeting: this.uiMachine.createState(),
            downed: this.uiMachine.createState(),
            figting: this.uiMachine.createState(),
            solving: this.uiMachine.createState()
        }
        this.ui.spectating.setAsCurrent()

        const targetingDrawable = {
            draw: (ctx) => {
                if (!targetingDrawable.visible) return

            },
            visible: false
        }
        this.add_drawable(targetingDrawable, 7)
        const downedButton = Button.fromRect(this.rect.copy)
            .stretch(.95, .2)
            .bottomat(this.rect.bottom - 20)
        downedButton.txt = `Downed for ${RULES.REVITALIZE_TIMEOUT_SECONDS} seconds\nCan't do anything in the meantime.`
        downedButton.fontSize = 72
        downedButton.font_color = "blue"
        downedButton.transparent = true
        downedButton.deactivate()
        this.add_drawable(downedButton, 7)
        this.ui.targeting.on_enter.push(() => {
            targetingDrawable.visible = true
        })
        this.ui.targeting.on_leave.push(() => {
            targetingDrawable.visible = false
        })
        this.ui.spectating.on_enter.push(() => {
            playground.visible = true
            playground.interactable = true //why not? not sure. TODO
        })
        this.ui.figting.on_enter.push(() => {
            playground.visible = true
            playground.interactable = true
        })
        this.ui.figting.on_leave.push(() => {
            playground.visible = false
            playground.interactable = false
        })
        this.ui.downed.on_enter.push(() => downedButton.activate())
        this.ui.downed.on_leave.push(() => downedButton.deactivate())
        this.ui.solving.on_enter.push(() => {
            w.visible = true
            w.interactable = true
            //TODO: animate from origin!
        })
        this.ui.solving.on_leave.push(() => {
            w.visible = false
            w.interactable = false
        })
    }

    async initWithStatesDiagnostic() {
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

        if (GRAPHICS.INSIST_ON_FULLSCREEN_COUNT) {
            GameEffects.insistOnFullscreen(GRAPHICS.INSIST_ON_FULLSCREEN_COUNT)
        }
    }

    async initWithStatesGrimButton() {
        const playground = this.playground
        const grim = this.grim = new Button({ width: 300, height: 300 })
        playground.add_drawable(grim, 5)
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

    }



    //#endregion

    //#region update_more
    update_more(dt) {
        this.gentleSin = Math.sin(this.dtTotal / 500)
        this.gentleAmp = 1 + 0.12 * this.gentleSin
        this.fasterSin = Math.sin(this.dtTotal / 200)
        this.fasterAmp = 1 + 0.12 * this.fasterSin
    }
    //#endregion


    //#region draw_more
    draw_more(screen) {
    }
    //#endregion

    //#region next_loop_more
    next_loop_more() {
    }//#endregion




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
        this.fullViewer.img = this.imgCache(img)
        this.ui.solving.setAsCurrent()

    }

    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
