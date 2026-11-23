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
        this.init_shared()
        this.initWithStatesFullProcess()
    }
    async initWithStatesFullProcess() {
        wDiv.show()
        await this.initWithStatesConnection()
        await this.initWithStates()
        await this.initWithStatesGrimButton()
        await this.initWithStatesSpellRunes()
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
        this.me = await chat.wee("whatsmyid") // no need to ever really update?

        //why not use this as nameID to begin with? sigh. whatever.

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
        this.solverMall = new Malleable()
        this.fighterMall = new Malleable()
        this.add_drawable(this.solverMall, 4)
        this.add_drawable(this.fighterMall, 4)
        const fullViewer = this.fullViewer = Button.fromRect(this.rect.copy)
        fullViewer.isBlocking = true
        fullViewer.on_release = () => {
            this.ui.fighting.setAsCurrent()
        }
        this.solverMall.push(fullViewer)
        fullViewer.deflate(
            GRAPHICS.FULLVIEWER_PADDING * 2,
            GRAPHICS.FULLVIEWER_PADDING * 2)
        fullViewer.color = GRAPHICS.FULLVIEWER_COLOR
        const cBG = new Button({ width: 50, height: 100 }) //what?
            .stretch(
                GRAPHICS.CALCULA_SCALEFACTOR,
                GRAPHICS.CALCULA_SCALEFACTOR)
            .rightat(this.WIDTH - GRAPHICS.CALCULA_RIGHT)
            .bottomat(this.HEIGHT - GRAPHICS.CALCULA_BOTTOM)
        const calcula = this.calcula =
            new CalculatorButtons(cBG)
        const waveWhenApplicable = () => ansOver.rad = this.fasterSin * .2
        calcula.animToggle = (forceOff = false) => {
            if (!forceOff && !calcula.visible) {
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
        // calcula.deactivate() //default state is off? - yes, in setFullViewer
        const ansOver = calcula.ans.copy
        ansOver.eraseClickables()
        ansOver.fontSize = 28
        ansOver.color = calcula.ans.color = "white"
        ansOver.on_release = () => calcula.animToggle()
        ansOver.dynamicText = () => calcula.ans.txt ? "" : "Click to hide/show buttons"
        ansOver.isBlocking = true
        this.solverMall.push(calcula)
        this.solverMall.push(ansOver)
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
            fighting: this.uiMachine.createState(),
            solving: this.uiMachine.createState()
        }

        let targetingDrawableIsVisible = false
        const targetingDrawable = {
            draw: (ctx) => {
                if (targetingDrawableIsVisible) return

            }
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
            targetingDrawableIsVisible = true
        })
        this.ui.targeting.on_leave.push(() => {
            targetingDrawableIsVisible = this.fasterAmp
        })
        this.ui.spectating.on_enter.push(() => {
            this.fighterMall.activate()
            this.solverMall.deactivate()
        })
        this.ui.fighting.on_enter.push(() => this.fighterMall.activate())
        this.ui.fighting.on_leave.push(() => {
            this.fighterMall.deactivate()
            console.log("huh?")
        })
        this.ui.downed.on_enter.push(() => downedButton.activate())
        this.ui.downed.on_leave.push(() => downedButton.deactivate())
        this.ui.solving.on_enter.push(() => this.solverMall.activate())
        this.ui.solving.on_leave.push(() => this.solverMall.deactivate())

        this.ui.spectating.setAsCurrent()
        this.ui.solving.setAsCurrent()
        this.ui.fighting.setAsCurrent() //do a full cycle
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
        const grim = this.grim = new Button({ width: 300, height: 300 })
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
        grim.isBlocking = true
        grim.bottomat(this.HEIGHT - 100)
        grim.rightat(this.WIDTH - 100)
        grim.deactivate() //let server activate it!
        this.fighterMall.push(grim)
    }

    async initWithStatesSpellRunes() {
        const runes = this.runes = []
        for (const spell of Spell.GRIMOIRE) {
            const mall = spell.createGraphics()
            runes.push(mall)
            this.fighterMall.push(mall)
            mall.deactivate() //let server activate!
            spell.button.on_release = () => {// i am retarded lol
                // console.log(mall, spell)
                if (this.myself?.actives.includes(spell)) {
                    game.once(() => this.setFullViewerOn(spell.id))

                }
            }
            mall.update = (dt) => {
                // if (!mall.visible) return //why not always?
                spell.timeLeft -= dt
            }
        }

    }



    //#endregion

    //#region update_more
    update_more(dt) {
        this.gentleSin = Math.sin(this.dtTotal / 500)
        this.gentleAmp = 1 + 0.12 * this.gentleSin
        this.fasterSin = Math.sin(this.dtTotal / 200)
        this.fasterAmp = 1 + 0.12 * this.fasterSin

        if (this.myself) this.update_animations(dt)
    }
    //#endregion

    update_animations(dt) {
        //sid is same as ui ID
        // this.uiMachine.states[this.myself.sid].setAsCurrent()//why not

        //each player drags THEIR spells
        for (const player of Player.poolBANK.values()) {
            player.actives.forEach((spell, i) => {
                const tx = player.button.cx + GRAPHICS.SPELL_SLOT_LOCATIONS[i][0]
                const ty = player.button.cy + GRAPHICS.SPELL_SLOT_LOCATIONS[i][1]
                const dx = tx - spell.button.cx
                const dy = ty - spell.button.cy
                if (Math.abs(dx) + Math.abs(dy) < GRAPHICS.SNAP_EPSILON) {
                    spell.button.centerat(tx, ty)
                }
                spell.button.move(
                    dx * dt * GRAPHICS.CRAWL_COEFFICIENT,
                    dy * dt * GRAPHICS.CRAWL_COEFFICIENT
                )
            })

        }

    }

    //#region draw_more
    draw_more(screen) {
    }
    //#endregion

    //#region next_loop_more
    next_loop_more() {
    }//#endregion




    shared = null
    lastBCtime = null
    /**@param {ReturnType<typeof this.getBCdata>} data  */
    receiveBC(data) {
        this.lastBCtime = Date.now()
        this.refreshUI(data) //refresh first!
        this.shared = data //just for safekeeping, really
    }
    /**@param {Player} player  */
    on_creationOfPlayerInPool(player) {
        this.fighterMall.push(player.createGraphics())
        Button.make_draggable(player.button)
        player.button.move(MM.random(0, 400), MM.random(0, 400))
    }

    /**@param {ReturnType<typeof this.getBCdata>} data  */
    refreshUI(data) {
        //Player handling
        if (data.pd) {
            const copies = new Set(Player.poolBANK.values())
            for (const p of data.pd) { // HARD requires p.x
                if (p.x == null) throw new Error("Invalid p.x")
                const player = Player.pool(
                    p.x, //keyed by incremental id instead of nameID - not great?
                    u => this.on_creationOfPlayerInPool(u))
                copies.delete(player)
                if (p.n)
                    player.name = p.n
                if (p.a)
                    player.actives = p.a.map(x => Spell.GRIMOIRE[x])
                if (p.p)
                    player.passives = p.p.map(x => Spell.GRIMOIRE[x])
                if (p.i)
                    player.nameID = p.i
                if (p.v)
                    player.seen = p.v.map(x => Spell.GRIMOIRE[x])
                if (p.c != null)
                    player.canPullFromGrimoire = p.c
                if (p.h != null)
                    player.hp = p.h
                if (p.s != null) {
                    player.updateStateInfo(p.s)
                }
            }
            //Remove redundant players
            for (const redundant of copies) {
                this.remove_drawable(redundant.mall)
                Player.poolBANK.delete(redundant.id)
                if (redundant.id == this.me) { //only happens if kicked, or message missing
                    GameEffects.popup("You have been kicked?\nAsk teacher for help",
                        {
                            posFrac: [.5, .5], sizeFrac: [.99, .99],
                            moreButtonSettings: { color: "purple", fontSize: 240 },
                            floatTime: Infinity,
                        })
                }
            }
        }
        //Spell handling
        if (data.sd) {
            for (const [id, tier, timeLeft, placeHistory] of data.sd) { // can skip
                const spell = Spell.GRIMOIRE[id]
                spell.tier = tier
                spell.timeLeft = timeLeft
                if (placeHistory)
                    spell.placeHistory = placeHistory
            }
        }
        this.refreshAnimations()


    }
    /**@type {?Player} */
    myself = null
    refreshAnimations() {
        this.myself ??= Player.pool(this.me,
            x => this.on_creationOfPlayerInPool(x)) //just in case //just once
        //grim button
        this.grim.activeState = this.myself.canPullFromGrimoire
        //activate the appropriate spells
        const activeSpells = []
        const passiveSpells = []
        for (const player of Player.poolBANK.values()) {
            activeSpells.push(...player.actives)
            passiveSpells.push(...player.passives)
        }

        Spell.GRIMOIRE.forEach(x => x.mall.deactivate())
        activeSpells.forEach(x => x.mall.activate())
        passiveSpells.forEach(x => x.mall.activate()) //not sure about this, we'll see

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
    setFullViewerOn(spellID) {
        const spell = Spell.GRIMOIRE[spellID]
        // this.calcula.deactivate()
        this.calcula.animToggle(true)
        this.spellIDCurrentlyBeingSolved = spellID
        this.fullViewer.img = this.imgCache(spell.img)
        this.fullViewer.color = spell.color
        this.ui.solving.setAsCurrent()


    }

    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
