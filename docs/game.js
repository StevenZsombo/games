var univ = {
    isOnline: false,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
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
    acquireNameMoreStr: "(English name + homeroom)",
    denybuttons: false,
    allowQuietReload: true,
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
            stgs.stage = pageManager.askForOnlinePermissionOnce


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
            case pageManager.askForOnlinePermissionOnce:
                this.askForOnlinePermissionsOnce()
                break;
            case pageManager.askForOnlinePermissionsFull:
                this.askForOnlinePermissionsFull()
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

        /**@param {KeyboardEvent} e */
        this.keyboarder.on_keydown = (e) => {
            if (!e.altKey && !e.shiftKey && e.ctrlKey) {
                if (e.key == 'z') this.reactor?.undo()
                if (e.key == 'y') this.reactor?.redo()
                // if (e.key == 's') this.reactor?.saveTemp() //Did not fancy this.
            }


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
        const wonAlreadyKeys = Game.victoryListLocal()

        lvlButtons.forEach((x, i) => {
            x.txt = levelList[i]
            const wonAlready = wonAlreadyKeys.includes(x.txt)
            if (wonAlready) {
                x.color = "lightgreen"
                x.hover_color = "green"
            }
            else { x.hover_color = "lightblue" }
            x.fontSize = 48
            x.font_font = "monospace"
            x.on_release = () => {
                stgs.stage = levelList[i]
                main()

            }

        })
        infoButton.centeratY(lvlButtons[0].top / 2)
        infoButton.transparent = true
        infoButton.txt = "Select level:"
        infoButton.leftat(lvlButtons[0].left)
        infoButton.textSettings = { textAlign: "left" }
        infoButton.width = (lvlButtons[sq - 1].right - lvlButtons[0].left) * .6
        infoButton.fontSize = 48
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
        tutorialsButton.fontSize = 48
        tutorialsButton.resize(tutorialsButton.width, lvlButtons[0].height)

        this.add_drawable(tutorialsButton)
        this.add_drawable(lvlButtons)
        this.add_drawable(infoButton)
        return { sq, infoButton, lvlButtons, tutorialsButton, lvlButtonsBG }

    }
    //#endregion
    //#region levelSelector
    levelSelectorOld() {
        const { sq, infoButton, lvlButtons, tutorialsButton, lvlButtonsBG } =
            this.makeGridOfLevels(Object.keys(window.levels))

        lvlButtons.forEach(x => {
            x.spread(this.rect.centerX, this.rect.centerY, 1.1, 1.1)
            x.stretch(1.1, 1.1)
            x.fontSize = 32
        })


        const manualButton = infoButton.copy
        manualButton.textSettings = {}
        manualButton.transparent = false
        manualButton.fontSize = 36
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
                [`Online data collection: ${userSettings.ALLOW_ONLINE_COLLECTION ? "ON" : "OFF"}`, () => { stgs.stage = pageManager.askForOnlinePermissionsFull; main(); }, "Click here to reset."],
                ["Statistics", Game.statistics, "How many puzzles did you solvet yet?"],
            ]
            if (userSettings.isDeveloper) {
                const devArr =
                    [
                        ["DEV.resetAllProgress", () => {
                            if (!confirm("This will reset all your progress and erase all your saves.\nDoing so is irreversible.\nAre you sure you want to reset ALL progress?"))
                                return
                            if (!confirm("Are you sure?"))
                                return
                            localStorage.removeItem(stgs.localDataName)
                            localStorage.removeItem(stgs.localVictoriesName)
                            main()

                        }, "Resets ALL progress",],
                        ["DEV.changeName", () => {
                            const name = localStorage.getItem("name")
                            if (!name)
                                return
                            if (!confirm(`Your current name is: \n${name}\nwould you like to change it?`))
                                return
                            Supabase.resetName()
                            Supabase.acquireName()
                        }, `Change your leaderboard name.\nCurrent: ${localStorage.getItem("name")}`],
                        ["DEV.changelog", () => window.open("Changelog.txt"), "Open Changelog.txt."]
                    ]
                arr.push(...devArr)
            }

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
            optionsMenu.menu.forEach(x => {
                if (x.txt.includes("DEV.")) x.color = "lightorange"
            })

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
            x.spread(this.WIDTH / 2, this.HEIGHT, 1, 0.4)
            x.move(0, -550)
            x.stretch(1, .4)
            x.color = "lightgray"
        })
        const lowerInfoButton = infoButton.copy
        lowerInfoButton.txt = `Untested prototypes (might be impossible). 
If you solve any of these, you'll be rewarded with some chocolate (come to Room 203).`
        const { lvlButtons: proButtons, tutorialsButton: tut2, infoButton: inf2 } = this.makeGridOfLevels(Object.keys(prototypeLevels))
        game.remove_drawable(tut2)
        game.remove_drawable(inf2)
        proButtons.forEach(x => {
            x.spread(this.WIDTH / 2, 0, 1.1, .6)
            x.stretch(1, .5)
            x.move(0, 500)
            x.color = x.color.includes("green") ? x.color : "lightgray"
        })
        lowerInfoButton.bottomat(proButtons[0].top - 50)
        lowerInfoButton.leftat(proButtons[0].left)
        this.add_drawable(lowerInfoButton)
        this.tutorialsButton = tutorialsButton
        const lowerBg = new Button()
        lowerBg.outline = 0
        lowerBg.topat(lowerInfoButton.top - 20)
        lowerBg.bottomstretchat(proButtons.at(-1).bottom + 20)
        lowerBg.width = this.WIDTH - 60
        lowerBg.centeratX(this.WIDTH / 2)
        lowerBg.color = "lightpink"

        this.add_drawable(lowerBg, 4)
    }
    //#endregion


    //#region makeLevel
    testLevel(level) {
        stgs.stage = "blank"
        main()
        game.makeLevel(level)
    }
    /**@param {Level} level  */
    makeLevel(level, before_start = null, after_start = null) {
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
            b.fontSize = 24
        })
        Button.make_radio(speedButtons.slice(1), true)
        speedButtons[3].on_click()
        //speedButtons[1].on_click()
        this.speedButtons = speedButtons
        this.add_drawable(speedButtons)
        reactor.loadLevel(level, 0, Game.loadFromLocal(stgs.stage))


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
        this.destroyedMenuAlready = false

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

            /*this.currentDraggingList.forEach(x => {
                x.x = this.lastHit.tag[0]
                x.y = this.lastHit.tag[1]
                this.reactor.refreshButtons(x)
                didNotDrag = false
            })*/
            const swappedList =
                this.reactor.swapPiecesAt(...this.firstHit.tag, ...this.lastHit.tag)
            this.currentDraggingList.length = 0
            /*targetsList.forEach(x => {
                x.x = this.firstHit.tag[0]
                x.y = this.firstHit.tag[1]
                this.reactor.refreshButtons(x)
            })*/
            this.lastHit = null
            this.firstHit = null
            /*if (this.firstHitChanged || (Date.now() - this.mouser.lastClickedTime > 100)) {
                return
            }*/
            if (hit && !swappedList.length && !this.firstHitChanged) {
                this.dropDown(hit)
                this.lastHit = hit
            } else {
                this.dropDownEnd()
            }
            this.destroyedMenuAlready = false

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
        before_start?.()
        reactor.start()//remove later
        after_start?.()

    }
    //#endregion
    //#region dropDown
    seekButton() {
        if (!this.reactor) return
        return this.reactor.buttonsMatrix.flat().find(p => p.collidepoint(this.mouser.pos.x, this.mouser.pos.y))
    }

    dropDownEnd() {
        // this.destroyedMenuAlready = true//awkward: make me click twice
        this.remove_drawables_batch(this.menu)
        this.menu = null
        this.reactor.buttonsMatrix.flat().forEach(x => x.color = "white")
        this.inspector.reset()
    }

    dropDown(button, cols = 2) {
        if (this.menu) {
            this.dropDownEnd()
        }
        if (this.destroyedMenuAlready) return
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
            on_release: () => {
                reactor.addPiece(...button.tag, x)
                //this.mouser.blockNextRelease()
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
        if (userSettings.hoverTooltips)
            menu.forEach(x => this.inspector.addChild(x, Reactor.description[x.type]))


        this.add_drawable(menu, 8)
        //this.add_drawable(box)
        this.menu = menu
    }
    //#endregion



    static statistics() {
        const victories = Game.victoryListLocal()
        const res =
            `Tutorials completed: ${Object.keys(tutorialLevels).filter(x => victories.includes(x)).length
            }/${Object.keys(tutorialLevels).length
            }\nPuzzles completed: ${Object.keys(levels).filter(x => victories.includes(x)).length
            }/${Object.keys(levels).length
            }`

        GameEffects.popup(res, {
            posFrac: [.5, .8], sizeFrac: [.4, .2], floatTime: 3000,
            moreButtonSettings: { color: "yellow", fontSize: 30 }
        })
        return res
    }
    static statisticsSelfLeaderboard(name) {
        const victories = Game.victoryListLocal()
        const res =
            `You: ` +
            `${name}: ` +
            `${Object.keys(levels).filter(x => victories.includes(x)).length}` +
            ` (+ ${Object.keys(tutorialLevels).filter(x => victories.includes(x)).length} tutorials)`
        return res
    }


    static victoryListLocal() {
        return JSON.parse(localStorage.getItem(stgs.localVictoriesName)) ?? []
    }

    static saveToLocal(key, data, addKeyToVictories = true) {
        try {
            if (addKeyToVictories) {
                const keysAll = Game.victoryListLocal()
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
                    moreButtonSettings: { font_font: "monospace", color: "pink" }
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
    static loadFromLocalModuleList(key) {
        const data = this.loadFromLocal(key)
        if (!data) return ""
        const ignored = "UP DOWN LEFT RIGHT IN OUT".split(" ")
        return [...new Set(data.map(x => x[2]).filter(x => !ignored.includes(x)))].join(" ")
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
    askForOnlinePermissionsOnce(firstTime = true) {
        const [upper, lower] = this.rect.copy.splitRow(5, 3)
        const welcome = Button.fromRect(upper)
        //welcome.textSettings = { textAlign: "left", textBaseline: "top" }
        welcome.txt =
            `
This game saves and sends each of your victories to a public server,
and automatically adds your name and results to a public leaderboard.
If you wish to turn this feature off, you may do so in the Options menu.
`
        welcome.transparent = true
        welcome.stretch(.8, .4)
        const okay = Button.fromRect(lower)
        okay.txt = "I understand."
        okay.hover_color = "lightblue"
        okay.stretch(.4, .4)
        okay.on_click = () => {
            userSettings.ALLOW_ONLINE_COLLECTION = true
            userSettings.ALREADY_ASKED_FOR_ONLINE_COLLECTION = true
            Supabase.acquireName()
            location.reload()
        }
            ;
        [welcome, okay].forEach((x) => {
            x.fontSize = 40
            this.add_drawable(x)
        })

    }
    //#region askForOnlinePermissionsOnce
    askForOnlinePermissionsFull(firstTime = true) {
        const [upper, lower] = this.rect.copy.splitRow(5, 3)
        const welcome = new Button()
        welcome.textSettings = { textAlign: "left", textBaseline: "top" }
        welcome.fitThisWithinAnotherRect(upper)
        welcome.txt = `Welcome to my game!
        
Would you like to join the online leaderboards ?

    If you agree: your victories will be recorded on a public server,
        and your name will be added to the leaderboards.

Have fun.
    Best, Steven`
        welcome.fontSize = 40
        welcome.transparent = true
        const [no, details, yes] = lower.splitCol(1, 1, 1)
            .map(x => Button.fromRect(x, {
                fontSize: 32
            }))
            .map(x => x.stretch(.85, .5))

        yes.txt = "I agree to share my victories\nand join the leaderboards."
        details.txt = "Clarify what data will be sent."
        no.txt = "I do not want to share my victories."

        yes.on_release = () => {
            Supabase.acquireName()
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
Name(of your choice, you will be asked later).
A unique ID to your browser(randomly generated, persistent).
Time of completion.
Name of the puzzle.
Your solution to the puzzle.

The data will be stored on a public server,
anyone with the know-how might be able to read it.

This data will also get published on the leaderboards, or to highlight unique solutions.

The game will notify you with a small in -game popup each time data is sent successfully.`
            )
        }
        const example = details.copy
        example.txt = "Example data."
        example.on_release = () => {
            alert(
                `Name: Steven Zsombo
Unique ID: gf5xh2g7
Time: 2025.12.24. 16: 52:05
Level name: secondder
Solution: [[1, 0, "IN"], [1, 1, "DER"], [1, 2, "DER"], [1, 3, "OUT"]]`
            )
        }

        game.add_drawable([welcome, yes, details, example, no])
        example.fitThisWithinAnotherRect(details.splitCell(4, 1, 5, 1, 1, 2))
        details.fitThisWithinAnotherRect(details.splitCell(1, 1, 5, 1, 1, 2))



    }
    //#region leaderboardsShow
    leaderboardsShow(topNr = 20) {
        const big = Button.fromRect(this.rect.copy)
            .stretch(.9, .9)
        big.transparent = true
        big.fontSize = 32
        big.textSettings = { textAlign: "left", textBaseline: "top" }
        big.txt = "Initializing..."
        this.add_drawable(big)
        const myName = Supabase.acquireName().name
        const checkMyWins = (completions) => {
            const serverWins = completions[myName]
            const myWins = Game.victoryListLocal().filter(x => levels[x])
            const missing = myWins.filter(x => !serverWins.has(x))
            if (missing.length) {
                GameEffects.popup(
                    `The following victories have not been recorded on the server:
${MM.reshape(missing, 5).map(x => x.join(", ")).join("\n")}.
Please run them again to send your data.`
                    , {
                        posFrac: [.5, .8], sizeFrac: [.9, .2], floatTime: 5000,
                        moreButtonSettings: { color: "red", fontSize: 40, font_font: "monospace" }
                    })
                console.log("Missing:", missing)
            } else {
                console.log("Your victories are fully synced.")
            }
        }
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
                    checkMyWins(completions)
                    const scores = Object.entries(completions).map(
                        ([player, wins]) =>
                            [player, [...wins.values().filter(x => levels[x])].length]
                    )
                    scores.sort((x, y) => y[1] - x[1])
                    const board = scores.slice(0, topNr).map(
                        ([player, wins]) =>
                            `${player}: ${wins} `
                    ).join("\n")
                    console.log(board)
                    big.txt = `Puzzles solved (out of ${Object.keys(levels).length}) `
                        + "\n----------------------------\n"
                        + board
                        + "\n\n"
                        + Game.statisticsSelfLeaderboard(myName)

                })
        }
        doAttempt()

        const refreshB = new Button()
        refreshB.resize(300, 100)
        refreshB.bottomat(this.HEIGHT - 50)
        refreshB.rightat(this.WIDTH - 50)
        refreshB.txt = "Refresh"
        refreshB.fontSize = 40
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
    //#region levelSelectorFancy
    levelSelectorFancy() {
        let refreshAll = () => { }
        const Row = function (children) {
            this.children = children
            const bg = Button.fromRect(game.rect.copy)
            bg.x = 0
            bg.height = 55
            children.forEach(x => x.height = bg.height)
            bg.outline = 0
            bg.color = "yellow"
            this.bg = bg
            bg.on_enter = () => {
                bg.transparent = false
                refreshAll()
            }
            bg.on_leave = () => {
                bg.transparent = true
                refreshAll()
            }
        }

        const levelList =
            `INOUT1 REMOVE UDLR1 UDLR2 INOUT2 RAISE LOWER mulxcube noconst
            LEAD CONST1 degreetwo DER1 secondder DER2 multhree multt
            INT1 INT2 divthree constone CONST2 CONST3 twoxplusone twothirds
            DEG1 DEG2 four hasconst NEG TAKE perp nzconst
            POW1 POW2 exp sqrt sumupto evenonly divtwelve evenodd
            SUM1 SUM2 COPY1 multeight mult tail leadingterm lindiff manyones
            SUBS ntothen poweroftwo sumcoeff invsq boolflip linprod linsolve
            penta vel accel tangent sixsixsix DOOR1 DOOR2 twoonly POW3
            posonly quadonly statattwo degfour compsqonly sign inconly 
            COPY2 COPY3 allint allodd geometric golden sqrttwo powersoftwo
            pi last abs e factorials linmax everyother factorial`
                .split("\n").map(x => x.trim().split(" ").map(x => x.trim()).filter(x => x))
        const LEVEL_BUTTON_FONTSIZE = 30
        const getLevelButton = (str) => {
            let tutorial = false
            let level = levels[str]
            if (!level) {
                tutorial = true
                level = tutorialLevels[str]
            }
            if (!level) {
                console.error("invalid level requested:", str)
                throw "invalid level requested"
            }
            const b = new Button()
            b.color = tutorial ? "lightgray" : "gray"
            b.hover_color = tutorial ? "lightpink" : "pink"
            if (Game.checkIsVictoryFromLocal(str)) {
                b.color = tutorial ? "lightblue" : "lightgreen"
                b.hover_color = tutorial ? "blue" : "green"
            }
            b.tag = str
            b.txt = str
            b.width = tutorial ? 120 : 200
            b.outline = 3
            b.font_font = "monospace"
            b.fontSize = LEVEL_BUTTON_FONTSIZE
            b.on_release = () => {
                stgs.stage = str
                main()

            }
            return b
        }
        const rows = levelList.map(x => new Row(x.map(getLevelButton)))
        rows.forEach(x => {
            this.add_drawable(x.bg)
            this.add_drawable(x.children)
            x.bg.on_leave()
        })
        const bigBackground = this.rect.copy.deflate(100, 200)
        bigBackground.bottomstretchat(this.HEIGHT - 150)
        rows.forEach(x => x.bg.fitThisWithinAnotherRect(bigBackground))
        refreshAll = () => {
            Rect.packCol(rows.map(x => x.bg), bigBackground, "justify")
            rows.forEach(x => Rect.packRow(x.children, x.bg, 30))
        }
        refreshAll()
        const checkIfAllLevelsAreIncluded = () => {
            const levelsSoFar =
                rows.reduce((s, t) => (s.push(...t.children.map(x => x.tag)), s), [])
            if (levelsSoFar.length != new Set(levelsSoFar).size)
                console.error("There are duplicate levels.")
            if (rows.flatMap(x => x.children).some(x => x.right > bigBackground.right))
                console.error("too many items in a row")
            const levelsMissing = [].concat(...[levels, tutorialLevels].map(Object.keys)).filter(x => !levelsSoFar.includes(x))
            if (levelsMissing.length)
                console.error("Levels missing:", levelsMissing)
        }
        checkIfAllLevelsAreIncluded()
        const label = new Button({
            width: 500,
            height: 100,
            transparent: true,
            txt: "Select level (the short buttons are tutorials):",
            //dynamicText: () => `${game.mouser.x}, ${game.mouser.y}`,
            fontSize: 36,
            x: 50,
            y: 0,
            textSettings: { textAlign: "left" }
        })
        if (Game.victoryListLocal().length == 0) {
            const firstbg = rows?.[0]?.children?.[0]

            this.animator.add_anim(Anim.custom(firstbg, 500, (t, obj) => {
                obj.rad = Math.sin(t * TWOPI) * .4
            }, "rad",
                { repeat: 10 }))
            rows[0].children[0].color = "purple"

        }
        this.levelButtons = rows.flatMap(x => x.children)

        this.add_drawable(label)
        this.addBottomButtons()
        this.checkServerSync()

        rows.flatMap(x => x.children).forEach(x => (x.visible = false, x.interactable = false))
        this.animator.add_staggered(rows, 100,
            Anim.custom(null, 100, function (t, obj) {
                obj.children.forEach(x => (x.height = t * 55, x.visible = true, x.fontSize = LEVEL_BUTTON_FONTSIZE * t))
            }, [], {
                on_end: (obj) => obj.children.forEach(x => {
                    x.visible = true
                    x.height = 55
                    x.fontSize = LEVEL_BUTTON_FONTSIZE
                    x.interactable = true
                })
            }), { initialDelay: 100 })
    }
    //#region 
    //#region addBottomButtons
    addBottomButtons() {
        const manualButton = new Button({
            hover_color: "lightblue"
        })
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
                [`Bigger buttons: ${userSettings.biggerButtons ? "ON" : "OFF"} `, () => userSettings.biggerButtons ^= 1, "Recommended for small screen devices."],
                //[`IN works without OUT: ${ Reactor.SERVE_IN_EVEN_IF_NO_OUT ? "ON" : "OFF" } `, () => Reactor.SERVE_IN_EVEN_IF_NO_OUT ^= 1, "Whether or not IN should push \nnew inputs even if there is no OUT module."],
                [`Tooltips on hover: ${userSettings.hoverTooltips ? "ON" : "OFF"} `, () => userSettings.hoverTooltips ^= 1, "Whether these tooltip boxes should pop up\nwhen hovering over modules."],
                [`Developer mode: ${userSettings.isDeveloper ? "ON" : "OFF"} `, () => userSettings.isDeveloper ^= 1, "Allows to unlock gamespeed restrictions\nor generate extra sheets."],
                [`Online data collection: ${userSettings.ALLOW_ONLINE_COLLECTION ? "ON" : "OFF"} `, () => { stgs.stage = pageManager.askForOnlinePermissionsFull; main(); }, `Click here to reset.`],
                ["Statistics", Game.statistics, "How many puzzles did you solvet yet?"],
            ]
            if (userSettings.isDeveloper) {
                const devArr =
                    [["DEV.resetTutorials", () => {
                        if (!confirm("This will reset all tutorials. Are you sure?")) return
                        Object.keys(tutorialLevels).forEach(x => {
                            Game.deleteFromLocal(x)
                        })
                        main()
                    }, "Resets the tutorials."],
                    ["DEV.resetAllProgress", () => {
                        if (!confirm("This will reset all your progress and erase all your saves.\nDoing so is irreversible.\nAre you sure you want to reset ALL progress?"))
                            return
                        if (!confirm("Are you sure?"))
                            return
                        localStorage.removeItem(stgs.localDataName)
                        localStorage.removeItem(stgs.localVictoriesName)
                        main()
                    }, "Resets ALL progress",],
                    ["DEV.changeName", () => {
                        const name = localStorage.getItem("name")
                        if (!name)
                            return
                        if (!confirm(`Your current name is: \n${name} \nwould you like to change it ? `))
                            return
                        Supabase.resetName()
                        Supabase.acquireName()
                    }, `Change your leaderboard name.\nCurrent: ${localStorage.getItem("name")} `],
                    ["DEV.changelog", () => window.open("Changelog.txt"), "Open Changelog.txt."]
                    ]
                arr.push(...devArr)
            }

            const obj = Object.fromEntries(arr.map(x => [x[0], x[1]]))
            const optionsMenu = GameEffects.dropDownMenu(
                obj,
                null, null, null,
                {
                    height: userSettings.biggerButtons ? 140 : 80,
                    width: 400
                },
                [optionsButton], //overlay is not yet defined.
                true,
                () => this.inspector.reset()
            )
            optionsMenu.menu.forEach(x => {
                if (x.txt.includes("DEV.")) x.color = "lightorange"
            })

            arr.forEach(([a, b, c], i) => {
                if (c) this.inspector.addChild(optionsMenu.menu[i], c)

            })
        }

        const freeButton = manualButton.copy
        freeButton.on_release = () => {
            stgs.stage = pageManager.freeSelector
            stgs.latestSelectorType = pageManager.freeSelector
            main()
        }
        freeButton.txt = "Free play & prototypes"

        const leaderboardsButton = manualButton.copy
        leaderboardsButton.txt = "Leaderboards"
        leaderboardsButton.on_release = () => {
            stgs.stage = pageManager.leaderboardsPage
            stgs.latestSelectorType = pageManager.levelSelector
            main()
        }

        const bottomButtonsBG = game.rect.copy.deflate(100, 0)
        bottomButtonsBG.height = 100
        bottomButtonsBG.bottomat(this.HEIGHT - 25)
        Rect.packArray(
            [optionsButton, freeButton, leaderboardsButton, manualButton],
            bottomButtonsBG.splitCol(.6, .1, 1, .1, .7, .1, .4)
                .filter((_, i) => [0, 2, 4, 6].includes(i)), true
        )

        this.add_drawable([optionsButton, freeButton, leaderboardsButton, manualButton])
    }

    //#endregion
    levelSelector = this.levelSelectorFancy
    //#region checkServerSync
    checkServerSync() {
    }

    //#endregion


    //#endregion
} //this is the last closing brace for class Game

//#region dev options
/// dev options
const dev = {
    showModules: () => {
        if (stgs.stage !== pageManager.levelSelector) return
        game.levelButtons.forEach(x => game.inspector.addChild(x, Game.loadFromLocalModuleList(x.tag)))
    }
}/// end of dev

