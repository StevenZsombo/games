//#region univ
var univ = {
    isOnline: true, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: GRAPHICS.SHOW_FPS || false,
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
        await this.init_shared()
        wDiv.addLine("init_shared")
        await this.initWithStatesConnection()
        wDiv.addLine("initWithStatesConnection()")
        await this.initWithStates()
        wDiv.addLine("initWithStates()")
        await this.initWithStatesGrimButton()
        wDiv.addLine("initWithStatesGrimButton")
        await this.initWithStatesSpellRunes()
        wDiv.addLine("initWithStatesSpellRunes")
        await this.initWithStatesDiagnostic()
        wDiv.addLine("initWithStatesDiagnostic")
        wDiv.addLine("\nREADY!")
        setTimeout(wDiv.hide, 500)

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
            await Promise.resolve()
            chat.silentReload()
        }
        localStorage.setItem("sessionID", sessionID)
        console.log("enter.RULES", enter.RULES)
        Object.assign(RULES, enter.RULES)



        chat.acquireName()
        if (chat.name == chat.nameID) {
            wDiv.hide()
            while (true) {
                const nameSelected = GameEffects.nameSelect(
                    enter.AVAILABLE_NAMES
                )
                const nameChosen = await nameSelected.promise()
                if (!chat.wee("isnamecool", nameChosen)) {
                    pop.server(`${nameChosen} is taken already, pick different.`)
                }
                chat.forceNameSilent(nameChosen)
                console.log("nameChosen", nameChosen)
                break
            }
            const playerPicID = GameEffects.nameSelect(
                IMAGES.wizards.map((_, i) => i), { topText: "Your mighty warrior:" }
            )
            playerPicID.buts.forEach((x, i) => {
                x.shrinkToSquare()
                x.img = IMAGES.wizards[i]
                x.txt = ""
            })
            const picID = await playerPicID.promise()
            chat.wee("setmypic", picID)
            wDiv.show()
        } else console.log("name retrieved:", chat.name)
        this.me = await chat.wee("whatsmyid") // no need to ever really update?

        //why not use this as nameID to begin with? sigh. whatever.

        chat.eggs("eval", eval)

        chat.eggs("localpop", pop.local)
        chat.eggs("globalpop", pop.global)
        chat.eggs("infopop", pop.info)
        chat.eggs("serverpop", pop.server)
        chat.eggs("errorpop", pop.error)

        chat.eggs("targeting", () => {
            this.ui.targeting.setAsCurrent()
            return null //explicitly...
        })

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

        this.fullViewerRectCopy = fullViewer.copyRect

        const cBG = new Button({ width: 50, height: 100 }) //what?
            .stretch(
                GRAPHICS.CALCULA_SCALEFACTOR,
                GRAPHICS.CALCULA_SCALEFACTOR)
            .rightat(this.WIDTH - GRAPHICS.CALCULA_RIGHT)
            .bottomat(this.HEIGHT - GRAPHICS.CALCULA_BOTTOM)
        const calcula = this.calcula =
            new CalculatorButtons(cBG)
        const waveWhenApplicable = () => ansOver.rad = this.fasterSin * .15
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
            if (!resp?.correct) pop.server(resp?.reason || "ERROR: Failed to retrieve data from server")
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
                if (!targetingDrawableIsVisible) return
                if (!this.myself) return
                const wielding = this.myself.wielding
                if (!wielding) return
                wielding.mall.activate()
                wielding.button.centerinRect(this.myself.button)
                for (const player of Player.poolBANK.values()) {

                    const [txt, color] =
                        player === this.myself
                            ? [`Must fire within ${MM.toMMSS(this.myself.targetingTimeLeft)}`, `black`]
                            :
                            player.seen.includes(wielding)
                                ? [`Can't target\n(seen spell already)`, "red"]
                                : !player.targetable
                                    ? ["Can't target\n(temporarily untargetable)", "orange"]
                                    : [`Click ${RULES.CLICK_COUNT_TO_ATTACK -
                                        player.button.___clickCount
                                        } times to attack!`, "green"]
                    const bg = player.button.copyRect
                    bg.resize(player.button.width * 2, GRAPHICS.WIZARD_NAME_FONTSIZE * 1.5)
                    MM.fillRect(ctx, ...bg.XYWHarray, { color: "lightgray" })
                    MM.drawText(ctx, txt,
                        player.button,
                        {
                            fontSize: GRAPHICS.WIZARD_NAME_FONTSIZE,
                            color: color
                        }
                    )
                }
            }
        }
        this.add_drawable(targetingDrawable, 7)
        const downedButton = Button.fromRect(this.rect.copy)
            .stretch(.95, .2)
            .bottomat(this.rect.bottom - 20)
        downedButton.dynamicText = () =>
            `Downed for ${MM.toMMSS(this.myself?.downedTimeLeft)}.\nCan't do anything in the meantime.`
        downedButton.fontSize = 72
        downedButton.font_color = "blue"
        downedButton.transparent = true
        downedButton.deactivate()
        this.add_drawable(downedButton, 7)
        this.ui.targeting.on_enter.push(() => {
            targetingDrawableIsVisible = true
            this.fighterMall.activate()
        })
        this.ui.targeting.on_leave.push(() => {
            targetingDrawableIsVisible = false
        })
        this.ui.spectating.on_enter.push(() => {
            this.fighterMall.activate()
            this.solverMall.deactivate()
        })
        let blockFighterMallOnce = false
        this.ui.fighting.on_enter.push(() => {
            if (blockFighterMallOnce)
                return blockFighterMallOnce = false
            this.fighterMall.activate()
        })
        this.ui.fighting.on_leave.push(() => this.fighterMall.deactivate())
        this.ui.downed.on_enter.push(() => downedButton.activate())
        this.ui.downed.on_leave.push(() => downedButton.deactivate())
        this.ui.solving.on_enter.push(() => this.solverMall.activate())
        this.ui.solving.on_leave.push(() => {
            // this.solverMall.deactivate()
            const spell = Spell.GRIMOIRE[this.spellIDCurrentlyBeingSolved]
            if (!spell) return
            this.solverMall.interactable = false
            this.fighterMall.interactable = false
            this.fighterMall.visible = true
            blockFighterMallOnce = true
            game.once(() => this.fighterMall.interactable = false)
            this.animator.add_anim(Anim.custom(this.fullViewer,
                GRAPHICS.ANIM_FADE_TIME, (t) => {
                    this.fullViewer.putOver(Anim.interpolRect(
                        this.fullViewerRectCopy, spell.button, t
                    ))
                },
                "x y width height",
                {
                    ditch: true, on_end: () => {
                        this.solverMall.deactivate()
                        this.fighterMall.interactable = true
                    }
                }
            ))


        })

        this.ui.spectating.setAsCurrent()
        // this.ui.solving.setAsCurrent()
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
        const grim = this.grim = new Button({
            width: GRAPHICS.GRIM_PIC_WIDHT,
            height: GRAPHICS.GRIM_PIC_HEIGHT,
            transparent: true,
            img: IMAGES.grimpic,
            fontSize: GRAPHICS.GRIM_PIC_FONTSIZE
        })
        if (RULES.WIZARDS_ARE_DRAGGABLE) Button.make_draggable(grim)
        grim.color = "pink"
        let canRequestGrim = true
        let grimClickCount = 0
        grim.on_click = () => {
            this.prioritize(grim)
            grimClickCount++
            setTimeout(() => grimClickCount = 0, 1500)
        }
        grim.on_release = () => {
            if (grimClickCount < RULES.CLICK_COUNT_TO_ATTACK) return
            if (!this.myself?.canPullFromGrimoire) return
            if (!canRequestGrim) return
            grimClickCount = 0
            canRequestGrim = false
            setTimeout(() => canRequestGrim = true, 1000)
            chat.wee("pull").then(() => { }).catch(() => pop.error("Could not contact server, ask the teacher for help."))
            Spell.GRIMOIRE.forEach(x => {
                if (!x.mall.visible) x.button.centerinRect(grim)
            })
        }
        grim.update = () => {
            grim.rad =
                this.myself?.canPullFromGrimoire ?
                    this.fasterSin * 0.1
                    : 0
            grim.txt =
                this.myself?.canPullFromGrimoire ?
                    `\nClick me ${RULES.CLICK_COUNT_TO_ATTACK - grimClickCount} times\n\n\nto pull a spell!\n`
                    : ""
        }
        grim.font_color = "blue"
        grim.isBlocking = true
        grim.bottomat(this.HEIGHT - 100)
        grim.rightat(this.WIDTH - 100)
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
                if (spell.isActive)
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
            const passivesCount = player.passives.length
            if (passivesCount == 0) continue
            const totalWidth = player.passives[0].button.width * passivesCount * 1.2
            const totalHeight = player.passives[0].button.height
            const targetRect = new Rect(0, 0, totalWidth, totalHeight)
            targetRect.centerinRect(player.button)
            targetRect.topat(player.button.bottom + GRAPHICS.PASSIVE_BENEATH_PADDING)
            const whereto = targetRect.splitGrid(1, passivesCount).flat()
            player.passives.forEach((spell, i) => {
                const dx = whereto[i].cx - spell.button.cx
                const dy = whereto[i].cy - spell.button.cy
                if (Math.abs(dx) + Math.abs(dy) < GRAPHICS.SNAP_EPSILON) {
                    spell.button.centerinRect(whereto[i])
                }
                spell.button.move(
                    dx * dt * GRAPHICS.CRAWL_COEFFICIENT,
                    dy * dt * GRAPHICS.CRAWL_COEFFICIENT
                )
            })
            //revitalize timer decreases
            if (this.myself?.sid === 2) this.myself.downedTimeLeft -= dt
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

    prioritize(fighterMallDrawable) {
        this.fighterMall.components =
            MM.putAsLast(fighterMallDrawable, this.fighterMall.components)
    }
    /**@param {Player} player  */
    on_creationOfPlayerInPool(player) {
        this.fighterMall.push(player.createGraphics())
        Button.make_draggable(player.button)
        player.button.topleftat(MM.random(0, this.WIDTH), MM.random(0, this.HEIGHT))
        player.button.fitWithinAnother(this.rect.copy.stretch(.8, .8))
        player.button.isBlocking = true
        player.button.___clickCount = 0
        let hasResetAlready = 0
        player.button.on_click = () => {
            this.prioritize(player.mall)
            if (!this.ui.targeting.isCurrent) return
            player.button.___clickCount++
            if (!hasResetAlready) {
                hasResetAlready = setTimeout(() => {
                    player.button.___clickCount = 0
                    hasResetAlready = 0
                }, 2000)
            }
            if (player.button.___clickCount >= RULES.CLICK_COUNT_TO_ATTACK) {
                clearTimeout(hasResetAlready)
                hasResetAlready = 0
                player.button.___clickCount = 0
                chat.wee("attack", player.nameID)
                    .then(pop.server)
                    .catch(pop.error)
            }
        }
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
                if (p.s != null)
                    player.updateStateInfo(p.s)
                if (p.w != null && player.picID != p.w) {
                    player.picID = p.w
                    player.button.img = IMAGES.wizards[p.w]
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
        //Animations
        this.refreshAnimations()


    }
    /**@type {?Player} */
    myself = null
    refreshAnimations() {
        this.myself ??= Player.pool(this.me,
            x => this.on_creationOfPlayerInPool(x)) //just in case
        //grim button - handled by .update()
        // this.grim.txt =
        // this.myself.canPullFromGrimoire
        // `CLICK HERE TO\nPULL A SPELL\nFROM THE\nGRIMOIRE`
        // this.grim.activeState = this.myself.canPullFromGrimoire
        //cancel fullViewer if spell no longer active for whatever reason
        if ( //only happens if expired i think?
            this.ui.solving.isCurrent &&
            !this.myself.actives.includes(Spell.GRIMOIRE[this.spellIDCurrentlyBeingSolved])
            // && this.myself.sid == 3
        ) {
            this.ui.fighting.setAsCurrent()
        }
        //State handling
        if (this.myself.sid == 1) this.ui.targeting.setAsCurrent()
        else if (this.myself.sid == 2) this.ui.downed.setAsCurrent()
        else if (this.myself.sid == 0) this.ui.spectating.setAsCurrent()
        else if (this.myself.sid == 3 && !this.ui.solving.isCurrent) this.ui.fighting.setAsCurrent()


        //activate the appropriate spells
        const activeSpells = []
        const passiveSpells = []
        for (const player of Player.poolBANK.values()) {
            activeSpells.push(...player.actives)
            passiveSpells.push(...player.passives)
        }

        Spell.GRIMOIRE.forEach(x => x.mall.deactivate())
        activeSpells.forEach(x => {
            x.mall.activate()
            x.isActive = true
            if (!x.isInActiveSize) {
                x.isInActiveSize = true
                x.button.resize(GRAPHICS.SPELL_BUTTON_WIDTH, GRAPHICS.SPELL_BUTTON_HEIGHT)
                x.button.radius = GRAPHICS.SPELL_BUTTON_RADIUS

            }
        })
        passiveSpells.forEach(x => {
            x.mall.activate()
            x.isActive = false
            if (x.isInActiveSize) {
                x.button.stretch(GRAPHICS.PASSIVE_SCALE_FACTOR, GRAPHICS.PASSIVE_SCALE_FACTOR)
                x.button.radius *= GRAPHICS.PASSIVE_SCALE_FACTOR
                x.isInActiveSize = false
            }
        }) //not sure about this, we'll see

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
        this.solverMall.interactable = false
        this.animator.add_anim(Anim.custom(this.fullViewer,
            GRAPHICS.ANIM_FADE_TIME, (t) => {
                this.fullViewer.putOver(Anim.interpolRect(
                    spell.button, this.fullViewerRectCopy, t
                ))
            },
            "x y width height",
            {
                ditch: true,
                on_end: () => this.solverMall.interactable = true
            }
        ))


    }

    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
