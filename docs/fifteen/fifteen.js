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


class Game extends GameCore {
    //#region initialize_more
    initialize_more() {
        const letters = Array.from("ABC DEF GHI JKL MNO").filter(x => x != " ")

        class Girl extends Button {
            isBlocking = false
            constructor(name) {
                super()
                this.name = this.txt = name
                this.fontSize = 32
                this.height = this.width = 32
                Button.make_circle(this)
            }
            isOriginal = false
            spawnCopy() {
                return new GirlCopy(this)
            }
            on_click = function (pos) {
                const c = this.spawnCopy()
                c.last_held = c.last_clicked = pos
            }

        }

        class GirlCopy extends Girl {
            constructor(girl) {
                super(girl.name)
                this.x = girl.x
                this.y = girl.y
                this.original = girl
                this.eraseClickables()
                this.isBlocking = true
                Button.make_draggable(this)
                game.add_drawable(this, 5)
            }
            erase() { game.remove_drawable(this) }
            on_release = function () {

            }
        }
        /**@type {Map<string,Girl} */
        const originals = new Map()
        letters.forEach(n => {
            const g = new Girl(n)
            g.isOriginal = true
            // g.width = g.height = 40
            originals.set(n, g)
        })
        const origininalsArray = Array.from(originals.values())


        class Triple extends Button {
            /**@type {Set<Girl} */
            girls = new Set()
            day = null
        }

        class Day extends Button {
            /**@type {Triple[]}*/
            triples = Array(5).fill().map(_ => new Triple())
            constructor() {
                super()
                this.triples.forEach(x => x.day = this)
            }
        }

        const days = Array(7).fill().map(_ => new Day())
        const allTriples = days.flatMap(x => x.triples)

        const [upper, middle, lower] = this.rect.copy.stretch(.95, .95).splitRow(1, 3, 1)
        Rect.packArray(days, middle.splitGrid(1, days.length).flat(), true)
        days.forEach(x => x.deflate(20, 20))
        days.forEach(x => Rect.packArray(x.triples, x.splitGrid(5, 1).flat(), true))
        days.forEach(x => x.triples.forEach(y => y.deflate(10, 10)))
        lower.leftat(days[0].left)
        lower.rightstretchat(days.at(-1).right)
        lower.stretch(.75, 1)
        Rect.packRow(origininalsArray, lower, "justify", "m", false)










        this.add_drawable(days, 2)
        this.add_drawable(allTriples, 2)
        this.add_drawable(origininalsArray, 2)

        Object.assign(this, { days, originals })













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
