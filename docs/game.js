var univ = {
    isOnline: false,
    framerateUnlocked: true,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "smooth",
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_next_game_once: null,
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
        if (stgs.stage !== -1) {
            this.makeLevel()
        } else (
            this.levelSelector()
        )






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
    //#region levelSelector
    levelSelector() {
        const levelList = Object.keys(stgs.levels)
        const numberOfLevels = levelList.length
        const sq = Math.ceil(Math.sqrt(numberOfLevels))
        const infoButton = new Button({ width: this.WIDTH })
        const lvlButtons = this.rect.copy.
            stretch(.9, .6).
            topat(200).
            splitGrid(sq, sq).flat().
            slice(0, numberOfLevels).
            map(x => x.stretch(.8, .8)).
            map(Button.fromRect)

        lvlButtons.forEach((x, i) => {
            x.txt = Object.keys(stgs.levels)[i]
            x.fontSize = 40
            x.on_release = () => {
                stgs.stage = levelList[i]
                main()
            }
        })
        infoButton.centeratY(lvlButtons[0].top / 2)
        infoButton.transparent = true
        infoButton.txt = "Select level:"
        infoButton.fontSize = 48

        const bottomButton = infoButton.copy
        bottomButton.centeratY((lvlButtons.at(-1).bottom + this.HEIGHT) / 2)
        bottomButton.txt =
            `If you can solve any of the ones with the ? please let me know.
Some might not be possible.`

        this.add_drawable(lvlButtons)
        this.add_drawable(infoButton)
        this.add_drawable(bottomButton)
    }
    //#endregion
    //#region makeLevel
    makeLevel() {
        const reactor = new Reactor(this, 6, 6, 210, 150)
        this.add_drawable(reactor)
        this.reactor = reactor
        window.r = reactor
        reactor.start()//remove later

        const speedButtonsBG = new Rect(0, 0, 600, 60)
        speedButtonsBG.bottomat(reactor.buttonsMatrix.at(-1).at(-1).bottom)
        speedButtonsBG.rightat(this.WIDTH - 20)
        const speedButtons = speedButtonsBG.splitCol(15, 10, 10, 10, 10, 10).map(Button.fromRect)
        speedButtons.forEach((b, i) => {
            b.txt = ["Speed:", "STOP", ".25x", "1x", "2x", "8x"][i]
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
        reactor.loadLevel(stgs.levels[stgs.stage])

    }
    //#endregion
    //#region dropDown
    dropDownEnd() {
        this.remove_drawables_batch(this.menu)
        this.menu = null
        this.reactor.buttonsMatrix.flat().forEach(x => x.color = "white")
    }

    dropDown(cols = 2) {
        if (this.menu) {
            this.dropDownEnd()
            return
        }
        const reactor = this.reactor
        reactor.LCB.color = "fuchsia"
        const menu = Object.keys(Reactor.t).map((x, i) => new Button({
            txt: x,
            color: Reactor.isMovementType(x) ? "plum" : "pink",
            hover_color: "fuchsia",
            on_click: () => x != "TODO" && reactor.addPiece(...reactor.LCP, x),
        }))
        menu.forEach((x, i) => x.move(0, i * x.height))
        const del = menu[0].copy
        del.on_click = () => reactor.removePiecesAt(...reactor.LCP)
        //del.move(0, menu.at(-1).height)
        del.txt = "Delete this"
        menu.push(del)
        const delAll = menu[0].copy
        delAll.on_click = () => reactor.pieces.forEach(x => reactor.removePiece(x))
        delAll.txt = "Delete all"
        menu.push(delAll)
        const box = new Rect(
            this.mouser.x + 10, this.mouser.y + 10,
            300,//reactor.width * .5 * cols,
            500 //reactor.height * .5 * Math.ceil(menu.length / cols)
        )
        box.fitThisWithinAnotherRect(game.rect)
        Rect.packArray(menu, box.splitGrid(Math.ceil(menu.length / cols), cols).flat(), true)
        this.add_drawable(menu)
        //this.add_drawable(box)
        menu.forEach(x => {
            x.on_click = MM.extendFunction(x.on_click, this.dropDownEnd.bind(this))
            x.isBlocking = true
        })
        this.menu = menu
    }
    //#endregion

} //this is the last closing brace for class Game

//#region dev options
/// dev options
const dev = {
    add: (type) => window.r.addPiece(...window.r.LCP, type)

}/// end of dev


