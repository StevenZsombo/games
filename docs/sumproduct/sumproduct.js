var univ = {
    isOnline: false,
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: false,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "smooth",
    //BROKEN
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    //BROKEN
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_first_run_blocking: null,
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: true,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}


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

    //#region initialize_more
    initialize_more() {
        const BALL_COUNT = 24
        const SQ = MM.pipe(BALL_COUNT, Math.sqrt, Math.floor)
        const W = 36
        let numbers = []
        /**@type {Button[]} */
        const balls = Array(BALL_COUNT).fill().map(() => new Button())
        const refresh = function (b) {
            if (b.tail) {
                b.tail.x = b.x + W * 2
                b.tail.y = b.y
                b.tail.refresh()
            }
        }
        const reRepr = function (b) {
            const last = searchDown(b).at(-1)
            const full = searchUp(last)
            full.forEach((x, i) => {
                x.txt = full.length - i
                x.repr = 0
            })
            full.at(-1).repr = full.length
            numbers = balls.map(x => x.repr).filter(x => x != 0)
        }
        const searchDown = function (b) {
            let res = [b]
            let last = b
            while (last.tail) {
                res.push(last.tail)
                last = last.tail
            }
            return res
        }
        const searchUp = function (b) {
            let res = [b]
            let first = b
            while (first.head) {
                res.push(first.head)
                first = first.head
            }
            return res
        }
        const brightColors = ["Lime", "Magenta", "Cyan", "Orange", "Chartreuse", "Red", "SpringGreen", "DodgerBlue", "DeepPink", "Yellow", "Gold", "LawnGreen", "MediumSlateBlue", "HotPink", "Aquamarine", "Coral", "RoyalBlue", "Plum", "Tomato", "MediumOrchid", "Peru", "Khaki", "LightCoral", "Blue"];

        const recolor = function (b, color) {
            if (!color) {
                const existing = new Set(balls.map(x => x.color))
                const next = brightColors.find(x => !existing.has(x))
                color = next ?? MM.randomColor()
            }
            let fullTail = searchDown(b)
            fullTail.forEach(x => x.color = color)
            console.log(`recolored ${fullTail.map(x => x.tag).join(",")}`)
        }
        const separate = function (b) {
            if (!b.head) return
            console.log(`separated ${b.tag} from ${b.head.tag}`)
            b.head.tail = null
            reRepr(b.head)
            b.head = null
            recolor(b)
            reRepr(b)
        }
        const join = (b) => {
            const hit = balls.filter(x => (x !== b) && x.collidepoint(this.mouser.x, this.mouser.y))[0]
            if (!hit) return
            const sd = searchDown(hit)
            const su = searchUp(hit)
            if (su.slice(1).includes(b) || sd.slice(1).includes(b)) return
            let last = sd.at(-1)
            console.log(`joined ${b.tag} to ${last.tag}`)
            b.head = last
            last.tail = b
            let first = su.at(-1)
            last.refresh()
            recolor(first, first.color)
            reRepr(last)

        }
        // Rect.packArray(balls, this.rect.copy.splitGrid())
        let isDraggingWhat = null
        balls.forEach((b, i) => {
            Button.make_circle(b)
            Button.make_draggable(b)
            b.width = W
            b.tag = i
            b.repr = 0 //0 or actual value
            b.isBall = true
            b.txt = i + 1
            b.fontSize = 36
            b.tail = i == 0 ? null : balls[i - 1]
            b.head = (i == balls.length - 1) ? null : balls[i + 1]
            // b.isBlocking = true //bad idea
            b.on_click = () => { b.isBlocking = true; separate(b) }
            b.refresh = () => refresh(b)
            b.on_drag_more = () => { refresh(b); isDraggingWhat = b }
            b.on_release = () => {
                if (isDraggingWhat !== b) return
                join(b); b.isBlocking = false; isDraggingWhat = null
            }
        })
        reRepr(balls.at(-1))
        balls.at(-1).topleftat((this.rect.width - BALL_COUNT * W * 2) / 2, 400)
        recolor(balls.at(-1))
        balls.at(-1).refresh()
        balls.at(-1).repr = BALL_COUNT
        this.add_drawable(balls)

        const topLab = new Button()
        topLab.topleftat(20, 0)
        topLab.rightstretchat(this.rect.width)
        topLab.height = 240
        topLab.font_font = "myMonospace"
        topLab.fontSize = 36
        topLab.transparent = true
        topLab.textSettings = { textAlign: "left" }
        topLab.dynamicText = () =>
            `Group the ${BALL_COUNT} marbles so that the product of the sizes of groups is maximual!` +
            `\nDragging a marble drags all other marbles to its right.` +
            `\nDrag onto an existing group to merge the two groups.`
        this.add_drawable(topLab)
        const botLab = topLab.copy
        botLab.fontSize = 30
        botLab.dynamicText = () =>
            `\nYour group sizes, their sum, and their product:\n` +
            `${numbers.join(" + ")} = ${numbers.reduce((s, t) => s + t, 0)}\n` +
            `${numbers.join(" * ")} = ${numbers.reduce((s, t) => s * t, 1)} `

        botLab.bottomat(this.rect.bottom)
        this.add_drawable(botLab)


        const outDrawable = {
            draw: (ctx) => {
                const outBalls = balls.filter(b => b.x - b.width * .5 > this.rect.width)
                const outMap = new Map()
                outBalls.forEach(b => outMap.set(b.x, b))
                Array.from(outBalls.entries()).forEach(([x, ball]) => {
                    const yy = ball.y
                    MM.drawArrow(ctx, this.rect.width - 80, yy, this.rect.width - 30, yy,
                        { color: ball.color, size: 10, txt: "more" }
                    )
                })
            }
        }
        this.add_drawable(outDrawable, 4)

        Object.assign(window, { balls, topLab, botLab })
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
