//#region univ
var univ = {
    isOnline: false, //server is offline!
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
    allowQuietReload: true,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}
//#endregion

const em = new EventManager()


class Game extends GameCore {
    //#region initialize_more
    initialize_more() {

        const names = "ABCDEFGHJKLMNOPQRSTUVWXYZ@"
        const ranking = MM.shuffle(MM.rangeArr(25))
        const lineup = this.rect.copy.resize(null, 300).deflate(20, 0).topat(0)
            .splitGrid(1, 25).flat().slice(0, 25).map(x => Button.fromRect(x))
        const horses = lineup.map((x, i) => ({
            button: x,
            id: i,
            name: names[i],
            rank: ranking.indexOf(i),
        }))
        horses.forEach(x => {
            x.button.txt = x.name
            x.button.fontSize = 32
            x.button.shrinkToSquare()
            x.button.topat(5)
            x.button.deflate(5, 5)
            x.button.on_click = () => em.emit("selected", x.id)
            x.button.dynamicColor = () => !selected.has(x.id) ? colors.idle : selectedColor
        })
        let SIZE = horses[0].button.width

        this.add_drawable(lineup)

        let selectedColor = "lightblue"
        /**@type {Set<number>} */
        const selected = new Set()
        const races = []
        const colors = {
            idle: "white",
            select: "blue",
            race: "green",
            tooMany: "red",
            gold: "gold",
            silver: "silver",
            bronze: "brown"
        }
        const guesses = []
        let isInGuessMode = false
        let isGuessedAlrady = false
        em.on("selected", i => {
            if (isInGuessMode) {
                if (i != null) {
                    horses[i].button.dynamicColor = null
                    horses[i].button.color = [colors.gold, colors.silver, colors.bronze][guesses.length]
                    guesses.push(i)
                    if (guesses.length == 3) checkVictory()
                }
                guessButton.txt = `Click the ${["1st", "2nd", "3rd"][guesses.length]} fastest horse.`
                return
            }
            if (i != null)
                selected.has(i) ? selected.delete(i) : selected.add(i)
            if (selected.size == 0) {
                raceButton.color = colors.idle
                raceButton.txt = "Select 5 to race"
            }
            else if (selected.size < 5) {
                selectedColor = raceButton.color = colors.select
                raceButton.txt = "Select 5 to race"
            }
            else if (selected.size == 5) {
                selectedColor = raceButton.color = colors.race
                raceButton.txt = "Click here to race!"
            }
            else if (selected.size >= 6) {
                selectedColor = raceButton.color = colors.tooMany
                raceButton.txt = "Deselect all (too many)"
            }
        })
        em.on("deselect", () => { selected.clear(); em.emit("selected") })

        const raceFive = /**@param {number[]} whichFive*/(whichFive) => {
            whichFive ??= Array.from(selected)
            const j = whichFive.map(k => [k, horses[k].rank])
            j.sort((x, y) => x[1] - y[1])
            races.push(j.map(x => x[0]))
            em.emit("race")
            em.emit("deselect")


        }

        const guessThree = (whichThree) => {

        }
        let afterMessage = ""
        const checkVictory = () => {
            isInGuessMode = false
            guessButton.deactivate()
            lineup.forEach(x => x.eraseClickables())
            if (guesses.every((k, i) => k == ranking[i])) { //win
                afterMessage = "\n\nVictory!!!"
            } else { //lose
                afterMessage = "\n\nWrong guesses, you lost."
                    + "\nCorrect order:\n"
                    + ranking.map(k => horses[k].name).join(" ")
            }
        }
        const raceButton = new Button({
            width: 400, height: SIZE, color: colors.idle,
            fontSize: 32, txt: "Select 5 to race"
        })
        raceButton.topat(horses[horses.length - 1].button.bottom + 30)
        raceButton.rightat(horses[horses.length - 1].button.right)
        this.add_drawable(raceButton)
        raceButton.on_click = () => {
            if (selected.size == 5) raceFive(Array.from(selected))
            else em.emit("deselect")

        }


        const guessButton = raceButton.copy
        guessButton.eraseClickables()
        guessButton.move(0, raceButton.top - horses[horses.length - 1].button.top)
        this.add_drawable(guessButton)
        guessButton.txt = "Guess"
        guessButton.on_click = () => {
            if (isGuessedAlrady) return
            if (!confirm("Want to guess? you can only guess once")) return
            raceButton.deactivate()
            isInGuessMode = true
            isGuessedAlrady = true
            em.emit("deselect")
            // em.emit("selected")
        }


        const tableLab = new Button({ transparent: true, font_font: "myMonospace", fontSize: 32 })
        tableLab.dynamicText = () =>
            `Races:\n`
            + races.map(x => x.map(x => horses[x].name).join(" ")).join("\n")
            + (!guesses.length ? "" : "\n" + guesses
                .map(x => horses[x].name)
                .map((x, i) => `Guess #${i + 1}: ${x}`).join("\n"))
            + afterMessage
        tableLab.leftat(horses[0].button.left)
        tableLab.rightstretchat(horses[horses.length - 1].button.right)
        tableLab.topat(raceButton.bottom)
        tableLab.bottomstretchat(this.HEIGHT)
        tableLab.textSettings.textAlign = "left"
        tableLab.textSettings.textBaseline = "top"
        this.add_drawable(tableLab)
        Object.assign(this, { raceButton, horses, names, ranking, lineup, em, races })

    }
    //#endregion

    //#region update_more
    update_more(dt) {






    }
    //#endregion


    //#region draw_more
    draw_more(screen) {






    }
    //#endregion

    //#region next_loop_more
    next_loop_more() {




    }//#endregion



    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
