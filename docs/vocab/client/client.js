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
    allowQuietReload: false,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}
//#endregion


class Game extends GameShared {
    //#region initialize_more
    initialize_more() { }
    async initialize_async() {
        this.mall = new Malleable()
        this.add_drawable(this.mall)




        this.makeLevel()
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


    /**@param {Level} l  */
    makeLevel(l) {
        if (typeof l === "string") { l = levels[l] }
        else if (!l) { l = MM.choice(Array.from(Object.values(levels))) }
        if (!l) throw new Error("invalid level code")
        this.l = l
        this.mall.length = 0
        const [top, mid, bot] =
            this.rect.copy.deflate(200, 200).splitRow(2, 7, 1).map(Button.fromRect)
        const x = l.x?.() ?? 0
        const a = l.a?.(x) ?? fluff([], 10, 1, 100) //array or none for default
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
            const wrongButtons = []
            answerButtons.forEach((b, i) => {
                if (b.selected === l.f(x, a[i])) {//correct answer


                } else { //wrong answer
                    wrongButtons.push(b)

                }

            })
            if (wrongButtons.length) alert("Wrong\n" + wrongButtons.map(x => x.latex.tex))
            else {
                this.makeLevel()
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
