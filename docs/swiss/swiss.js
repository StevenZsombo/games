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
    on_first_run: null,
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: false,
    acquireNameMoreStr: "(English name + homeroom)"
}

const MASTER = false

const SCORE_ON_WIN = 3
const SCORE_ON_TIE = 1
const DEFAULT_COLOR = "lightblue"
const WIN_COLOR = "lightgreen"
const LOSE_COLOR = "white"
const TIE_COLOR = "lightgreen"
const RIGHT = 200

//#region Play
class Player {
    constructor(name = "unnamed") {
        this.name = name
        this.score = 0
        this.scoreToBeGained = 0
        this.partner = null
        this.resolved = false

        this.button = new Button({
            height: 100,
            width: 140,
            fontSize: 32,
            color: DEFAULT_COLOR,
            dynamicText: () =>
                `${this.name}\n${this.score}${this.scoreToBeGained ? " + " + this.scoreToBeGained : ""}`,
            on_click: () => {
                if (!this.partner) return
                this.partner.scoreToBeGained = 0
                this.partner.button.color = LOSE_COLOR
                this.scoreToBeGained = SCORE_ON_WIN
                this.button.color = WIN_COLOR
                this.resolved = true
                this.partner.resolved = true
            },
            isBlocking: true
        })
        game.add_drawable(this.button)
    }

}

/**@type {Array<Player>} */
const players = []
/**@type {Array<Button} */
let tieButtons = []
const round = 0
let COLS = 3


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
    /**@param {Player[]} playerList  */
    rearrange(playerList) {
        playerList ??= players
        if (playerList.length == 0) return
        const cols = game.rect.copy.deflate(RIGHT, 0).leftat(0).splitGrid(1, COLS).flat()
        cols.forEach(x => x.stretch(.8, 1))
        const ROWS = Math.ceil(playerList.length / (2 * COLS))
        console.log(cols.map(x => x.splitGrid(ROWS, 2).flat()))
        Rect.packArray(
            playerList.map(x => x.button),
            cols.flatMap(x => x.splitGrid(ROWS, 2).flat()).flat()
        )
        const correctionX = -playerList[0].button.x + 30
        const correctionY = -playerList[0].button.y + 30
        playerList.map(x => x.button).forEach(x => {
            x.move(correctionX, correctionY)
            x.color = DEFAULT_COLOR
        })

        this.remove_drawables_batch(tieButtons)
        tieButtons.length = 0
        playerList.slice(0, -1).forEach((a, i) => { //ignore last player 
            if (i % 2) return //ignore players on the right side
            const b = playerList[i + 1]
            a.partner = b
            b.partner = a //match partners
            const tie = new Button({
                width: 60,
                height: 60,
                txt: "TIE",
                on_click: () => {
                    a.scoreToBeGained = SCORE_ON_TIE
                    b.scoreToBeGained = SCORE_ON_TIE
                    a.button.color = TIE_COLOR
                    b.button.color = TIE_COLOR
                    a.resolved = true
                    b.resolved = true
                }
            })
            tie.centeratX((a.button.centerX + b.button.centerX) / 2)
            tie.centeratY(a.button.centerY)
            tieButtons.push(tie)
        })
        this.add_drawable(tieButtons)




    }

    get buts() {
        return players.map(x => x.button)
    }

    nextRound(forced = false) {
        if (!players.every(x => x.resolved == players[0].resolved)) {
            if (prompt("Not all matches have been finished yet.\nType OVERRIDE to advance anyways.") !== "OVERRIDE") { return }
        } else if (!confirm("Do you want to advance to the next round?")) return
        let sorted = [...players] //same by reference, lets shuffle it.
        sorted.forEach(x => {
            x.score += x.scoreToBeGained
            x.scoreToBeGained = 0
            x.button.color = DEFAULT_COLOR
            x.resolved = false
        })
        sorted.sort(() => Math.random() - .5)
        sorted.sort((x, y) => y.score - x.score) //mutating
        this.rearrange(sorted)



    }

    erasePlayerList() {
        if (confirm("Remove existing players?")) {
            game.remove_drawables_batch(players.map(x => x.button))
            players.length = 0
        }
    }
    //#region initialize_more
    initialize_more() {
        MASTER && players.push(...Array(30).fill().map((x, i) => new Player(`player ${i}`)))
        const setPlayers = new Button()
        setPlayers.txt = "Add players"
        setPlayers.width = RIGHT
        setPlayers.on_release = () => {
            const list = prompt("Player names copied from Excel, \n or separated by commas and semicolons")
            if (!list) return
            players.push(...list
                .split("\r").join("")
                .split("\n")
                .flatMap(x => x.split(","))
                .flatMap(x => x.split(";"))
                .map(x => new Player(x)))
            if (!round) this.rearrange()
        }
        setPlayers.rightat(this.rect.right)
        setPlayers.topat(0)
        this.add_drawable(setPlayers)


        const advance = setPlayers.copy
        advance.move(0, advance.height * 1.5)
        advance.txt = "Next round"
        advance.on_release = this.nextRound.bind(this)
        this.add_drawable(advance)


        this.timeCount = 6 * 60 * 1000
        const timer = new Button()
        timer.fontSize = 200
        timer.transparent = true
        timer.dynamicText = () => MM.toMMSS(this.timeCount)
        const timerSet = new Button()
        timerSet.txt = "Set"
        timerSet.on_click = () => {
            this.timeCount = prompt("Set timer for (minutes):") * 60 * 1000
        }
        timerSet.width = advance.width * .45
        timerSet.leftat(advance.left)
        timerSet.bottomat(this.rect.bottom)
        const timerStart = timerSet.copy
        timerStart.txt = "Start"
        timerStart.rightat(advance.right)
        timerStart.bottomat(this.rect.bottom)
        let timerIsRunning = false
        timerStart.on_click = () => {
            if (timerIsRunning) return
            timerIsRunning = true
            const a = setInterval(() => {
                this.timeCount -= 1000
                if (this.timeCount <= 0) {
                    this.timeCount = 0
                    timerIsRunning = false
                    clearInterval(a)
                }
            }, 1000)
        }
        timer.width = 400
        timer.height = 400
        timer.bottomat(timerSet.top)
        timer.rightat(this.rect.right)
        this.add_drawable([timer, timerSet, timerStart])

    }

    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {








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




} //this is the last closing brace for class Game

//#region dev options
/// dev options
const dev = {


}/// end of dev
