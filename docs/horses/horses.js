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
            beats: new Set(),
        }))
        horses.forEach(x => {
            x.button.txt = x.name
            x.button.isBlocking = true
            x.button.fontSize = 32
            x.button.shrinkToSquare()
            x.button.topat(5)
            x.button.deflate(5, 5)
            x.button.on_click = () => em.emit("selected", x.id)
            x.button.dynamicColor = () => !selected.has(x.id) ? colors.idle : selectedColor
        })
        let SIZE = horses[0].button.width
        const FONTSIZE = 32

        this.add_drawable(lineup)

        let selectedColor = "lightblue"
        /**@type {Set<number>} */
        const selected = new Set()
        const races = []
        const colors = {
            idle: "white",
            select: "lightblue",
            race: "lightgreen",
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


        const faster = Array(25).fill().map(() => Array(25).fill(0))
        this.faster = faster
        const raceFive = /**@param {number[]} whichFive*/(whichFive) => {
            whichFive ??= Array.from(selected)
            const j = whichFive.map(k => [k, horses[k].rank])
            j.sort((x, y) => x[1] - y[1])
            races.push(j.map(x => x[0]))
            const fiveHorses = j.map(x => horses[x[0]])
            fiveHorses.forEach((horse, index) => {
                const others = fiveHorses.slice(index + 1, 5)
                others.forEach(loser => {
                    horse.beats.add(loser.id)
                    faster[horse.id][loser.id] = 1
                    /*for (let transitive of loser.beats)
                    horse.beats.add(transitive)
                    */ //do this later...
                })
            })
            transitiveClosure()
            em.emit("race")
            em.emit("deselect")

        }

        const transitiveClosure = () => {
            const n = faster.length;
            for (let k = 0; k < n; k++) {
                for (let i = 0; i < n; i++) {
                    if (faster[i][k]) {
                        for (let j = 0; j < n; j++) {
                            if (faster[k][j]) {
                                faster[i][j] = 1;
                            }
                        }
                    }
                }
            }
            return faster;
        }
        this.transitiveClosure = transitiveClosure

        const guessThree = (whichThree) => {

        }
        let afterMessage = ""
        const checkVictory = () => {
            isInGuessMode = false
            guessButton.deactivate()
            lineup.forEach(x => x.eraseClickables())
            if (guesses.every((k, i) => k == ranking[i])) { //win
                const evilness = evil()
                if (!evilness) {
                    afterMessage = "\n\nVictory!!!"
                    return
                }
                ranking.splice(0, 25, ...evilness) //here comes the evil
            }
            { //lose by default if no return
                afterMessage = "\n\nWrong guesses, you lost."
                    + "\nCorrect order:\n"
                    + ranking.map(k => horses[k].name).join(" ")
            }
        }
        const evil = () => {
            // Assumes `faster` (25x25 matrix, 1 if i faster than j) and `guesses` (array of 3 indices) are in scope.
            function getCounterexampleOrder() {
                const n = faster.length;
                const [g1, g2, g3] = guesses;

                function canBeTop3(a, b, c) {
                    for (let h = 0; h < n; h++) {
                        if (h !== a && faster[h][a]) return false;
                        if (h !== a && h !== b && faster[h][b]) return false;
                        if (h !== a && h !== b && h !== c && faster[h][c]) return false;
                    }
                    return true;
                }

                function completeOrder(a, b, c) {
                    const order = [a, b, c];
                    const remaining = new Set();
                    for (let h = 0; h < n; h++) {
                        if (h !== a && h !== b && h !== c) remaining.add(h);
                    }
                    while (remaining.size > 0) {
                        let next = null;
                        for (let h of remaining) {
                            let hasFaster = false;
                            for (let x of remaining) {
                                if (x !== h && faster[x][h]) {
                                    hasFaster = true;
                                    break;
                                }
                            }
                            if (!hasFaster) {
                                next = h;
                                break;
                            }
                        }
                        if (next === null) return null;
                        order.push(next);
                        remaining.delete(next);
                    }
                    return order;
                }

                // Collect all possible top-3 triples that differ from the guess
                const candidates = [];
                for (let a = 0; a < n; a++) {
                    for (let b = 0; b < n; b++) {
                        if (b === a) continue;
                        for (let c = 0; c < n; c++) {
                            if (c === a || c === b) continue;
                            if (a === g1 && b === g2 && c === g3) continue;
                            if (canBeTop3(a, b, c)) {
                                candidates.push([a, b, c]);
                            }
                        }
                    }
                }

                // Shuffle candidates using Fisher-Yates
                for (let i = candidates.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
                }

                // Try each candidate in random order
                for (const [a, b, c] of candidates) {
                    const order = completeOrder(a, b, c);
                    if (order) return order;
                }

                return null;
            }

            return getCounterexampleOrder();
        }

        const raceButton = new Button({
            width: 400, height: SIZE, color: colors.idle,
            fontSize: FONTSIZE, txt: "Select 5 to race"
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
            // if (!confirm("Want to guess? you can only guess once")) return
            const doit = () => {
                raceButton.deactivate()
                isInGuessMode = true
                isGuessedAlrady = true
                em.emit("deselect")
                // em.emit("selected")
            }
            const cb = GameEffects.confirmBox("Are you sure you want to guess the top 3?\nYou can only guess them once per game!").promise()
                .then(doit)
                .catch(() => { })
        }
        /**@type {Button} */
        const shapeButton = guessButton.copy
        shapeButton.eraseClickables()
        shapeButton.bottomat(this.HEIGHT - 20)
        shapeButton.txt = "Menu"
        const origShape = horses.map(h => h.button.topleft)
        const shapeToOrig = () => horses.map(h => h.button).forEach((b, i) => b.topleftatV(origShape[i]))
        // const shapeToSquare = () =>
        //     Rect.packArray(horses.map(h => h.button),
        //         game.rect.copy.resize(700, 700).splitGrid(5, 5).flat())
        const shapeToNumber = num =>
            Rect.packArray(horses.map(h => h.button),
                game.rect.copy.resize(900, 900).move(80, 0).splitGrid(Math.ceil(25 / num), num).flat().slice(0, 25))
        const shapeToSquare = () => shapeToNumber(5)
        Object.assign(this, { shapeToOrig, shapeToSquare, shapeButton })
        this.add_drawable(shapeButton)
        const resizingAll = factor => {
            horses.map(h => h.button).forEach(b => {
                b.resize(SIZE * factor, SIZE * factor)
                b.fontSize = FONTSIZE * factor
            })
        }
        shapeButton.on_release = () =>
            GameEffects.dropDownBetter([
                ["Line", shapeToOrig],
                ["Threes", shapeToNumber.bind(0, 3)],
                ["Fours", shapeToNumber.bind(0, 4)],
                ["Fives", shapeToNumber.bind(0, 5)],
                ["Sixes", shapeToNumber.bind(0, 6)],
                ["Sevens", shapeToNumber.bind(0, 7)],
                ["Eights", shapeToNumber.bind(0, 8)],
                ["Larger", () => resizingAll(2)],
                ["Smaller", () => resizingAll(1)],
                ["Reset", () => chat?.silentReload() ?? location.reload()]
            ].concat(
                !location.search.includes("cheat") ? [] :
                    [["CHEAT", () => {
                        const out = "Solution:\n" + ranking.map(x => horses[x].name).join("")
                        console.log(out)
                        alert(out)
                    }]]
            ))


        const tableLab = new Button({ transparent: true, font_font: "myMonospace", fontSize: 32 })
        tableLab.dynamicText = () =>
            `Record of races:\n`
            + races.map(x => x.map(x => horses[x].name).join(" ")).join("\n")
            + (!guesses.length ? "" : "\n" + guesses
                .map(x => horses[x].name)
                .map((x, i) => `Guess #${i + 1}: ${x}`).join("\n"))
            + afterMessage
        tableLab.leftat(horses[0].button.left)
        // tableLab.rightstretchat(horses[horses.length - 1].button.right)
        tableLab.rightstretchat(guessButton.left - 20)
        tableLab.topat(raceButton.bottom)
        tableLab.bottomstretchat(this.HEIGHT - 20)
        tableLab.textSettings.textAlign = "left"
        tableLab.textSettings.textBaseline = "top"
        this.add_drawable(tableLab, 4)
        Button.make_draggable(tableLab)
        tableLab.transparent = false
        tableLab.outline = 2
        tableLab.color = "transparent"
        Object.assign(this, { raceButton, horses, names, ranking, lineup, em, races, guesses })




        this.cheat = () => ranking.map(x => horses[x].name)

        if (location.search.includes("five") || location.search.includes("square")) {
            shapeToNumber(5)
            resizingAll(2)
        }
        if (!"cheat menu debug dev".split(" ").some(x => location.search.includes(x)))
            shapeButton.deactivate()
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
