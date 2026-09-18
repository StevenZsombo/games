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


class Game extends GameShared {
    //#region initialize_more
    initialize_more() { }
    async initialize_async() {


        const rightpanel = this.rect.copy
            .splitCell(-1, -1, 2, 3)
            .stretch(.9, .9)
        const buttons = rightpanel.copy
            .shrinkToSquare()
            .splitGrid(4, 4)
            .flat()
            .map(Button.fromRect)
        buttons.forEach(b => {
            b.color = "lightblue"
            b.fontSize = 40
            b.stretch(.9, .9)
        })
            ;
        `1 2 3 Frac 4 5 6 Sqrt 7 8 9 +/- Last 0 Next Del`.split(" ").forEach((x, i) => buttons[i].txt = x)

        const mall = new Malleable()
        this.add_drawable(mall)
        mall.push(...buttons)


        const lat = Button.make_latex(new Button())
        lat.resize(600, 300)
        lat.centeratX(rightpanel.cx)
        lat.centeratY(buttons[0].top / 2)
        lat.color = "white"
        mall.push(lat)
        lat.latex.tex = "hi"

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
