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
    allowQuietReload: true,
    acquireNameMoreStr: "(English name + homeroom)"
}

var myKingdomID


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

        const ks = game.rect.copy.splitCell(3, 1, 4, 1, 1, 1).splitGrid(1, RULES.NUMBER_OF_TEAMS).flat().map(x => Button.fromRect(x))
        game.add_drawable(ks)

        ks.forEach((b, i) => {
            b.color = Kingdom.defaultColors[i]
            b.shrinkToSquare()
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
        location.reload()
    }

    //#region initialize_more
    initialize_more() {
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
        //shallow
        const conflicts = []

        this.kingdoms = kingdoms
        this.territories = territories
        this.conflicts = conflicts

        contest.on_share = (shared, value) => {
            if (shared == "territoriesFullData") {
                // if (territories.length) return
                game.remove_drawables_batch(territories.map(x => x.button))
                territories.length = 0
                territories.push(...Territory.manyFromData(value))
                game.add_drawable(territories.map(x => x.button))
                this.buts = territories.map(x => x.button)
                waitTrigger()
            }
            if (shared == "kingdomsFullData") {
                // if (kingdoms.length) return
                kingdoms.length = 0
                kingdoms.push(...Kingdom.manyFromData(value))
                waitTrigger()
            }
            if (shared == "ownershipData") {
                if (!kingdoms.length || !territories.length) return
                value.forEach(x => {
                    kingdoms[x.id].territories = new Set(x.territories.map(u => territories[u]))
                    x.territories.forEach(u => territories[u].button.color = kingdoms[x.id].color)
                })
            }
            if (shared == "valuesData") {
                if (!territories.length) return
                value.forEach(x => territories[x.id].value = x.value)
            }
            if (shared == "conflictsData") {
                value = value.filter(x => x.fromKD === myKingdomID || x.toKD === myKingdomID)
                value.forEach(x => {
                    const match = snippets.find(u => u.id === x.id)
                    if (match) match.confD.timeLeft = x.timeLeft
                    else snippets.push(new Snippet(x))
                })
                const serverIDs = value.map(x => x.id)
                snippets.filter(x => !serverIDs.includes(x.id)).forEach(x =>
                    x.destroy()
                )
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

        let waitSetup = 2
        const waitTrigger = () => {
            waitSetup -= 1
            if (!waitSetup) {
                chat.sendSecure({ inquire: "ownershipData" })
                chat.sendSecure({ inquire: "valuesData" })
                chat.sendSecure({ inquire: "conflictsData" })
                chat.sendSecure({ inquire: "rankingData" })
                init_after_basics()
                //dont bother tracking for now
            }
        }
        chat.sendSecure({ inquire: "territoriesFullData" })
        chat.sendSecure({ inquire: "kingdomsFullData" })


        const init_after_basics = () => {
            const top = Button.fromRect(game.rect.splitCell(1, 1, 20, 1))
            top.visible = false
            this.top = top

            //first it label, last is status
            const ranking = top.splitGrid(1, RULES.NUMBER_OF_TEAMS + 3).flat().slice(0, -1).map(x => Button.fromRect(x))
            ranking.at(-1).width *= 2
            ranking[0].txt = "Teams:"
            ranking.at(-1).txt = `You: ${chat.name} (${kingdoms[myKingdomID].name})`
            ranking.at(-1).font_color = kingdoms[myKingdomID].color
            this.ranking = ranking
            ranking.forEach(b => {
                b.outline = 0
                b.color = "gray"

            })
            game.add_drawable(ranking)

            const bot = Button.fromRect(game.rect.splitCell(-1, 1, 5.5, 1))
            Snippet.bgDefault.resize(180, bot.height - 20)
            Snippet.bgDefault.topat(bot.top)
            Snippet.bgDefault.leftat(bot.left + 20)
            this.bot = bot
            const right = Button.fromRect(game.rect.splitCell(1, 10, 1, 10))
            right.topat(top.bottom)
            right.bottomstretchat(bot.top)
            this.right = right

            const left = Button.fromButton(right)
            left.leftat(0)
            this.left = left
            this.add_drawable([left, right, top, bot], 3)
                ;[left, right, top, bot].forEach(x => {
                    x.outline = 0
                })

            const attackButton = new Button({ width: 200, height: 150 })
            attackButton.fontSize = 30
            attackButton.bottomat(bot.top)
            attackButton.rightat(right.left)
            attackButton.move(-30, -30)
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
                attackButton.txt = "Waiting for\nserver..."
                this.animator.add_anim(Anim.delay(500, { on_end: () => attackButton.deactivate() }))
            }

        }





    }

    _showingMap = true
    get showingMap() { return this._showingMap }
    set showingMap(bool) {
        if (bool === this._showingMap) return bool
        this._showingMap = bool
        this.buts.forEach(x => x.activeState = bool)
        this.attackButton.activeState = bool
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
        snippets.forEach(x => x.update(dt))








    }

    //#endregion
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region draw_more
    draw_before(screen) {
        if (this.showingMap)
            this.territories?.forEach(t => {
                t.connections.forEach(oth =>
                    MM.drawLine(screen,
                        t.button.centerX, t.button.centerY, oth.button.centerX, oth.button.centerY,
                        { width: 3 })
                )
            })

    }
    draw_more(screen) {
        if (this.showingMap)
            if (this.territories?.length && this.kingdoms?.length && contest?.shared?.conflictsData)
                for (const c of contest?.shared?.conflictsData) {
                    if (c.alreadyResolved) continue
                    MM.drawArrow(screen,
                        ...this.territories[c.from].button.centerXY,
                        ...this.territories[c.to].button.centerXY,
                        { color: c.justDeclared ? GRAPHICS.ATTACK_BEFORE_RESPONSE_COLOR : GRAPHICS.ATTACK_TEAM_COLOR(this.kingdoms[c.fromKD].color), width: 10, size: 30 }
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


class Snippet {
    static bgDefault = new Button()
    /**@param {Button} bg  */
    constructor(confD, bg) {
        this.confD = confD
        this.id = confD.id
        bg ??= Snippet.bgDefault.copy
        this.bg = bg
        /**@type {Button[]} */
        const rows = bg.splitRow(1, 1, 1, 1).map(x => Button.fromRect(x))
        this.rows = rows
        let color
        if (confD.fromKD === myKingdomID) {//attacking
            color = game.kingdoms[confD.toKD].color
            rows[0].txt = "attacking"
            rows[1].txt = game.kingdoms[confD.toKD].name + " in"
            // rows[1].color = color
            rows[2].txt = game.territories[confD.to].nameShort
        } else {
            color = game.kingdoms[confD.fromKD].color
            rows[0].txt = "defending"
            rows[1].txt = game.territories[confD.to].nameShort
            rows[2].txt = "from " + game.kingdoms[confD.fromKD].name
            // rows[2].color = color
        }
        rows[3].dynamicText = () => MM.toMMSS(this.confD.timeLeft)
        rows.forEach(x => {
            x.outline = 0
            x.color = color
        })
        this.recenter()
        //adds itself
        game.add_drawable(rows)
        // bg.deflate(-10, -10)
        bg.outline = 10
        game.add_drawable(bg, 4)
        bg.isBlocking = true
        bg.on_click = () => console.log("clicked", this)
    }
    recenter() {
        Rect.packCol(this.rows, this.bg, 0, "c", true)
    }
    static rearrange() {
        Rect.packRow(snippets.map(x => x.bg), game.bot.copy.deflate(40, 0), 20, "m", false)
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
        if (this.confD.timeLeft < 0) this.destroy()
    }
}

/**@type {Snippet[]} */
const snippets = []


