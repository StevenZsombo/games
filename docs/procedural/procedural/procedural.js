//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: true,
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
    initialize_more() {

        class Bone {
            constructor() {
                this.x = 400
                this.y = 400
                this.r = 50
                this.ang = 0
                /**@type {?Bone} */
                this.head = null
                /**@type {?Bone} */
                this.tail = null
            }
            boundaryAt(ang = 0) {
                return {
                    x: this.x + this.r * Math.cos(ang + this.ang),
                    y: this.y + this.r * Math.sin(ang + this.ang)
                }
            }
            /**@param {Bone} bone  */
            snapTo(bone) {
                const dx = bone.x - this.x
                const dy = bone.y - this.y
                const factor = 1 - bone.r / Math.hypot(dx, dy)
                this.x += dx * factor
                this.y += dy * factor
                this.ang = Math.atan2(dy, dx)
            }
            /**@deprecated */
            left() {
                if (!this.head) return { x: this.x, y: this.y }
                const { x, y } = this.head
                const dx = x - this.x
                const dy = y - this.y
                return { x: -dy + this.x, y: dx + this.y }
            }
            /**@deprecated */
            right() {
                if (!this.head) return { x: this.x, y: this.y }
                const { x, y } = this.head
                const dx = x - this.x
                const dy = y - this.y
                return { x: dy + this.x, y: -dx + this.y }

            }

            getButton() {
                const head = new Button()
                Button.make_draggable(head)
                const bone = this
                Object.defineProperty(head, 'x', {
                    get() { return bone.x },
                    set(v) { bone.x = v }
                })
                Object.defineProperty(head, 'y', {
                    get() { return bone.y },
                    set(v) { bone.y = v }
                })
                head.draw = ctx => {
                    MM.drawCircle(ctx, bone.x, bone.y, bone.r, {
                        outline: head.outline,
                        outline_color: head.outline_color,
                        color: head.color
                    })
                }
                head.collidepoint = (x, y) => {
                    return Math.hypot(x - bone.x, y - bone.y) < bone.r
                }
                return head
            }
        }

        const sizes = [64, 84, 90, 87, 83, 77, 64, 60, 51, 38, 32, 19, 15]
            .map(x => x * .6)
        const bones = sizes.map(_ => new Bone())
        bones.forEach((b, i) => {
            b.x = 300 + i * 200
            b.r = sizes[i]
            if (i != 0) b.head = bones[i - 1]
            if (i != bones.length - 1) b.tail = bones[i + 1]
        })

        const bonesDrawable = {
            update(dt) {
                bones.forEach(b => {
                    if (b.head) b.snapTo(b.head)
                })
                bones[0].ang = bones[1].ang
            },
            /**@param {RenderingContext} ctx */
            draw(ctx) {

                const points = [
                    ...[-60, -30, 0, 30, 60].map(x => bones[0].boundaryAt(ONEDEG * x)),
                    ...bones.map(b => b.boundaryAt(NINETYDEG)),
                    bones.at(-1).boundaryAt(PI),
                    ...bones.map(b => b.boundaryAt(-NINETYDEG)).reverse()
                ]

                ctx.beginPath()
                const n = points.length

                for (let i = 0; i <= n; i++) {//quadratic
                    const p = points[i % n]
                    const next = points[(i + 1) % n]
                    const mid = { x: (p.x + next.x) / 2, y: (p.y + next.y) / 2 }
                    if (i == 0)
                        ctx.moveTo(mid.x, mid.y)
                    else
                        ctx.quadraticCurveTo(p.x, p.y, mid.x, mid.y)
                }
                // ctx.closePath()
                /*
                                for (let i = 0; i < n; i++) { //cubic
                                    const p0 = points[(i - 1 + n) % n]  // previous
                                    const p1 = points[i]                 // current
                                    const p2 = points[(i + 1) % n]       // next
                                    const p3 = points[(i + 2) % n]       // next next
                
                                    // Control points: 1/6th of the way from each corner toward its neighbors
                                    const cp1 = {
                                        x: p1.x + (p2.x - p0.x) / 6,
                                        y: p1.y + (p2.y - p0.y) / 6
                                    }
                                    const cp2 = {
                                        x: p2.x - (p3.x - p1.x) / 6,
                                        y: p2.y - (p3.y - p1.y) / 6
                                    }
                
                                    if (i === 0) {
                                        ctx.moveTo(p1.x, p1.y)
                                    }
                                    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y)
                                }
                                */
                ctx.fillStyle = "lightblue"
                ctx.fill()
                ctx.strokeStyle = "black"
                ctx.lineWidth = 3
                ctx.stroke()
                return
                bones.forEach(b => {
                    MM.drawCircle(ctx, b.x, b.y, b.r, {
                        color: null, outline: 2, outline_color: "black"
                    })
                    ctx.fillStyle = "blue"
                    {
                        // const { x, y } = b.left(b)
                        const { x, y } = b.boundaryAt(NINETYDEG)
                        MM.drawCircle(ctx, x, y, 5)
                    } {
                        // const { x, y } = b.right(b)
                        const { x, y } = b.boundaryAt(-NINETYDEG)
                        MM.drawCircle(ctx, x, y, 5)
                    }
                })
            }
        }


        this.add_drawable(bonesDrawable)


        // this.add_drawable(bones[0].getButton())
        const head = bones[0].getButton()
        head.color = null
        head.outline = 1
        this.add_drawable(head)



        Object.assign(this, { bones })
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
