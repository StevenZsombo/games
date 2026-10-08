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
        const buts = rightpanel.copy
            .shrinkToSquare()
            .splitGrid(4, 4)
            .flat()
            .map(Button.fromRect)
        buts.forEach(b => {
            b.color = "lightblue"
            b.fontSize = 40
            b.stretch(.9, .9)
        })
            ;
        `1 2 3 Frac 4 5 6 Sqrt 7 8 9 +/- Last 0 Next Del`.split(" ").forEach((x, i) => buts[i].txt = x)

        const mall = new Malleable()
        this.add_drawable(mall)
        mall.push(...buts)


        const lat = Button.make_latex(new Button())
        lat.resize(600, 300)
        lat.centeratX(rightpanel.cx)
        lat.centeratY(buts[0].top / 2)
        lat.color = "white"
        mall.push(lat)
        lat.latex.tex =
            String.raw`$y=\bbox[lightblue,border:1px black]{\phantom*}x+\bbox[border:1px black]{\phantom*}$`


        const bg =
            Button.fromRect(
                game.rect.copy.stretch(.6, .9).leftat(20))
        bg.color = "white"
        const plt = new Plot(MM.brokenLineFunction(-2, 3, 6, 5), bg)
        plt.addControls(this.mouser, bg)
        plt.highlightedPoints.push([-2, 3])

        mall.push(bg)
        mall.push(plt)

        Object.assign(this, { plt, bg, lat, mall, buts })
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
