//#region univ
var univ = {
    isOnline: true, //server is offline!
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

class Game extends GameShared {
    //#region initialize_more
    initialize_more() { }
    async initialize_async() {
        if (!this.mall) {
            this.mall = new Malleable()
            this.add_drawable(this.mall)
        }
        this.mall.length = 0
        this.mall.activate()
        this.puzzles = Array.from(Object.values(levels))
        this.puzzles.forEach(p => {
            if (p.w) { for (let i = p.w - 1; i > 0; --i) this.puzzles.push(p) }
        })
        this.puzzles.sort(() => Math.random() - .5)
        this.accuracy = []



        // this.puzzles.length = 3
        // this.puzzles = Array(3).fill().map(_ => levels["mixed"])




        this.nextPuzzle()
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


    nextPuzzle() {
        const p = this.puzzles.pop()
        if (p) this.makeLevel(p)
        else {
            this.mall.length = 0
            const stats =
                Button.fromRect(this.rect.copy.stretch(.9, .8).topat(0),
                    { transparent: true, fontSize: 48, font_font: "myMonospace" })
            const perlevel = this.accuracy.map(x => x[0] / x[1])
            stats.txt = MM.tableStr(
                this.accuracy.map(([corr, tot], i) =>
                    [`Puzzle #${i + 1}`, `${corr}/${tot}`.padStart(5, " "), `${Math.round(corr / tot * 100)}%`.padStart(4, " ")]
                )
            ) + `\nTotal accuracy: ${Math.round(100 * MM.sum(perlevel) / perlevel.length)}%`
            this.mall.push(stats)
            const refresh = Button.fromRect(stats.copyRect)
                .topat(stats.bottom + 30)
                .bottomstretchat(this.HEIGHT - 30)
            refresh.fontSize = 48
            refresh.txt = "Play again."
            refresh.on_click = () => GameEffects.confirmBox("Are you sure?").promise()
                .then(() => this.initialize_async())
                .catch(() => { })
            this.mall.push(refresh)
            this.mall.activate()
        }
    }
    /**@param {Level} l  */
    makeLevel(l) {
        if (typeof l === "string") { l = levels[l] }
        else if (!l) { l = MM.choice(Array.from(Object.values(levels))) }
        if (!l) throw new Error("invalid level code")
        this.l = l
        this.mall.length = 0
        this.mall.activate()
        const [top, mid, bot] =
            this.rect.copy.deflate(200, 200).splitRow(2, 7, 1).map(Button.fromRect)
        const x = l.x?.() ?? 0
        const a =
            l.answers ??
            l.a?.(x) ??
            fluff([], 10, 1, 100) //array or none for default
        console.log({ a, x })
        let t = typeof l.t === "string" ? l.t : l.t(x) //string or function
        t = LatexManager.dollarToPure(t + "$$")
        Button.make_latex(top, t)
        top.transparent = true


        const answerButtons = mid.splitGrid(2, 5).flat()
            .map(Button.fromRect)
        answerButtons.forEach((b, i) => {
            b.stretch(.7, .7)
            b.shrinkToSquare()

            Button.make_checkbox(b)
            Button.make_latex(b, "" + a[i], GRAPHICS.imgScale)
            b.hover_color = null
            b.hover_selected_color = null

        })

        const submit = Button.fromRect(bot.copy.stretch(.35, 1))
        submit.fontSize *= 2
        submit.txt = "Submit"
        submit.on_release = () => reveal()


        const reveal = () => {
            // answerButtons.forEach(x => x.interactable = false)
            /**@type {Button[]} */
            const solutions =
                l.solutions ??
                a.map(k => l.f(x, k))

            const wrongButtons = answerButtons.filter((b, i) => b.selected != solutions[i])
            this.accuracy.push([solutions.length - wrongButtons.length, solutions.length])
            if (wrongButtons.length) { //something wrong
                // alert("Wrong\n" + wrongButtons.map(x => x.latex.tex))
                let t = 0
                const badCirclesDrawable = {
                    draw: ctx => answerButtons.forEach((b, i) => {
                        if (b.selected == solutions[i]) return
                        if (!b.selected) { //unselected right answer: circled
                            MM.drawEllipse(ctx, b.centerX, b.centerY,
                                b.width * t, b.height * t,
                                { color: null, outline: 10, outline_color: "red" })
                        } else { //selected incorrect answer: crossed out
                            const x = b.centerX
                            const y = b.centerY
                            MM.drawLine(ctx,
                                x - b.width * t, y - b.height * t, x + b.width * t, y + b.height * t,
                                { color: "red", width: 10 }
                            )
                            MM.drawLine(ctx,
                                x - b.width * t, y + b.height * t, x + b.width * t, y - b.height * t,
                                { color: "red", width: 10 }
                            )

                        }
                    })
                }
                this.mall.push(badCirclesDrawable)
                Anim.custom({}, 1000, animTime => {
                    t = animTime * .6
                }, "", { add: this })

                submit.on_release = null
                submit.transparent = true
                submit.txt = "Correct your mistakes!"
                const checkAll = () => {
                    if (answerButtons.every((b, i) => b.selected === solutions[i])) {
                        //mistakes corrected: load next puzzle
                        submit.txt = "Corrected! Loading next..."
                        Anim.delay(1000, { on_end: () => this.nextPuzzle(), add: this })
                        this.mall.interactable = false

                    }
                }
                answerButtons.forEach(b => b.on_release = checkAll)

            }
            else { //all good! load next puzzle.
                submit.transparent = true
                submit.txt = "Great! Loading next..."
                this.mall.interactable = false
                new Promise(resolve =>
                    GameEffects.popup("Correct!", {
                        posFrac: [.5, .5], sizeFrac: [.3, .3], floatTime: 800, travelTime: 200,
                        moreButtonSettings: { color: "green", fontSize: 72, },
                        on_end: resolve
                    }))
                    .then(() => this.nextPuzzle())
            }
        }

        this.mall.push(top, ...answerButtons, submit)

    }

    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
