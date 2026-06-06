//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
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
    async initialize_more() {
        const buts = Array(50).fill().map(_ => new Rect(MM.randomInt(0, this.WIDTH), MM.randomInt(0, this.HEIGHT), MM.random(30, 150), MM.random(20, 80)))
            .map(x => Button.fromRect(x))
        this.add_drawable(buts)
        buts.forEach(x => Button.make_draggable(x))
        GameEffects.balls(
            buts
        )
        const game = this
        const c = document.createElement("canvas")
        c.width = game.width
        c.height = game.height
        const ctx = this.canvas.getContext("2d")
        const peep = {
            x: 200, y: 200, radius: 200,
            color: `hsla(240,90%,30%,0.8)`,
            update(dt) {
                this.x = game.mouser.pos.x
                this.y = game.mouser.pos.y
            },
            /**@param {CanvasRenderingContext2D} screen*/
            draw(screen) {
                const { x, y, radius, color } = this
                screen.save()
                // screen.globalCompositeOperation = 'destination-in';
                screen.beginPath();
                screen.rect(0, 0, game.WIDTH, game.HEIGHT)
                screen.arc(x, y, radius, 0, Math.PI * 2);
                screen.fillStyle = color
                screen.fill("evenodd");
                screen.restore()
            },
        }
        this.mouser.on_wheel = (delta) => {
            peep.radius = MM.clamp(peep.radius - 10 * Math.sign(delta.wheel), 1, 2000)

        }

        this.add_drawable(peep, 9)







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
