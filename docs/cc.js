var univ = {
    isOnline: true,
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
    on_first_run: null,
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: false,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}

let syncReady = false
/**@type {number} */
var myKingdomID
/**@type {string} */
var myColor
/**@type {Kingdom} */
var myKingdomObject
/**@type {Set<number>} */
let waitingQuestionsTrigger = new Set() //by conflictID



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

    kingdomSelect() {
        const top = Button.fromRect(game.rect.copy.splitCell(1, 1, 4, 1))
        top.txt = "Select your kingdom:"
        top.fontSize = 48
        game.add_drawable(top)

        const ks = game.rect.copy.splitCell(3, 1, 4, 1, 1, 1)
            .splitGrid(RULES.NUMBER_OF_TEAMS <= 6 ? 1 : 2, RULES.NUMBER_OF_TEAMS <= 6 ? RULES.NUMBER_OF_TEAMS : 6)
            .flat().map(x => Button.fromRect(x))
        game.add_drawable(ks)

        ks.forEach((b, i) => {
            b.color = Kingdom.defaultColors[i]
            b.txt = b.color
            b.fontSize = 60
            //b.shrinkToSquare()
            b.stretch(.8, .8)
            b.outline = 5
            b.on_release = () => {
                game.remove_drawables_batch(ks)
                game.remove_drawable(top)
                myKingdomID = i
                localStorage.setItem("myKingdomID", i)
                this.initialize_more()
            }
        })

    }
    resetKingdom() {
        localStorage.removeItem("myKingdomID")
        chat.silentReload()
    }

    //#region initialize_more
    initialize_more() {
        Question.ALL.forEach(x => x.sol = undefined)
        if (myKingdomID === undefined) {
            const stored = localStorage.getItem("myKingdomID")
            if (stored) myKingdomID = +stored
            else {
                this.kingdomSelect()
                return
            }
        }
        chat.sendSecure({ kingdom: myKingdomID })

        /**@type {Kingdom[]} */
        const kingdoms = []
        /**@type {Territory[]} */
        const territories = []
        /**@type {Conflict[]} */
        const conflicts = [] //shallow

        this.kingdoms = kingdoms
        this.territories = territories
        this.conflicts = conflicts

        /**@type {Set<number} */
        this.territoriesUnderAttack = new Set()
        /**@type {Territory[]} */
        this.canAttackList = []

        contest.on_share = (shared, value) => {
            if (shared == "territoriesFullData") {
                // if (territories.length) return
                game.remove_drawables_batch(territories.map(x => x.button))
                territories.length = 0
                territories.push(...Territory.manyFromData(value))
                game.add_drawable(territories.map(x => x.button))
                this.buts = territories.map(x => x.button)
                this.buts.forEach(x => x.transparent = RULES.PROVINCE_BUTTONS_TRANSPARENT)

                waitCheckSyncState()
            }
            if (shared == "kingdomsFullData") {
                // if (kingdoms.length) return
                kingdoms.length = 0
                kingdoms.push(...Kingdom.manyFromData(value))
                waitCheckSyncState()
            }
            if (!syncReady) return
            //only if syncReady
            if (shared == "ownershipData") {
                value.forEach(x => {
                    kingdoms[x.id].territories = new Set(x.territories.map(u => territories[u]))
                    x.territories.forEach(u => territories[u].button.color = kingdoms[x.id].color)
                })
            }
            if (shared == "valuesData") {
                value.forEach(x => territories[x.id].value = x.value)
            }
            //#region conflictsData
            //CDhere
            if (shared == "conflictsData") {
                this.territoriesUnderAttack = new Set(value.map(x => x.to))//id of the place
                value = value.filter(x => (x.fromKD === myKingdomID) || (x.toKD === myKingdomID))
                value.forEach(x => {
                    const match = snippets.find(u => u.id === x.id)
                    if (match) {
                        match.confD.timeLeft = x.timeLeft
                        match.confD.justDeclared = x.justDeclared
                        if (x.qID != -1) {
                            //new pane created when necessary
                            if (!panes.has(x.id)) { //by conflict id
                                panes.set(x.id, new QPane(x.qID, x.id))
                                if (waitingQuestionsTrigger.has(x.id)) {
                                    waitingQuestionsTrigger.delete(x.id)
                                    setFocus(x.id)
                                }
                            }
                        }
                        match.confD.qID = x.qID
                    }
                    else snippets.push(new Snippet(x))
                })
                const serverIDs = value.map(x => x.id)
                snippets.filter(x => !serverIDs.includes(x.id)).forEach(x => {
                    if (focus == x.id) setFocus("map")
                    if (panes.has(x.id)) {
                        panes.get(x.id).destroy()
                        panes.delete(x.id)
                    }
                    x.destroy() //snippet
                })
                Snippet.rearrange()
            }
            if (shared == "rankingData") {
                const ranks = this.ranking.slice(1, -1)
                ranks.forEach((x, i) => {
                    const [kID, kNAME, kSCORE] = value[i]
                    x.txt = `${kNAME} (${kSCORE})`
                    x.font_color = kingdoms[kID].color
                })

            }
        }

        const waitCheckSyncState = () => {
            if (this.territories.length && this.kingdoms.length) {
                chat.sendSecure({ inquire: "ownershipData" })
                chat.sendSecure({ inquire: "valuesData" })
                chat.sendSecure({ inquire: "conflictsData" })
                chat.sendSecure({ inquire: "rankingData" })
                init_after_basics()
                syncReady = true

            }
        }
        chat.sendSecure({ inquire: "territoriesFullData" })
        chat.sendSecure({ inquire: "kingdomsFullData" })


        const init_after_basics = () => {
            let border = Gimmicks.setupBorder()
            const { top, bot, left, right } = border
            border = Object.values(border)
            this.border = border
            this.top = top
            this.bot = bot
            this.left = left
            this.right = right

            myKingdomObject = kingdoms[myKingdomID]
            myColor = myKingdomObject.color

            //first it label, last is status
            const ranking = top.splitGrid(1, RULES.NUMBER_OF_TEAMS + 3).flat().slice(0, -1).map(x => Button.fromRect(x))
            ranking.forEach(b => {
                b.outline = 0
                // b.color = "gray"
                b.transparent = true
                b.fontSize = 28
            })
            ranking.at(-1).width *= 2
            ranking[0].txt = "Teams:"
            ranking.at(-1).txt = `You: ${chat.name} (${kingdoms[myKingdomID].name})`
            ranking.at(-1).color = myColor
            ranking.at(-1).transparent = false

            this.ranking = ranking
            top.color = "gray"
            game.add_drawable(ranking)

            bot.txt = "BATTLES".split("").join("  ")
            bot.fontSize = 48
            bot.color = myColor || "white"

            Snippet.bgDefault.resize(GRAPHICS.SNIPPET_WIDTH, bot.height - 20)
            Snippet.bgDefault.topat(bot.top)
            Snippet.bgDefault.leftat(bot.left + 20)

            this.add_drawable(Object.values(border), 3)
            border.forEach(x => {
                x.outline = 0
            })

            const attackButton = new Button({ width: 200, height: 150 })
            attackButton.fontSize = 30
            // attackButton.bottomat(bot.top)
            attackButton.topat(this.top.bottom + 50)
            attackButton.centeratX(this.right.centerX)

            attackButton.color = "lightsalmon"
            attackButton.deactivate()
            this.attackButton = attackButton
            this.add_drawable(attackButton)
            /**@param {Territory}t */
            Territory.on_click = (t) => {
                GameEffects.sendFancy(t.button, attackButton, 1000,
                    // { txt: null, dynamicText: null }
                )
                attackButton.txt = `Attack\n${t.name}`
                attackButton.activate()
                attackButton.territory = t
            }
            attackButton.on_click = () => {
                chat.sendMessage({ attack: attackButton.territory.id })
                attackButton.interactable = false
                attackButton.txt = "Waiting for\nserver..."
                this.animator.add_anim(Anim.delay(500, { on_end: () => attackButton.deactivate() }))
            }

            const mapArea = new Button()
            mapArea.leftat(left.right)
            mapArea.topat(top.bottom)
            mapArea.bottomstretchat(bot.top)
            mapArea.rightstretchat(right.left)
            this.mapArea = mapArea
            QPane.bgDefault = mapArea.copy
            QPane.bgDefault.height -= 100
            const answerArea = QPane.bgDefault.copy
            answerArea.height = 100
            answerArea.topat(QPane.bgDefault.bottom)
            QPane.answerSpaceDefault = answerArea.copy
            QPane.calculatorSpaceDefault = right.copy



            mapster = new Mapster(
                Kingdom.defaultRGBs.slice(0, RULES.NUMBER_OF_TEAMS),
                RULES.PICTURE_PATH + RULES.PICTURE_BACKGROUND_MAP,
                RULES.PICTURE_BACKGROUND_CENTER.x - RULES.PICTURE_BACKGROUND_DIMENSIONS[0] / 2,
                RULES.PICTURE_BACKGROUND_CENTER.y - RULES.PICTURE_BACKGROUND_DIMENSIONS[1] / 2,
                territories,
                () => {
                    mapster.current = this.territories.map(x => Territory.ownedBy(x)?.id ?? null)
                }
            )
            this.add_drawable(mapster, 2)

        }

        const connectionsDrawableObject = { //could even be optimized
            draw: (screen) => {
                if (this.showingMap && RULES.PROVINCE_SHOW_CONNECTIONS)
                    this.territories?.forEach(t => {
                        t.connections.forEach(oth =>
                            MM.drawLine(screen,
                                t.button.centerX, t.button.centerY, oth.button.centerX, oth.button.centerY,
                                { width: GRAPHICS.CONNECTION_LINE_WIDTH })
                        )
                    })
            }
        }
        this.add_drawable(connectionsDrawableObject, 4)
        if (!RULES.PROVINCE_BUTTONS_TRANSPARENT) {
            const highlightOwnProvincesDrawableObject = {
                lineWidth: 10, //interesting
                growthRate: +0.1,
                draw: (screen) => {
                    if (this.showingMap)
                        myKingdomObject.territories.forEach(
                            /** @param {Territory} t */
                            t => {
                                MM.drawRect(screen,
                                    t.button.x,
                                    t.button.y,
                                    t.button.width, t.button.height,
                                    {
                                        lineWidth: highlightOwnProvincesDrawableObject.lineWidth,
                                        // lineWidth: 8,
                                        color: "black"
                                    }
                                )
                            })
                },
                update: (dt) => {
                    highlightOwnProvincesDrawableObject.lineWidth += highlightOwnProvincesDrawableObject.growthRate
                    if (highlightOwnProvincesDrawableObject.lineWidth > 14 ||
                        highlightOwnProvincesDrawableObject.lineWidth < 8)
                        highlightOwnProvincesDrawableObject.growthRate *= -1

                }
            }
            this.add_drawable(highlightOwnProvincesDrawableObject, 4)
        }

        chat.on_receive = (message) => {
            // console.log(message)
            if (message.orderResetKingdom !== undefined) {
                game.resetKingdom()
            }
        }

        //clockwork for snippet update 
        //AND also attack reminders
        this.snippetUpdateClockwork = setInterval(
            () => {
                snippets.forEach(x => x.update(1000))
                if (!myKingdomObject) return
                this.canAttackList = Array.from(
                    myKingdomObject.territories.values().flatMap(x => x.connections)//neighbouring
                        .filter(x => !myKingdomObject.territories.has(x))//is not your own
                        .filter(x => !this.territoriesUnderAttack.has(x)))//is not under attack
                if (this.canAttackList.length > 0) {
                    //animated circle via attackCircleDrawableObject

                }

            },
            1000)

        const attackCircleDrawableObject = {
            size: 30,
            growthRate: 0.02,
            draw: (screen) => {
                if (!this.showingMap) return
                this.canAttackList.forEach(x => MM.drawEllipse(
                    screen,
                    x.button.centerX,
                    x.button.centerY - 5,
                    attackCircleDrawableObject.size * 2,
                    attackCircleDrawableObject.size,
                    { outline: 4, outline_color: "red", color: null }
                )
                )
            },
            update: (dt) => {
                if (!this.showingMap) return
                attackCircleDrawableObject.size += dt * attackCircleDrawableObject.growthRate
                if (attackCircleDrawableObject.size > 40 || attackCircleDrawableObject.size < 30)
                    attackCircleDrawableObject.growthRate *= -1
            }
        }
        this.attackCircleDrawableObject = attackCircleDrawableObject
        this.add_drawable(attackCircleDrawableObject)


        this._showingMap = true

    }

    _showingMap = false
    get showingMap() { return this._showingMap }
    set showingMap(bool) {
        if (bool === this._showingMap) return bool
        this._showingMap = bool
        this.buts.forEach(x => x.activeState = bool)
        this.attackButton.activeState = false //always false.
        return bool
    }

    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {
        // snippets.forEach(x => x.update(dt)) //only for removal! //timeleft is managed by confD








    }

    //#endregion
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region draw_more

    draw_more(screen) {
        if (this.showingMap)
            if (this.territories?.length && this.kingdoms?.length && contest?.shared?.conflictsData)
                for (const c of contest?.shared?.conflictsData) {
                    if (c.alreadyResolved) continue
                    MM.drawArrow(screen,
                        this.territories[c.from].button.centerX - 10,
                        this.territories[c.from].button.centerY - 10,
                        this.territories[c.to].button.centerX + 10,
                        this.territories[c.to].button.centerY + 10,
                        {
                            color: c.justDeclared ? GRAPHICS.ATTACK_BEFORE_RESPONSE_COLOR : GRAPHICS.ATTACK_TEAM_COLOR_FUNCTION(this.kingdoms[c.fromKD].color),
                            width: 10, size: 30,
                            // txt: MM.toMMSS(c.timeLeft) //too buggy.
                        }
                    )

                }









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




} //this is the last closing brace for class Game

//#region dev options
/// dev options
const dev = {


}/// end of dev

//#region 
class Snippet {
    static bgDefault = new Button()
    /**@param {Button} bg  */
    constructor(confD, bg) {
        this.confD = confD
        this.id = confD.id //conflict id
        bg ??= Snippet.bgDefault.copy
        this.bg = bg
        /**@type {Button[]} */
        const rows = bg.splitRow(1, 1, 1, 1).map(x => Button.fromRect(x))
        this.rows = rows
        let color
        if (confD.fromKD === myKingdomID) {//attacking
            color = game.kingdoms[confD.toKD].color
            rows[0].dynamicText = () => confD.justDeclared ? "waiting for" : "attacking"
            rows[1].txt = game.kingdoms[confD.toKD].name + " in"
            // rows[1].color = color
            rows[2].txt = game.territories[confD.to].nameShort
        } else {
            color = game.kingdoms[confD.fromKD].color
            rows[0].dynamicText = () => confD.justDeclared ? "THREAT at" : "defending"
            rows[1].txt = game.territories[confD.to].nameShort
            rows[2].txt = "from " + game.kingdoms[confD.fromKD].name
            // rows[2].color = color
        }
        rows[3].dynamicText = () => MM.toMMSS(this.confD.timeLeft)
        rows.forEach(x => {
            x.outline = 0
            x.color = color
            x.fontSize = GRAPHICS.SNIPPET_FONTSIZE
        })
        this.recenter()
        Snippet.rearrange()
        //adds itself
        game.add_drawable(rows)
        // bg.deflate(-10, -10)
        bg.outline = 10
        game.add_drawable(bg, 4)
        // bg.isBlocking = true
        bg.on_click = () => {
            if (confD.question == -1) {
                if (confD.fromKD === myKingdomID) //attacking
                    GameEffects.popup("Wait for the opponent to respond.", {}, GRAPHICS.POPUP_PATIENCE)
                else { //trying to defend
                    GameEffects.popup("Defense began!", {}, GRAPHICS.POPUP_START_DEFENSE)
                    setFocus(confD.id) //will accept via invalid focus
                }
            } else setFocus(confD.id)

        }
    }
    recenter() {
        Rect.packCol(this.rows, this.bg, 0, "c", true)
    }
    static rearrange() {
        const gapSizeIfPossible = 20
        Rect.packRow(snippets.map(x => x.bg), game.bot.copy.deflate(40, 0),
            //20 gap if fits, justify otherwise
            snippets.reduce((s, t) => s + t.bg.width, 0) + (snippets.length - 1) * gapSizeIfPossible < game.bot.width
                ? 20 : "justify"
            , "m", false)
        snippets.forEach(x => x.recenter())
    }

    destroy() {
        game.remove_drawables_batch(this.rows)
        game.remove_drawable(this.bg)
        const index = snippets.findIndex(x => x === this)
        if (index != -1) snippets.splice(index, 1)
    }

    update(dt) {
        this.confD.timeLeft -= dt
        if (this.confD.timeLeft <= 0) {
            this.destroy()
            return
        }
        if (this.confD.justDeclared && this.confD.toKD === myKingdomID) //blink red if it is a threat!
            game.animator.add_anim(
                Anim.setter(this.rows[0], 500, "color", "red", { ditch: true }))
    }
}

/**@type {Snippet[]} */
const snippets = []


//#region panes
class QPane extends Panel {
    static bgDefault = new Button()
    static answerSpaceDefault = new Button()
    static calculatorSpaceDefault = new Button()
    /**
     * 
     * @param {number} qID 
     * @param {Button} bg 
     */
    constructor(qID, id, bg) {
        super()
        this.qID = qID //question id
        this.id = id //conflict id
        this.snippet = snippets.find(x => x.id == id)
        bg ??= QPane.bgDefault.copy
        bg.tag = "QPane bg"
        this.components.push(bg)
        const question = Question.ALL[qID]
        const [imgB, latexB, txtB] = bg.splitRow(
            question.img !== undefined ? 7 : 0, //watch out for 0
            question.latex ? 1 : 0,
            question.txt ? 1 : 0
        ).map(x => Button.fromRect(x))
        if (question.img !== undefined) {//watch out for 0
            cropper.load_img(RULES.PICTURE_PATH + question.img + RULES.PICTURE_EXTENSION, (t) => imgB.img = t)
            imgB.tag = "QPane imgB component"
            this.components.push(imgB)
        }
        if (question.latex) {
            Button.make_latex(latexB, question.latex, 0)
            latexB.tag = "QPane latexB component"
            this.components.push(latexB)
        }
        if (question.txt) {
            txtB.txt = question.txt
            txtB.fontSize = GRAPHICS.QUESTION_FONTSIZE
            txtB.tag = "QPane txtB component"
            this.components.push(txtB)
        }
        const answerSpace = QPane.answerSpaceDefault.copy
        const ansBunch = answerSpace.splitCol(.5, 1, .5, 1.5).map(x => Button.fromRect(x))
        const [ansLab, ansDisplayShow, ansSubmitButton, ansInfo] = ansBunch
        const ansInfoTxt = this.snippet.rows.slice(0, -1).map(x => x.txt).join(" ")
        ansInfo.dynamicText = () => ansInfoTxt + " " + MM.toMMSS(this.snippet.confD.timeLeft)
        ansLab.txt = "Your answer:"
        ansSubmitButton.txt = "Submit"
        ansSubmitButton.color = myColor
        ansSubmitButton.outline = 6
        ansDisplayShow.color = myColor
        ansBunch.forEach(x => {
            x.fontSize = 36
        })
        ansDisplayShow.fontSize = 52
        // this.components.push(...ansBunch)
        this.components.push(ansLab, ansInfo, ansDisplayShow, ansSubmitButton)


        this.guess = ""
        const calculatorButtons = QPane.calculatorSpaceDefault.splitGrid(4, 3).flat().map(x => Button.fromRect(x))
        calculatorButtons.forEach((x, i) => {
            x.color = myColor
            x.shrinkToSquare()
            x.deflate(20, 20)
            x.fontSize = 48
            x.spread(QPane.calculatorSpaceDefault.centerX, QPane.calculatorSpaceDefault.centerY,
                1, .6
            )
            if (i < 9) {
                x.txt = i + 1
                x.on_click = () => this.guess += `${i + 1}`
            }
            if (i == 10) {
                x.txt = 0
                x.on_click = () => this.guess += "0"
            }
            if (i == 9) {
                x.txt = "."
                x.on_click = () => this.guess = this.guess == "" ? "0." : this.guess.split("").filter(x => x != ".").join("") + "."
            }
            if (i == 11) {
                x.txt = "-/+"
                x.fontSize *= 1.2
                x.on_click = () => this.guess = this.guess[0] == "-" ? this.guess.slice(1) : "-" + this.guess
            }
            x.on_click = MM.extFunc(x.on_click, () => GameEffects.sendFancy(
                x, ansDisplayShow, 500 //duplicated belove
            ))
        })
        const delButton = calculatorButtons.at(-1).copy
        delButton.txt = "Del"
        delButton.move(
            0, calculatorButtons[3].y - calculatorButtons[0].y)
        delButton.on_click = () => {
            this.guess = ""
            GameEffects.sendFancy(delButton, ansDisplayShow, 500)//duplicated above
        }
        this.components.push(delButton)
        ansDisplayShow.dynamicText = () => this.guess
        this.components.push(...calculatorButtons)


        ansSubmitButton.on_click = () => {
            if (this.guess == "") return //do not send empty
            chat.sendSecure({
                attempt: this.id,
                guess: +this.guess //send as number
            })
            this.guess = "" //to prevent spam a bit
            //to prevent spam fully
            game.animator.add_anim(Anim.setter(ansSubmitButton, 1000, ["txt", "interactable"], ["Submitting...", false]))
        }

        if (RULES.SHOW_QUESTION_ID) {
            const revealer = new Button()
            revealer.width = 60
            revealer.height = 40
            revealer.rightat(bg.right)
            revealer.topat(bg.top)
            revealer.txt = "Q" + qID
            this.components.push(revealer)
        }

        const backToMapButton = calculatorButtons[1].copy
        backToMapButton.on_click = () => setFocus("map")
        backToMapButton.color = "lightgray"
        backToMapButton.stretch(2.4, .7)
        backToMapButton.txt = "Back to Map"
        backToMapButton.fontSize = 36
        backToMapButton.centeratY((calculatorButtons[1].top + 50) / 2)
        this.components.push(backToMapButton)


        this.deactivate()
        this.components.forEach(x => x.tag = "QPanePart")
        game.add_drawable(this)


    }

}
//#region focus
/**@type {Map<number,QPane} */
const panes = new Map()
let focus = "map" //"map" or id of the QPane which is the same as conflict id
const setFocus = (tgt) => {
    //requesting a pane not yet available accepts the conflict
    if (tgt == "map") {//focusing on map means closing all panes
        panes.values().forEach(x => x.deactivate())
        game.showingMap = true
    } else if (tgt != "map" && !panes.has(tgt)) {
        waitingQuestionsTrigger.add(tgt) //on waitlist so no need to double click
        chat.sendMessage({ accept: tgt }) //accept then quit, accept defaults to update if must
        tgt = "map"
        panes.values().forEach(x => x.deactivate())
        return //otherwise quit
    } else if (focus == "map" && tgt != "map") {//switching away from map
        game.showingMap = false
        panes.get(tgt).activate()
    } else if (focus != "map" && focus != tgt) {//switching between panes
        panes.get(focus).deactivate()
        panes.get(tgt).activate()
    } else if (focus == tgt && focus != "map") {//same pane means close pane
        panes.get(focus).deactivate()
        game.showingMap = true
        tgt = "map"
    }
    focus = tgt
}


