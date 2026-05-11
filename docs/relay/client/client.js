const personData = {
    name: "UNNAMED",
    get nameID() { return chat.nameID ?? (chat._acquireNameID(), chat.nameID) },
    playerID: -1,
    locaID: -1,
    teamID: -1,
    teamColor: null,//str
    teamName: null,//str
    /**@type {number[]} */
    teamWealth: [],//num[]
}

class Game extends GameShared {
    //#region initialize_more

    hasFinishedLoading = false
    async enter() {
        wDiv.show()
        wDiv.addLine("Connecting...")
        await chat.asapPromise()
        chat.initLibrary("client")
        this.initChat()
        wDiv.add("Entering...")
        const enterResponse = await chat.wee("enter", personData)
        wDiv.add("Server response: OK\n")
        wDiv.hide()
        console.log(enterResponse)
        Object.assign(personData, enterResponse)
        enterResponse.RULES && Object.assign(RULES, enterResponse.RULES)
        await this.enterOrTravelToLoca(pool.getLoca(personData.locaID))

        this.BGCOLOR = null
        this.feed = new FeedBasic(this.rect.copy.move(0, GRAPHICS.FEED_MARGIN),
            { height: GRAPHICS.FEED_HEIGHT, width: GRAPHICS.FEED_WIDTH, x: GRAPHICS.FEED_MARGIN }
        )
        this.add_drawable(this.feed, 8)

        this.loadUI()

        if (RULES.DEBUG_MODE) this.debugMode()
        this.hasFinishedLoading = true
        return
    }

    initialize_more() {
        wDiv.addLine(`All files loaded in ${wDiv.timePassed()} seconds\n`)
        this.onboardingProcess()
    }
    //#endregion
    //#region loadUI
    loadUI() {
        const corner = this.corner = new Button({
            x: 20,
            width: GRAPHICS.LEFT * GRAPHICS.CORNER_WIDTH_COEFF - 20, height: GRAPHICS.LEFT * GRAPHICS.CORNER_HEIGHT_COEFF,
            color: personData.teamColor,
            opacity: 0.6,
        })
        // corner.on_enter = () => corner.opacity = 0; corner.on_leave = () => corner.opacity = 0.5
        corner.bottomat(this.HEIGHT - 20)
        corner.dynamicText = () => MM.tableStr(
            personData.teamWealth.map((x, i) => [Team.resourceNames[i], x]))
        corner.font_font = "myMonospace"
        corner.fontSize = 20
        corner.textSettings = {
            textBaseline: "top", textAlign: "left", opacity: 0,
            color: GRAPHICS.CORNER_FONT_COLOR,
        }
        this.add_drawable(corner, 7)

        const header = this.header = new Button({
            x: 0, y: 0, width: this.WIDTH, height: GRAPHICS.FEED_MARGIN,
            color: personData.teamColor,//GRAPHICS.NEUTRAL_BUTTON_BG_COLOR
        })
        header.dynamicText = () => [
            `name: ${personData.name}`,
            `connection: ${chat.isConnected ? "ok" : "DISCONNECTED!!!"}`,
            `chat.name: ${chat.name}`,
            `nameID: ${personData.nameID}`,
            `playerID: ${personData.playerID}`,
            `teamID: ${personData.teamID}`,
            `team: ${personData.teamName}`,
            `locaID: ${personData.locaID}`,
            `loca: ${this.loca.name}`

        ].join(",   ")
        this.add_drawable(header, 7)
    }
    //#endregion
    //#region enter/travel
    /**@param {Loca} loca  */
    async enterOrTravelToLoca(loca) {
        if (this.loca && (loca !== this.loca)) {
            //just reload..... might fix later if i feel like i really must
            chat.delayedReload()
            /*pool.locas.delete(this.loca)
            this.remove_drawable(this.loca)
            if (this.me) {
                this.me.loca = loca
                loca.players.push(this.me) //fucked up
            }
            if (this.overworld) {
                Object.assign(loca.screenRect, this.loca.screenRect.copy)
            }*/
        }
        this.loca = loca
        this.initPlayer(personData.playerID, personData.name) //gives this.me
        await this.loca.bgReadyPromise
        this.initInteractables()

        this.add_drawable(this.loca, 1)
        const stars = this.starsDrawable = this.getStars()
        this.add_drawable(stars, 0)
        stars.update = () => {
            stars.offsetX = stars.baseOffsetX - this.loca.worldRect.cx / 20
            stars.offsetY = stars.baseOffsetY - this.loca.worldRect.cy / 20
        }
        return
    }
    //#endregion
    async onboardingProcess() {
        const storedPersonData = localStorage.getItem("personData")
        if (!storedPersonData) {
            wDiv.addLine("Retrieving rules from server...")
            await chat.asapPromise()
            await chat.wee("rules", undefined, { retries: 10, interval: 2000 })
                .then(r => Object.assign(RULES, r))
                .catch(() => {
                    wDiv.error("Failed to contact server.")
                })
            wDiv.hide()
            await this.welcomeSelect()
            await this.nameSelect()
            await this.teamSelect()
            const { nameID, ...saveData } = personData //nameID shall not be saved here
            localStorage.setItem("personData", JSON.stringify(saveData))
        } else {
            Object.assign(personData, JSON.parse(storedPersonData))
            chat.forceName(personData.name, true)
        }
        this.enter()
    }

    async welcomeSelect() {
        const nameIDtimestamp = localStorage.getItem("nameIDtimestamp")
        const currentID = localStorage.getItem("nameID")
        if (!nameIDtimestamp || (Date.now() - nameIDtimestamp > 6 * 60 * 60 * 1000)) {//6 hours
            localStorage.clear()
            chat.nameID = currentID
            chat._acquireNameID()
        }
        const prom = new Promise(resolve => {
            const buts = Array(4).fill().map((_, i) => new Button({
                width: 600, height: 300, txt: "Click me!", visible: i == 0, on_release:
                    function () {
                        MM.toggleFullscreen(true)
                        this.visible = false
                        if (i == 3) {
                            game.remove_drawables_batch(buts)
                            resolve()
                        } else { buts[i + 1].visible = true }
                    }
            }))
            buts[0].topleftatV(this.rect.topleft)
            buts[1].topat(0)
            buts[1].rightat(this.rect.right)
            buts[2].rightat(this.rect.right)
            buts[2].bottomat(this.rect.bottom)
            buts[3].leftat(0)
            buts[3].bottomat(this.rect.bottom)

            if (RULES.SKIP_INTRO) resolve()
            else { this.add_drawable(buts) }
        })
        await prom
    }

    async nameSelect() {
        const fm = new Panel()
        fm.push(Button.fromRect(this.rect, { isBlocking: true, transparent: true }))
        this.add_drawable(fm)
        const lab = new Button({ x: 0, y: 0, width: this.rect.width, height: 200, txt: "Your name:" })
        fm.push(lab)
        const students = RULES.STUDENTS
        if (!students || !students.length) throw new Error("Game did not start yet (no student list available.)")
        const sq = Math.ceil(Math.sqrt(students.length))
        const buts = this.rect.copy.stretch(1, .8).bottomat(this.rect.bottom)
            .splitGrid(sq, sq).flat().slice(0, students.length)
            .map(x => Button.fromRect(x))
            .map(x => x.stretch(.9, .9))
        let canClick = true
        await new Promise(resolve =>
            buts.forEach((x, i) => {
                fm.push(x)
                x.fontSize = 40
                x.txt = students[i]
                x.tag = students[i]
                x.on_release = () => {
                    if (!canClick) return
                    canClick = false
                    const cb = GameEffects.confirmBox(`Are you really ${students[i]}?`)
                    cb.promise().then(() => {
                        personData.name = x.tag
                        chat.forceName(personData.name, true)
                        personData.playerID = i
                        this.remove_drawable(fm)
                        resolve()
                    }).catch(() => canClick = true)
                }
            })
        )
    }

    async teamSelect() {
        const fm = new Panel()
        fm.push(Button.fromRect(this.rect, { isBlocking: true, transparent: true }))
        this.add_drawable(fm)
        const lab = new Button({ x: 0, y: 0, width: this.rect.width, height: 200, txt: "Your team:" })
        fm.push(lab)
        const sq = Math.ceil(Math.sqrt(RULES.NUMBER_OF_TEAMS))
        const buts = this.rect.copy.stretch(1, .8).bottomat(this.rect.bottom)
            .splitGrid(sq, sq).flat().slice(0, RULES.NUMBER_OF_TEAMS)
            .map(x => Button.fromRect(x))
            .map(x => x.stretch(.9, .9))
        let canClick = true
        await new Promise(resolve =>
            buts.forEach((x, i) => {
                fm.push(x)
                x.fontSize = 40
                x.txt = Team.ALL[i].name
                x.tag = Team.ALL[i].name
                x.color = Team.ALL[i].color
                x.on_release = () => {
                    if (!canClick) return
                    canClick = false
                    const cb = GameEffects.confirmBox(`Joining team ${x.txt}?`, {
                        buttonColor: x.color, yesColor: "white", noColor: "white"
                    })
                    cb.promise().then(() => {
                        personData.teamID = i
                        personData.teamName = x.tag
                        personData.teamColor = x.color
                        this.remove_drawable(fm)
                        resolve()
                    }).catch(() => canClick = true)
                }
            })
        )
    }

    getStars() {
        const s = GameEffects.getStarDrawable({
            width: GRAPHICS.STARS_DIMENSIONS[0],
            height: GRAPHICS.STARS_DIMENSIONS[1],
            starCount: GRAPHICS.STARS_COUNT,
        })
        s.baseOffsetX = GRAPHICS.STARS_BASE_OFFSET[0]
        s.baseOffsetY = GRAPHICS.STARS_BASE_OFFSET[1]
        return s
    }
    //#region overworld
    /**@type {GameWorld} */
    overworld = null
    canChangeOverWorldState = true
    seeOverworld(allowTravel = true) {
        if (this.overworld || !this.canChangeOverWorldState) return
        if (!this.galaxyLocaIDs || !this.galaxyLocaIDs.length) return
        this.canChangeOverWorldState = false
        const overworld = this.overworld = new GameWorld(this.rect)
        this.add_drawable(overworld)
        const targetplace = Loca.PRESETS[this.loca.id]
        const origplace = this.loca.screenRect.copy
        this.freezeInteractables()
        /**@type {Array<Button&{name:string,locaID:number,fromfile:string}>} */
        const locabuttons = overworld.locabuttons =
            this.galaxyLocaIDs.map(i =>
                new Button({ ...Loca.PRESETS[i], opacity: 1, txt: Loca.PRESETS[i].name, locaID: i }))
        overworld.add_drawable(locabuttons)
        GRAPHICS.STARS_HIDE_ON_OVERWORLD && (this.starsDrawable.visibleStars = false)
        const zoomOutFromLocaToOverWorld = Anim.custom(
            null, GRAPHICS.OVERWORLD_TRANSITION_TIME, t => {
                Object.assign(this.loca.screenRect, Anim.interpolRect(origplace, targetplace,
                    Anim.l.sqrt(t)))
                locabuttons.forEach(x => x.opacity = 1 - t)
                circleDrawable.opacity = 1 - t
                if (GRAPHICS.STARS_ANIMATE_ON_OVERWORLD)
                    null
            }, "", {
            on_end: () => {
                locabuttons.forEach(x => x.opacity = 0)
                circleDrawable.opacity = 0
                this.remove_drawable(this.loca)
                this.canChangeOverWorldState = true
                addLocaButtonInteractions()
            }
        })

        this.animator.add_anim(zoomOutFromLocaToOverWorld)

        const whereAmICurrently = locabuttons.find(x => x.locaID === this.loca.id)
        // whereAmICurrently.color = personData.teamColor
        const circleDrawable = {
            opacity: 1,
            draw(ctx) {
                MM.drawEllipse(ctx,
                    whereAmICurrently.centerX, whereAmICurrently.centerY,
                    whereAmICurrently.width * .7, whereAmICurrently.height * .7,
                    { color: null, outline_color: personData.teamColor, outline: 5, opacity: this.opacity })
            }
        }
        this.overworld.add_drawable(circleDrawable)
        this.overworld.circleDrawable = circleDrawable
        const addLocaButtonFlair = () => {
            RULES.HOMEBASES.forEach((id, i) => {
                locabuttons.find(x => x.locaID === id).color = Team.ALL[i].color
            })
        }
        addLocaButtonFlair()

        const addLocaButtonInteractions = () => {
            let latestMenu
            locabuttons.forEach(x => {
                x.on_release = () => {
                    latestMenu?.close()
                    latestMenu =
                        allowTravel
                            ?
                            GameEffects.dropDownMenu([
                                [`Travel to ${x.name}`, () => this.tryTravelTo(x.locaID)]
                            ], null, null, null, { width: 400, color: GRAPHICS.NEUTRAL_DROPDOWNMENU_COLOR })
                            : this.psr("Go to the Space Shuttle to TRAVEL.")
                }
            })
            whereAmICurrently.on_release = () => {
                latestMenu?.close()
                this.unseeOverworld()
            }
        }


    }
    unseeOverworld() {
        if (!this.overworld || !this.canChangeOverWorldState) return
        this.canChangeOverWorldState = false
        const overworld = this.overworld
        const locabuttons = this.overworld.locabuttons
        const origplace = this.loca.screenRect.copy
        const targetplace = this.rect.copy
        this.add_drawable(this.loca)

        const zoomInFromOverworldToLoca = Anim.custom(
            null, GRAPHICS.OVERWORLD_TRANSITION_TIME, t => {
                Object.assign(this.loca.screenRect, Anim.interpolRect(origplace, targetplace, t))
                locabuttons.forEach(x => x.opacity = t)
                overworld.circleDrawable.opacity = t
                if (GRAPHICS.STARS_ANIMATE_ON_OVERWORLD)
                    null
            }, "", {
            on_end: () => {
                this.remove_drawable(overworld)
                Object.assign(this.loca.screenRect, this.rect.copy)
                this.unfreezeInteractables()
                GRAPHICS.STARS_HIDE_ON_OVERWORLD && (this.starsDrawable.visibleStars = true)
                this.canChangeOverWorldState = true
            }
        }
        )
        this.overworld = null
        this.animator.add_anim(zoomInFromOverworldToLoca)
    }
    //#endregion

    //#region showUpgradesGuide
    showUpgradesGuide() {
        GameEffects.popup("Guide on updates goes here.", {
            close_on_release: true, floatTime: 5000
        }, GameEffects.popupPRESETS.megaBlue)
    }
    //#endregion
    //#region BROADCAST_RECEIVE
    galaxyLocaIDs = []
    latestBroadcastDetails = { data: [], time: 0, interactables: [] }
    /**@param {Broadcast} broadcastData  */
    BROADCAST_RECEIVE(broadcastData) {
        this.latestBroadcastDetails.data = broadcastData
        this.latestBroadcastDetails.time = Date.now()
        const myLoca = this.loca
        if (!myLoca) return
        for (const item of broadcastData) {
            if (item.l != null) {//manage locas
                if (item.l !== myLoca.id) continue
                for (const [playerID, i, j] of item.p) {
                    pool.getPlayer(playerID, myLoca).drift = [i, j]
                }
                myLoca.terminals.forEach(x => x.active = true) //client has active by default
                for (const tID of item.i) {
                    pool.getTerminalShallow(tID).active = false
                }
                for (const term of this.qpanes.keys()) {
                    if (term.active) this.destroyQPaneOfTerminal(term)
                }
                this.latestBroadcastDetails.interactables = item.i

            } else if (item.t != null) {//manage teams
                if (item.t !== personData.teamID) continue
                personData.teamWealth = item.r
                if (personData.teamWealth.slice(4).every(x => x == 0))
                    personData.teamWealth = personData.teamWealth.slice(0, 4)
            }
        }
        this.galaxyLocaIDs = broadcastData.map(x => x.l).filter(x => x != null)
    }
    //#endregion


    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {
        this.dtSin = Math.sin(this.dtTotal / 90) * 0.2

        if (!this.hasFinishedLoading) return






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

    debugButton = null
    debugMode() {
        if (this.debugButton) return
        const debugButton = this.debugButton = Button.fromRect(this.rect.splitCell(1, -1, 15, 15))
        debugButton.isBlocking = true
        debugButton.txt = "DEBUG"
        debugButton.on_release =
            GameEffects.dropDownDebugFunctionsFromAnObject(dev, true)

        this.add_drawable(debugButton, 7)
        this.isInDebugMode = true
        this.framerate.isRunning = true
    }
    debugModeEnd() {
        this.remove_drawable(this.debugButton)
        this.debugButton = null
    }


    //#region ptc psr pinfo perr
    ptc(txt, teamID) { //Popup Team Color
        GameEffects.popup(txt, {
            posFrac: [.5, .925], sizeFrac: [.45, .1],
            floatTime: 2000,
            moreButtonSettings:
                { color: teamID != undefined ? Team.ALL[teamID].color : personData.teamColor }
        })
    }
    psr(txt) { //Popup Server Response
        GameEffects.popup(txt, {
            floatTime: 2000, posFrac: [.5, .8],
            moreButtonSettings: { color: GRAPHICS.POPUP_SERVER_RESPONSE_COLOR }
        })
    }
    pinfo(txt) {
        GameEffects.popup(txt, { moreButtonSettings: { color: GRAPHICS.NEUTRAL_BUTTON_BG_COLOR } })
    }
    perr(txt) {
        GameEffects.popup(txt, {
            posFrac: [.725, .825], sizeFrac: [.525, .325],
            floatTime: 5000,
            moreButtonSettings:
                { color: "red" }
        })
    }
    //#endregion
    //#region tryTravelTo
    tryTravelTo(locaID) {
        chat.wee("travel", locaID)
            .catch(() => {
                this.badness("travel")
            })
            .then((response) => {
                this.psr(response.deny || response.accept)
                if (response.accept) {
                    this.enterOrTravelToLoca(pool.getLoca(locaID))
                }
                this.goodness("travel")
            })
    }
    //#endregion
    //#region qpanes
    /**@type {Map<Terminal, Malleable>} */
    qpanes = new Map()
    /**@param {Terminal} terminal  */
    openQPane(terminal) {
        if (this.qpanes.has(terminal)) {
            this.qpanes.get(terminal).activate()
            this.freezeInteractables()
            return
        }
        if (terminal.question == null) return //throw new Error("openQPane but no terminal.question")
        const p = new Malleable()
        this.qpanes.set(terminal, p)
        const questionButton = new Button({ color: GRAPHICS.NEUTRAL_BUTTON_BG_COLOR })
        questionButton.leftat(GRAPHICS.LEFT)
        questionButton.rightstretchat(this.WIDTH - GRAPHICS.RIGHT)
        questionButton.topat(GRAPHICS.TOP)
        questionButton.bottomstretchat(this.HEIGHT - GRAPHICS.BOTTOM - GRAPHICS.ANSWER_AREA_HEIGHT)
        questionButton.img = this.cropper.load_img(RULES.QUESTION_FOLDER + terminal.question.img + ".png")

        const revealer = new Button({ width: 160, height: 60, color: "lightgray" })
        revealer.rightat(questionButton.right)
        revealer.topat(questionButton.top)
        revealer.txt = `Q${terminal.question.id}`

        const bottomBGArea = Button.fromRectShallow(questionButton)
        bottomBGArea.height = GRAPHICS.ANSWER_AREA_HEIGHT
        bottomBGArea.topat(questionButton.bottom)
        const bottomButtons = bottomBGArea.splitCol(2, 4, 2, 3)
            .map(x => Button.fromRect(x, { color: GRAPHICS.NEUTRAL_BUTTON_BG_COLOR, fontSize: 36 }))
        const [botYourAns, botAnswerSpace, botSubmit, botInfo] = bottomButtons
        // bottomButtons.unshift(bottomBGArea)
        botYourAns.txt = "Your answer:"
        botAnswerSpace.color = personData.teamColor
        botAnswerSpace.fontSize = 60
        // botAnswerSpace.font_font = "myMonospace"
        botSubmit.color = personData.teamColor
        botSubmit.txt = "Submit"
        // Button.make_roundedRect(botSubmit)
        botInfo.txt = "Info goes here"

        const calculatorBGArea = new Rect()
        calculatorBGArea.leftat(questionButton.right)
        calculatorBGArea.rightstretchat(this.WIDTH)
        calculatorBGArea.deflate(10, 10)
        calculatorBGArea.height = calculatorBGArea.width * 2
        calculatorBGArea.centeratY(Anim.interpol(questionButton.top, questionButton.bottom, .5))
        const calculatorButtons = calculatorBGArea.splitGrid(5, 3).flat()
            .map(x => Button.fromRect(x, {
                color: personData.teamColor,
                fontSize: 40,
                // font_font: "myMonospace"
            }))
            .map(x => x.shrinkToSquare().stretch(.95, .95))
        const ans = botAnswerSpace
        ans.txt = ""
        const sendFancy = (b) => GameEffects.sendFancy(b, botAnswerSpace, 500)
        calculatorButtons.forEach((x, i) => {
            if (i < 9) {
                x.txt = i + 1
                x.on_click = () => {
                    ans.txt += "" + (i + 1); sendFancy(x)
                }
            } else if (i == 9) {
                x.txt = "+/-"
                x.on_click = () => {
                    ans.txt = ans.txt?.[0] === "-" ? ans.txt.slice(1) : "-" + ans.txt; sendFancy(x)
                }
            }
            else if (i == 10) {
                x.txt = "0"
                x.on_click = () => {
                    ans.txt += "" + "0"; sendFancy(x)
                }
            }
            else if (i == 11) {
                x.txt = "."
                x.on_click = () => {
                    ans.txt = ans.txt.replace(".", "") + "."; sendFancy(x)
                }
            }
            else if (i == 12) {
                x.txt = "Del"
                x.on_click = () => {
                    ans.txt = ""; sendFancy(x)
                }
            } else if (i == 13) {
                x.stretch(3, 1)
                x.move(0, calculatorButtons[4].y - calculatorButtons[0].y)
                x.color = "lightgray"
                x.txt = "Back to game"
                x.on_release = () => { this.closeQPane() }
            }
        })


        const submit = botSubmit
        submit.on_release = () => {
            if (ans.txt === "" || ans.txt == null) return
            const attempt = +ans.txt
            if (!Number.isFinite(attempt)) throw new Error("Somehow the number is invalid???")
            ans.txt = ""
            submit.txt = "Waiting..."
            submit.interactable = false
            const cleanup = () => {
                submit.txt = "Submit"
                submit.interactable = true
            }
            terminal.question.attemptClient(terminal, attempt)
                .catch(() => {
                    this.badness("attempt")
                    cleanup()
                })
                .then((info) => {
                    this.goodness("attempt")
                    cleanup()
                    if (info.exists === false) {
                        this.psr("This question does not exist??? Talk to your teacher.")
                        terminal.activateRefreshClient() //resets the prompt to REPAIR etc
                    } else if (info.notyet === false) {
                        this.psr("Someone else solved that question already.\nDo something else.")
                        terminal.activateRefreshClient() //resets the prompt to REPAIR etc
                    }
                    else if (info.correct) {
                        this.psr("Correct!")
                        this.destroyQPaneOfTerminal(terminal)
                        terminal.activateRefreshClient() //resets the prompt to REPAIR etc
                    }
                    else {
                        this.psr(`Your answer of ${attempt} is incorrect.`)
                    }
                })

        }


        p.push(questionButton, revealer, ...calculatorButtons, ...bottomButtons)
        // p.isBlocking = true
        // p.forEach(x => x.isBlocking = true)
        this.freezeInteractables(true)
        this.add_drawable(p, 7) //just below the popups?
    }

    /**@param {Malleable} qpane*/
    closeQPane(qpane) { //boilerplatey...
        if (qpane === undefined) { this.qpanes.forEach(v => this.closeQPane(v)); return; }
        qpane.deactivate()
        this.unfreezeInteractables()
    }
    /**@param {Terminal} terminal*/
    destroyQPaneOfTerminal(terminal) {
        const pane = this.qpanes.get(terminal)
        if (!pane) return
        this.closeQPane()
        pane.destroy()
        this.qpanes.delete(terminal)
    }
    //#endregion

} //this is the last closing brace for class Game







//#region univ
var univ = {
    isOnline: true, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "auto", //options: "auto", "smooth", "crisp-edges", "pixelated"

    //BROKEN
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    //BROKEN
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: () => {
        window.onerror = (event, source, lineno, colno, error) => {
            if (!location.hash.includes("noerror"))
                wDiv.error(`ERROR: ${event}, source: ${source}, lineno: ${lineno}, colno: ${colno}, error: ${error}`)
        }
        window.onunhandledrejection = (event) => {
            if (!location.hash.includes("noerror"))
                wDiv.error("UNHANDLED: " + (event.reason?.stack || event.reason))
        }
    },
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
/// dev options
const dev = {
    fullscreen: () => MM.toggleFullscreen(true),
    bgSmoothing: () => { GRAPHICS.SMOOTHING_DISABLED_FOR_BG = !GRAPHICS.SMOOTHING_DISABLED_FOR_BG; GameEffects.popup(`Smoothing: ${GRAPHICS.SMOOTHING_DISABLED_FOR_BG}`) },
    owDebug: () => game.overworld ? game.unseeOverworld() : game.seeOverworld(),
    // travelDebug: () => { game.tryTravelTo(+prompt("Enter locaID")) },
    unlockZoom: () => { game.zoomSlider.min = -4; game.zoomSlider.max = 5; game.zoomSlider.value = game.zoomSlider.value },
    // flush: () => { localStorage.clear(); chat.delayedReload() },
    showPingRecord: () => GameEffects.popup(Object.entries(chat.getPingStats()).join("; ") + '\n' + MM.reshape(chat.pingRecord, 30).join("\n"), { floatTime: 5000, close_on_release: true }, GameEffects.popupPRESETS.megaBlue),
    flush: () => { localStorage.clear(); chat.delayedReload() },
    speedHack: () => { GRAPHICS.WADDLE_TIME = 20 },
    hideWDiv: () => { wDiv.hide() },
    removeWDiv: () => { wDiv.remove() },
    endDebugMode: () => { game.debugModeEnd(); game.framerate.isRunning = false; game.remove_drawable(game.framerate.button) },



}/// end of dev
