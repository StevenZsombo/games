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
        let needleSize = 100
        const insideArea = this.rect.copy.shrinkToSquare()
        const { rect } = this

        const linesX = []
        for (let i = needleSize; i < this.WIDTH; i += needleSize)
            linesX.push(i)


        const Needle = function () {
            this.x = MM.randomInt(insideArea.left, insideArea.right)
            this.y = MM.randomInt(insideArea.top, insideArea.bottom)

            const _x = MM.randomInt(insideArea.left, insideArea.right)
            const _y = MM.randomInt(insideArea.top, insideArea.bottom)
            const dx = _x - this.x
            const dy = _y - this.y
            const mag = Math.hypot(dx, dy)

            this.u = this.x + dx / mag * needleSize
            this.w = this.y + dy / mag * needleSize

            needles.push(this)

            this.draw = ctx => MM.drawLine(ctx, this.x, this.y, this.u, this.w, {
                width: 2, color: this.color
            })

            this.isHitting = (() => {
                const min = Math.min(this.x, this.u) / needleSize
                const max = Math.max(this.x, this.u) / needleSize
                const a = Math.floor(max) - Math.floor(min) > 0
                if (a) hits += 1
                return a
            })()
            this.color = this.isHitting ? "red" : "blue"
        }
        let hits = 0
        const needles = []


        const drawable = {
            /**@param {RenderingContext} ctx  */
            draw(ctx) {
                needles.forEach(n => n.draw(ctx))
                linesX.forEach(x => MM.drawLine(ctx, x, 0, x, rect.bottom, { width: 1, color: "pink" }))
            }
        }


        const addNeedle = (howmany = 10) => {
            for (let i = 0; i < howmany; i++)
                new Needle()
        }

        const button = new Button({
            txt: "Add!",
            on_click: addNeedle
        })
        this.add_drawable(drawable)
        this.add_drawable(button)

        const label = new Button({
            transparent: true,
            dynamicText: () => `Needles = ${needles.length}\n` +
                `Hits = ${hits}\n` +
                `Ratio = ${needles.length / hits}\n` +
                `2*Ratio = ${needles.length / hits * 2}`,
            textSettings: { textAlign: "left" }
        })
        label.topat(button.bottom)
        this.add_drawable(label)
        const addMany = button.copy
        addMany.topat(label.bottom + 100)
        addMany.txt = "Add many"
        addMany.on_click = () => addNeedle(+prompt("How many?", 100))
        this.add_drawable(addMany)



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
