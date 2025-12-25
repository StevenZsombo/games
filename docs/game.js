var version = "2025.12.24. 13:09"
var univ = {
    isOnline: false,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: false,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "smooth",
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: () => {
        const existing = localStorage.getItem(stgs.localUserSettingsName)
        if (existing) Object.assign(userSettings, JSON.parse(existing))
    },
    on_next_game_once: null,
    on_beforeunload: () => localStorage.setItem(stgs.localUserSettingsName, JSON.stringify(userSettings)),
    allowQuietReload: true
}




class Game extends GameCore {
    //#region more
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                             customize here                                                   ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                                                                                              ///
    ///         these are called  when appropriate                                                                   ///
    ///                                                                                                              ///
    ///         initialize_more                                                                                      ///                                   
    ///         draw_more                                                                                            ///
    ///         update_more                                                                                          ///
    ///         next_loop_more                                                                                       ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                             INITIALIZE                                                       ///
    /// start initialize_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#endregion
    //#region initialize_more
    initialize_more() {
        this.inspector?.reset()
        this.inspector = new Inspector(new Button({
            width: 650,
            height: 120,
            color: "moccasin",
            outline: 3,
            fontSize: 30,
            //textSettings: { textBaseline: "top" }
        }), game)

        if (!userSettings.ALREADY_ASKED_FOR_ONLINE_COLLECTION)
            stgs.stage = pageManager.askForOnlinePermission


        switch (stgs.stage) {
            case pageManager.levelSelector:
                this.levelSelector()
                break;
            case pageManager.tutorialSelector:
                this.tutorialSelector()
                break;
            case pageManager.freeSelector:
                this.freeSelector()
                break;
            case pageManager.askForOnlinePermission:
                this.askForOnlinePermissionsOnce()
                break;
            case pageManager.leaderboardsPage:
                this.leaderboardsShow()
                break;
            case "blank":
                break;

            default:
                this.makeLevel()
                break;
        }






    }


    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {
        if (this.keyboarder.pressed[1]) this.speedButtons?.[1].on_click()
        if (this.keyboarder.pressed[2]) this.speedButtons?.[2].on_click()
        if (this.keyboarder.pressed[3]) this.speedButtons?.[3].on_click()
        if (this.keyboarder.pressed[4]) this.speedButtons?.[4].on_click()
        if (this.keyboarder.pressed[5]) this.speedButtons?.[5].on_click()
        if (this.keyboarder.pressed["r"]) this.reactor?.controlButtons?.[2].on_click()
        if (this.keyboarder.pressed["w"]) this.reactor?.moveAllPieces(-1, 0)
        if (this.keyboarder.pressed["a"]) this.reactor?.moveAllPieces(0, -1)
        if (this.keyboarder.pressed["s"]) this.reactor?.moveAllPieces(1, 0)
        if (this.keyboarder.pressed["d"]) this.reactor?.moveAllPieces(0, 1)
        if (this.keyboarder.pressed["Escape"]) {
            const closeButtons = this.layersFlat.filter(x => x.txt == "Close")
            if (closeButtons.length) {
                closeButtons.forEach(x => (x.on_click?.(), x.on_release?.()))
                return
            }
            if (this.menu) {
                this.dropDownEnd()
                return
            }
            if (this.reactor) this.reactor.controlButtons[0].on_release()
            if (this.tutorialsButton) this.tutorialsButton.on_release()
            if (this.backToMenuButton) this.backToMenuButton.on_release()
        }










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
    //#region makeGridOfLevels
    makeGridOfLevels(levelList) {
        const numberOfLevels = levelList.length
        const sq = Math.ceil(Math.sqrt(numberOfLevels))
        const infoButton = new Button({ width: this.WIDTH })

        const lvlButtons = this.rect.copy.
            stretch(.9, .65).
            topat(200).
            splitGrid(sq, sq).flat().
            slice(0, numberOfLevels).
            map(x => x.stretch(.85, .8)).
            map(Button.fromRect)
        const lvlButtonsBG = new Rect(lvlButtons[0].left, lvlButtons[0].top, 0, 0)
        lvlButtonsBG.bottomstretchat(lvlButtons.at(-1).bottom)
        lvlButtonsBG.rightstretchat(lvlButtons[sq - 1].right)
        const wonAlreadyKeys = Game.keylistLocal()

        lvlButtons.forEach((x, i) => {
            x.txt = levelList[i]
            const wonAlready = wonAlreadyKeys.includes(x.txt)
            if (wonAlready) {
                x.color = "lightgreen"
                x.hover_color = "green"
            }
            else { x.hover_color = "lightblue" }
            x.fontSize = 40
            x.font_font = "consolas"
            x.on_release = () => {
                stgs.stage = levelList[i]
                main()
                try {
                    const data = Game.loadFromLocal(stgs.stage)
                    if (data) {
                        game.reactor.fromJSON(data, false, true)
                        game.reactor.loadedFromSaveData = data
                    }
                }
                catch (error) {
                    console.error("could not load from local storage, oopsies.")
                    console.error(this)
                    console.error(error)
                }
            }

        })
        infoButton.centeratY(lvlButtons[0].top / 2)
        infoButton.transparent = true
        infoButton.txt = "Select level:"
        infoButton.leftat(lvlButtons[0].left)
        infoButton.textSettings = { textAlign: "left" }
        infoButton.width = (lvlButtons[sq - 1].right - lvlButtons[0].left) * .6
        infoButton.fontSize = 40
        const tutorialsButton = Button.fromRect(infoButton.copyRect)
        tutorialsButton.width *= .5
        tutorialsButton.move(tutorialsButton.width * (2 + 1 / 3), 0)
        tutorialsButton.on_release = () => {
            stgs.stage = pageManager.tutorialSelector
            stgs.latestSelectorType = pageManager.tutorialSelector
            main()
        }
        tutorialsButton.hover_color = "lightblue"
        tutorialsButton.txt = "Tutorials"
        tutorialsButton.fontSize = 40
        tutorialsButton.resize(tutorialsButton.width, lvlButtons[0].height)

        this.add_drawable(tutorialsButton)
        this.add_drawable(lvlButtons)
        this.add_drawable(infoButton)
        return { sq, infoButton, lvlButtons, tutorialsButton, lvlButtonsBG }

    }
    //#endregion
    //#region levelSelector
    levelSelector() {
        const { sq, infoButton, lvlButtons, tutorialsButton, lvlButtonsBG } =
            this.makeGridOfLevels(Object.keys(window.levels))

        lvlButtons.forEach(x => {
            x.spread(this.rect.centerX, this.rect.centerY, 1.1, 1.1)
            x.stretch(1.1, 1.1)
            x.fontSize = 36
        })


        const manualButton = infoButton.copy
        manualButton.textSettings = {}
        manualButton.transparent = false
        manualButton.fontSize = 40
        manualButton.txt = "Manual"
        manualButton.on_release = () => {
            window.open("Manual.pdf")
        }
        manualButton.hover_color = "yellow"

        const optionsButton = manualButton.copy
        optionsButton.hover_color = "pink"
        optionsButton.txt = "Options"
        optionsButton.on_release = () => {
            const arr = [
                [`Bigger buttons: ${userSettings.biggerButtons ? "ON" : "OFF"}`, () => userSettings.biggerButtons ^= 1, "Recommended for small screen devices."],
                [`IN works without OUT: ${Reactor.SERVE_IN_EVEN_IF_NO_OUT ? "ON" : "OFF"}`, () => Reactor.SERVE_IN_EVEN_IF_NO_OUT ^= 1, "Whether or not IN should push \nnew inputs even if there is no OUT module."],
                [`Tooltips on hover: ${userSettings.hoverTooltips ? "ON" : "OFF"} `, () => userSettings.hoverTooltips ^= 1, "Whether these tooltip boxes should pop up\nwhen hovering over modules."],
                [`Developer mode: ${userSettings.isDeveloper ? "ON" : "OFF"}`, () => userSettings.isDeveloper ^= 1, "Allows to unlock gamespeed restrictions\nor generate extra sheets."],
                [`Online data collection: ${userSettings.ALLOW_ONLINE_COLLECTION ? "ON" : "OFF"}`, () => { userSettings.ALREADY_ASKED_FOR_ONLINE_COLLECTION = false; main(); }, "Click here to reset."],
                ["Statistics", Game.statistics],
                ["Read changelog", () => window.open("Changelog.txt")]
            ]

            const obj = Object.fromEntries(arr.map(x => [x[0], x[1]]))
            const optionsMenu = GameEffects.dropDownMenu(
                obj,
                null, null, null,
                {
                    height: userSettings.biggerButtons ? 140 : 80,
                    width: 400
                },
                [optionsButton], true, () => this.inspector.reset()
            )

            arr.forEach(([a, b, c], i) => {
                if (c) this.inspector.addChild(optionsMenu.menu[i], c)
            })
        }
        const freeButton = tutorialsButton.copy
        freeButton.on_release = () => {
            stgs.stage = pageManager.freeSelector
            stgs.latestSelectorType = pageManager.freeSelector
            main()
        }
        freeButton.txt = "Free play & prototypes"

        const leaderboardsButton = tutorialsButton.copy
        leaderboardsButton.txt = "Leaderboards"
        leaderboardsButton.on_release = () => {
            stgs.stage = pageManager.leaderboardsPage
            stgs.latestSelectorType = pageManager.levelSelector
            main()
        }

        const bottomButtonsBG = infoButton.copy
        bottomButtonsBG.leftat(lvlButtons[0].left)
        bottomButtonsBG.rightstretchat(lvlButtons[sq - 1].right)
        bottomButtonsBG.centeratY((lvlButtonsBG.bottom + this.HEIGHT) / 2)
        Rect.packArray(
            [optionsButton, freeButton, leaderboardsButton, manualButton],
            bottomButtonsBG.splitCol(.6, .1, 1, .1, .7, .1, .4)
                .filter((_, i) => [0, 2, 4, 6].includes(i)), true
        )
        this.add_drawable([optionsButton, freeButton, leaderboardsButton, manualButton])


    }
    //#endregion
    //#region tutorialSelector
    tutorialSelector() {
        const { sq, infoButton, lvlButtons, tutorialsButton, lvlButtonsBG } = this.makeGridOfLevels(Object.keys(window.tutorialLevels))
        tutorialsButton.on_release = () => {
            stgs.stage = pageManager.levelSelector
            stgs.latestSelectorType = pageManager.levelSelector
            main()
        }
        tutorialsButton.txt = "Back to puzzles"
        tutorialsButton.resize(500, 100)
        infoButton.txt = "Select tutorial:"
        this.tutorialsButton = tutorialsButton
    }
    //#endregion
    //#region freeSelector
    freeSelector() {
        const { sq, infoButton, lvlButtons, tutorialsButton, lvlButtonsBG } =
            this.makeGridOfLevels(Object.keys(window.freeLevels))
        tutorialsButton.on_release = () => {
            stgs.stage = pageManager.levelSelector
            stgs.latestSelectorType = pageManager.levelSelector
            main()
        }
        tutorialsButton.txt = "Back to puzzles"
        tutorialsButton.resize(500, 100)
        infoButton.txt = "Free play (choose input type):"
        lvlButtons.forEach(x => {
            x.spread(this.WIDTH / 2, this.HEIGHT, 1, 0.5)
            x.move(0, -450)
            x.stretch(1, .5)
            x.color = "lightgray"
        })
        const lowerInfoButton = infoButton.copy
        lowerInfoButton.txt = "Untested prototypes:"
        const { lvlButtons: proButtons, tutorialsButton: tut2, infoButton: inf2 } = this.makeGridOfLevels(Object.keys(prototypeLevels))
        game.remove_drawable(tut2)
        game.remove_drawable(inf2)
        proButtons.forEach(x => {
            x.spread(this.WIDTH / 2, 0, 1.1, .6)
            x.stretch(1, .5)
            x.move(0, 500)
            x.color = x.color.includes("green") ? x.color : "lightgray"
        })
        lowerInfoButton.bottomat(proButtons[0].top)
        lowerInfoButton.leftat(proButtons[0].left)
        this.add_drawable(lowerInfoButton)
        this.tutorialsButton = tutorialsButton
    }
    //#endregion


    //#region makeLevel
    testLevel(level) {
        stgs.stage = "blank"
        main()
        game.makeLevel(level)
    }
    /**@param {Level} level  */
    makeLevel(level) {
        if (!level || typeof level === "string")
            level =
                levels[stgs.stage]
                ?? tutorialLevels[stgs.stage]
                ?? freeLevels[stgs.stage]
                ?? prototypeLevels[stgs.stage]
        if (!level) throw "Requested level does not exist."

        const reactor = new Reactor(this, level.conditions.rows ?? 6, level.conditions.cols ?? 6, 210, 150)
        this.add_drawable(reactor)
        this.reactor = reactor
        window.r = reactor
        reactor.start()//remove later

        const speedButtonsBG = new Rect(0, 0, 600, 60)
        speedButtonsBG.bottomat(reactor.buttonsMatrix.at(-1).at(-1).bottom)
        speedButtonsBG.rightat(this.WIDTH - 20)
        const speedButtons = speedButtonsBG.splitCol(15, 10, 10, 10, 10, 10).map(Button.fromRect)
        speedButtons.forEach((b, i) => {
            b.txt = ["Speed:", "PAUSE", ".25x", "1x", "2x", "8x"][i]
            if (i == 0) {
                b.transparent = true
                return
            }
            b.on_click = () => {
                this.animator.speedMultiplier = [null, 0, .25, 1, 2, 8][i]
            }
        })
        Button.make_radio(speedButtons.slice(1), true)
        speedButtons[3].on_click()
        //speedButtons[1].on_click()
        this.speedButtons = speedButtons
        this.add_drawable(speedButtons)
        reactor.loadLevel(level)


        //THIS IS NOT GREAT IM AFRAID

        this.isDragging = false
        this.currentDraggingList = []
        this.dragLastPos = null
        this.lastHit = null
        this.firstHit = null
        this.targetHit = null
        const overlay = Button.fromRect(game.rect)
        overlay.visible = false
        overlay.clickable = true
        overlay.isBlocking = false
        this.add_drawable(overlay, 7)
        this.overlay = overlay

        this.ALLOW_DRAGGING_MOVINGPIECES = true

        overlay.on_click = () => {
            if (this.menu) {
                this.dropDownEnd()
            }
            const hit = this.seekButton()
            if (!hit) {
                this.dragLastPos = null
                return
            }
            this.firstHit = hit
            this.firstHitChanged = false
            this.lastHit = hit
            this.ghosts = []
            this.currentDraggingList = reactor.findPiecesAt(...hit.tag)
            if (!this.ALLOW_DRAGGING_MOVINGPIECES) this.currentDraggingList = this.currentDraggingList.filter(x => !Reactor.isMovementType(x))
            this.dragLastPos = this.mouser.pos
            hit.color = "fuchsia"

        }

        overlay.on_release = () => {
            this.ghosts && this.remove_drawables_batch(...this.ghosts)
            if (this.lastHit) this.lastHit.color = "white"
            if (!this.firstHit) return
            const hit = this.seekButton()
            if (!hit) {
                this.firstHit = null
                return
            }
            const targetsList = this.reactor.findPiecesAt(...hit.tag)
            if (!this.ALLOW_DRAGGING_MOVINGPIECES) this.currentDraggingList = this.currentDraggingList.filter(x => !Reactor.isMovementType(x))
            if (!this.lastHit) throw "lastHit is missing, how could i be releasing validly?"
            let didNotDrag = true
            this.currentDraggingList.forEach(x => {
                x.x = this.lastHit.tag[0]
                x.y = this.lastHit.tag[1]
                this.reactor.refreshButtons(x)
                didNotDrag = false
            })
            this.currentDraggingList.length = 0
            targetsList.forEach(x => {
                x.x = this.firstHit.tag[0]
                x.y = this.firstHit.tag[1]
                this.reactor.refreshButtons(x)
            })
            this.lastHit = null
            this.firstHit = null
            if (this.firstHitChanged && (Date.now() - this.mouser.lastClickedTime > 100)) {
                return
            }
            if (hit) {
                this.dropDown(hit)
                this.lastHit = hit
            } else {
                this.dropDownEnd()
            }
        }

        overlay.on_drag = () => {
            if (!this.dragLastPos) return
            const hit = this.seekButton()
            if (hit !== this.firstHit) this.firstHitChanged = true
            if (this.lastHit) this.lastHit.color = "white"
            this.lastHit = hit
            this.ghosts && this.remove_drawables_batch(...this.ghosts)
            if (!hit) {
                this.currentDraggingList.forEach(x =>
                    this.reactor.removePiece(x)
                )
                this.currentDraggingList.length = 0
                this.lastHit = null
                this.firstHit = null
                this.firstHitChanged = true
                this.dragLastPos = null
                return
            }
            let targetsList = this.reactor.findPiecesAt(...hit.tag)
            if (!this.ALLOW_DRAGGING_MOVINGPIECES) targetsList = targetsList.filter(x => !Reactor.isMovementType(x))

            if (hit && this.firstHit !== hit) {
                this.ghosts = targetsList.map(x => x.button.copy)
                this.ghosts.forEach(x => {
                    x.opacity = .5
                    x.centerinRect(this.firstHit)
                })
                this.add_drawable(this.ghosts)
            }
            hit.color = "fuchsia"
            this.currentDraggingList.forEach(x => {
                x.button.centeratV(this.mouser.pos)
            })
            this.dragLastPos = this.mouser.pos
        }

    }
    //#endregion
    //#region dropDown
    seekButton() {
        if (!this.reactor) return
        return this.reactor.buttonsMatrix.flat().find(p => p.collidepoint(this.mouser.pos.x, this.mouser.pos.y))
    }

    dropDownEnd() {
        this.remove_drawables_batch(this.menu)
        this.menu = null
        this.reactor.buttonsMatrix.flat().forEach(x => x.color = "white")
        this.inspector.reset()
    }

    dropDown(button, cols = 2) {
        if (this.menu) {
            this.dropDownEnd()
        }
        if (!button) throw "No button was given for dropDown"
        const reactor = this.reactor
        button.color = "fuchsia"
        const availableTools = reactor.level.conditions.toolsRestrictedTo
            ? Object.keys(Reactor.t).filter(x => reactor.level.conditions.toolsRestrictedTo.includes(x))
            : Object.keys(Reactor.t)
        const menu = availableTools.map((x, i) => new Button({
            txt: x,
            type: x,
            color: Reactor.isMovementType(x) ? "plum" : "pink",
            on_click: () => {
                reactor.addPiece(...button.tag, x)
                this.mouser.blockNextRelease()
                this.dropDownEnd()
            },
            hover_color: "fuchsia",
            isBlocking: true
        }))
        menu.forEach((x, i) => x.move(0, i * x.height))
        /*const del = menu[0].copy
        del.on_release = () => reactor.removePiecesAt(...button.tag)
        //del.move(0, menu.at(-1).height)
        del.txt = "Delete this"
        menu.push(del)
        const delAll = menu[0].copy
        delAll.on_release = () => reactor.pieces.forEach(x => reactor.removePiece(x))
        delAll.txt = "Delete all"
        menu.push(delAll)*/
        //for del + delAll replace the zero below
        const boxheight = (0 + availableTools.length / cols) * 40 * (1 + userSettings.biggerButtons)
        const box = new Rect(
            this.mouser.x + 10, this.mouser.y + 10,
            300,//reactor.width * .5 * cols,
            boxheight //reactor.height * .5 * Math.ceil(menu.length / cols)
        )
        box.fitThisWithinAnotherRect(game.rect)
        Rect.packArray(menu, box.splitGrid(Math.ceil(menu.length / cols), cols).flat(), true)
        menu.forEach(x => this.inspector.addChild(x, Reactor.description[x.type]))


        this.add_drawable(menu, 8)
        //this.add_drawable(box)
        this.menu = menu
    }
    //#endregion



    static statistics() {
        const victories = Game.keylistLocal()
        const res =
            `Tutorials completed: ${Object.keys(tutorialLevels).filter(x => victories.includes(x)).length
            }/${Object.keys(tutorialLevels).length
            }\nPuzzles completed: ${Object.keys(levels).filter(x => victories.includes(x)).length
            }/${Object.keys(levels).length
            }`

        GameEffects.popup(res, {
            posFrac: [.5, .8], sizeFrac: [.4, .2], floatTime: 3000,
            moreButtonSettings: { color: "yellow", fontSize: 32 }
        })
        return res
    }


    static keylistLocal() {
        return JSON.parse(localStorage.getItem(stgs.localVictoriesName)) ?? []
    }

    static saveToLocal(key, data, addKeyToVictories = true) {
        try {
            if (addKeyToVictories) {
                const keysAll = Game.keylistLocal()
                keysAll.push(key)
                const keysAllUnique = [...new Set(keysAll)]
                localStorage.setItem(stgs.localVictoriesName, JSON.stringify(keysAllUnique))
            }
            const dataAll = JSON.parse(localStorage.getItem(stgs.localDataName)) ?? {}
            dataAll[key] = typeof data === "string" ? JSON.parse(data) : data
            localStorage.setItem(stgs.localDataName, JSON.stringify(dataAll))
            if (addKeyToVictories) {
                GameEffects.popup(`Solution of "${stgs.stage}" saved.`, {
                    posFrac: [.5, .9],
                    moreButtonSettings: { font_font: "Consolas", color: "pink" }
                })
            }
            console.log("Solution saved to", key)
        } catch (error) {
            console.error("Something's off with saving to local storage")
            console.error(error)
        }
    }

    static checkIsVictoryFromLocal(key) {
        return JSON.parse(localStorage.getItem(stgs.localVictoriesName))?.includes(key)
    }
    static checkSaveData(key) {
        return JSON.parse(localStorage.getItem(stgs.localDataName))[key]
    }
    static loadFromLocal(key) {
        try {
            const data = JSON.parse(localStorage.getItem(stgs.localDataName))[key]
            return data
        } catch (error) {
            console.error("something's off with loading from local storage")
            console.error(key, error)
        }
    }
    static deleteFromLocal(key) {
        try {
            const wins = JSON.parse(localStorage.getItem(stgs.localVictoriesName))
            localStorage.setItem(stgs.localVictoriesName, JSON.stringify(wins.filter(x => x !== key)))
            const dataAll = JSON.parse(localStorage.getItem(stgs.localDataName))
            delete dataAll[key]
            localStorage.setItem(stgs.localDataName, JSON.stringify(dataAll))
            return true
        }
        catch (error) {
            console.error("something's off with deleting from local storage")
            console.error(key, error)
            return false
        }
    }
    static allLocal() {
        return localStorage.getItem(stgs.localDataName)
    }
    //#region askForOnlinePermissionsOnce
    askForOnlinePermissionsOnce(firstTime = true) {
        const [upper, lower] = this.rect.copy.splitRow(5, 3)
        const welcome = new Button()
        welcome.textSettings = { textAlign: "left", textBaseline: "top" }
        welcome.fitThisWithinAnotherRect(upper)
        welcome.txt = `Welcome to my game! (No title yet - suggestions are welcome.)
        
Before you proceed, I would like to ask if you would like to join the online leaderboards!

If you agree: every victory you achieve will be recorded on a public server,
then added to the leaderboards. You do not have to use your real or full name.
This data could help me further develop and refine the game as well.

If you disagree: none of your data will be shared.

Either way, have fun. Best, Steven.`
        welcome.fontSize = 36
        welcome.transparent = true
        const [no, details, yes] = lower.splitCol(1, 1, 1)
            .map(x => Button.fromRect(x, {
                fontSize: 36
            }))
            .map(x => x.stretch(.85, .5))

        yes.txt = "I agree to share my victories\nand join the leaderboards."
        details.txt = "Clarify what data will be sent."
        no.txt = "I do not want to share my victories."

        yes.on_release = () => {
            userSettings.ALLOW_ONLINE_COLLECTION = true
            userSettings.ALREADY_ASKED_FOR_ONLINE_COLLECTION = true
            stgs.stage = pageManager.levelSelector
            main()
        }
        yes.hover_color = "green"
        no.on_release = () => {
            userSettings.ALLOW_ONLINE_COLLECTION = false
            userSettings.ALREADY_ASKED_FOR_ONLINE_COLLECTION = true
            stgs.stage = pageManager.levelSelector
            main()
        }
        no.hover_color = "orange"
        details.hover_color = "lightblue"
        details.on_release = () => {
            alert(
                `Data shared is:
Name (of your choice, you will be asked later).
A unique ID to your name (randomly generated, persistent per browser).
Time of completion.
Name of the puzzle.
Your solution to the puzzle.

The data will be stored on a public server, 
anyone with the know-how might be able to read it.

This data will also get published on the leaderboards, or to highlight unique solutions.

The game will notify you with a small in-game popup each time data is sent.`
            )
        }
        const example = details.copy
        example.txt = "Example data."
        example.on_release = () => {
            alert(
                `Name: Steven Zsombo
Unique ID: gf5xh2g7
Time: 2025.12.24. 16:52:05
Level name: secondder
Solution: [[1,0,"IN"],[1,1,"DER"],[1,2,"DER"],[1,3,"OUT"]]`
            )
        }

        game.add_drawable([welcome, yes, details, example, no])
        example.fitThisWithinAnotherRect(details.splitCell(4, 1, 5, 1, 1, 2))
        details.fitThisWithinAnotherRect(details.splitCell(1, 1, 5, 1, 1, 2))



    }

    leaderboardsShow() {
        const big = Button.fromRect(this.rect.copy)
            .stretch(.9, .9)
        big.transparent = true
        big.fontSize = 36
        big.textSettings = { textAlign: "left", textBaseline: "top" }
        big.txt = "Initializing..."
        this.add_drawable(big)
        const doAttempt = () => {
            big.txt = "Loading..."
            Supabase.readAllWins()
                .catch((error) => {
                    console.log(error, this)
                    big.txt = "Failed to load the leaderboards."
                }).then((table) => {
                    const completions = table.reduce((s, t, i, a) => {
                        if (s[t.name]) { (s[t.name]).add(t.stage_text) }
                        else { s[t.name] = new Set([t.stage_text]) }
                        return s
                    }, {})
                    const scores = Object.entries(completions).map(
                        ([player, wins]) =>
                            [player, [...wins.values().filter(x => levels[x])].length]
                    )
                    scores.sort((x, y) => y[1] - x[1])
                    const board = scores.slice(0, 20).map(
                        ([player, wins]) =>
                            `${player}: ${wins}`
                    ).join("\n")
                    console.log(board)
                    big.txt = `Puzzles solved (out of ${Object.keys(levels).length})`
                        + "\n----------------------------\n"
                        + board
                })
        }
        doAttempt()

        const refreshB = new Button()
        refreshB.resize(300, 100)
        refreshB.bottomat(this.HEIGHT - 50)
        refreshB.rightat(this.WIDTH - 50)
        refreshB.txt = "Refresh"
        refreshB.fontSize = 36
        refreshB.on_release = doAttempt.bind(this)
        refreshB.hover_color = "lightblue"
        this.add_drawable(refreshB)
        const back = refreshB.copy
        back.topat(50)
        back.txt = "Back to puzzles"
        this.add_drawable(back)
        back.on_release = () => {
            stgs.stage = pageManager.levelSelector
            main()
        }
        back.hover_color = "lightblue"
        this.backToMenuButton = back

    }






    //#endregion
} //this is the last closing brace for class Game

//#region dev options
/// dev options
const dev = {
    add: (type) => window.r.addPiece(...window.r.LCP, type)

}/// end of dev

