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
                this.size = this.r
                this.ang = 0
                /**@type {?Bone} */
                this.head = null
                /**@type {?Bone} */
                this.tail = null

                this.cap = 30 * ONEDEG
            }
            polar(ang = 0, rCoeff = 1) {
                return {
                    x: this.x + this.size * rCoeff * Math.cos(ang + this.ang),
                    y: this.y + this.size * rCoeff * Math.sin(ang + this.ang)
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
            /**
             * @param {Bone} bone  
            */
            capTo(bone) {
                let diff = this.ang - bone.ang
                while (diff > PI) diff -= TWOPI
                while (diff < -PI) diff += TWOPI
                if (Math.abs(diff) <= this.cap) return //this.ang = bone.ang
                const clampedDiff = diff > 0 ? this.cap : -this.cap
                this.ang = bone.ang + clampedDiff
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
                // Button.make_draggable(head)
                head.on_drag = (pos) => {
                    head.x += (pos.x - head.x) * 0.03
                    head.y += (pos.y - head.y) * 0.03
                    MM.drawCircle(game.screen,
                        pos.x, pos.y, 5, { color: "blue" }
                    )
                }
                head._drag_force_within = true
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

        const sizes = [64, 84, 90, 87, 83, 77, 64, 60, 51, 38, 32, 19, 12]
            .map(x => x * .6)
        const radii = sizes
        /*
        [64, 84, 90, 87, 83, 77, 64, 60, 51, 38, 32, 19, 12]
        .map(x => x * .6)
        */
        const bones = sizes.map(_ => new Bone())
        bones.forEach((b, i) => {
            b.x = 800 - i * 200
            b.r = radii[i]
            b.size = sizes[i]
            if (i != 0) b.head = bones[i - 1]
            if (i != bones.length - 1) b.tail = bones[i + 1]
        })

        const bonesDrawable = {
            update(dt) {

                bones.forEach((b, i) => {
                    if (b.head) b.snapTo(b.head)
                })
                // bones[0].capTo(bones[1])
                bones[0].ang = bones[1].ang

            },


            /**@param {RenderingContext} ctx */
            draw(ctx) {


                {
                    ctx.save()
                    const { x, y } = bones[3].polar(-NINETYDEG)
                    ctx.translate(x, y)
                    ctx.rotate(bones[4].ang + 30 * ONEDEG)
                    MM.drawEllipse(ctx, 0, 0, 40, 20, {
                        color: "lightblue", outline: 2, outline_color: "black"
                    })
                    ctx.restore()
                }
                {
                    ctx.save()
                    const { x, y } = bones[3].polar(NINETYDEG)
                    ctx.translate(x, y)
                    ctx.rotate(bones[4].ang - 30 * ONEDEG)
                    MM.drawEllipse(ctx, 0, 0, 40, 20, {
                        color: "lightblue", outline: 2, outline_color: "black"
                    })
                    ctx.restore()
                }

                {
                    ctx.save()
                    const { x, y } = bones[6].polar(-NINETYDEG)
                    ctx.translate(x, y)
                    ctx.rotate(bones[4].ang + 30 * ONEDEG)
                    MM.drawEllipse(ctx, 0, 0, 25, 12, {
                        color: "lightblue", outline: 2, outline_color: "black"
                    })
                    ctx.restore()
                }
                {
                    ctx.save()
                    const { x, y } = bones[6].polar(NINETYDEG)
                    ctx.translate(x, y)
                    ctx.rotate(bones[4].ang - 30 * ONEDEG)
                    MM.drawEllipse(ctx, 0, 0, 25, 12, {
                        color: "lightblue", outline: 2, outline_color: "black"
                    })
                    ctx.restore()
                }

                {
                    const last = bones[bones.length - 1]
                    const tailpoints = []
                    tailpoints.push(last.polar(45 * ONEDEG, -1))
                    tailpoints.push(last.polar(-45 * ONEDEG, -1))
                    // tailpoints.push(last.polar(MM.clamp(last.ang, 15 * ONEDEG, 25 * ONEDEG), -6))
                    // tailpoints.push(last.polar(MM.clamp(last.ang, -15 * ONEDEG, -25 * ONEDEG), -6))
                    tailpoints.push(last.polar(-25 * ONEDEG, -6))
                    tailpoints.push(last.polar(25 * ONEDEG, -6))

                    MM.drawQuadraticSpline(ctx, tailpoints,
                        { color: "lightblue", outline: 2, outline_color: "black" }
                    )
                }

                const points = [
                    ...[-60, -30, 0, 30, 60].map(x => bones[0].polar(ONEDEG * x)),
                    ...bones.map(b => b.polar(NINETYDEG)),
                    bones.at(-1).polar(PI),
                    ...bones.map(b => b.polar(-NINETYDEG)).reverse()
                ]


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
                MM.drawQuadraticSpline(ctx, points,
                    { color: "lightblue", outline: 2, outline_color: "black" }
                )

                ctx.fillStyle = "black"
                {
                    ctx.save()
                    const { x, y } = bones[0].polar(-60 * ONEDEG, 0.5)
                    ctx.translate(x, y)
                    ctx.rotate(bones[0].ang + 15 * ONEDEG)
                    MM.drawEllipse(ctx, 0, 0, 10, 8, {
                        color: "black"
                    })
                    ctx.restore()
                }

                {
                    ctx.save()
                    const { x, y } = bones[0].polar(60 * ONEDEG, 0.5)
                    ctx.translate(x, y)
                    ctx.rotate(bones[0].ang - 15 * ONEDEG)
                    MM.drawEllipse(ctx, 0, 0, 10, 8, {
                        color: "black"
                    })
                    ctx.restore()
                }
                {
                    const { x, y } = bones[2].polar(0, 0)
                    const { x: a, y: b } = bones[5].polar(0, 0)
                    const { x: mx, y: my } = bones[3].polar(NINETYDEG, 0.25)
                    // Mirror the control point to the other side for the return curve
                    const { x: mx2, y: my2 } = bones[3].polar(-NINETYDEG, 0.25)

                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    ctx.quadraticCurveTo(mx, my, a, b)     // curve outward along one side
                    ctx.quadraticCurveTo(mx2, my2, x, y)   // curve back along the other side
                    ctx.closePath()
                    ctx.strokeStyle = "black"
                    ctx.stroke()
                    ctx.fillStyle = `hsla(0,0%,0%,0.4)`
                    ctx.fill()
                }

                return
                bones.forEach(b => {
                    MM.drawCircle(ctx, b.x, b.y, b.r, {
                        color: null, outline: 2, outline_color: "black"
                    })
                    ctx.fillStyle = "blue"
                    {
                        // const { x, y } = b.left(b)
                        const { x, y } = b.polar(NINETYDEG)
                        MM.drawCircle(ctx, x, y, 5)
                    } {
                        // const { x, y } = b.right(b)
                        const { x, y } = b.polar(-NINETYDEG)
                        MM.drawCircle(ctx, x, y, 5)
                    }
                })
            }
        }


        this.add_drawable(bonesDrawable)


        // this.add_drawable(bones[0].getButton())
        const head = bones[0].getButton()
        head.color = null
        head.outline = 0
        this.add_drawable(head)



        Object.assign(this, { bones })




        // GameEffects.popup("Gently drag the nose.", { floatTime: 5000, close_on_release: true })



        const fishForward = () => {
            bones[0].x += Math.cos(bones[0].ang) * 1.5
            bones[0].y += Math.sin(bones[0].ang) * 1.5
        }
        const fishLeft = () => {
            bones[0].x += Math.cos(bones[0].ang - 15 * ONEDEG) * 1.5
            bones[0].y += Math.sin(bones[0].ang - 15 * ONEDEG) * 1.5
        }
        const fishRight = () => {
            bones[0].x += Math.cos(bones[0].ang + 15 * ONEDEG) * 1.5
            bones[0].y += Math.sin(bones[0].ang + 15 * ONEDEG) * 1.5
        }
        this.keyboarder.on_keyheldDict["w"] = fishForward
        /*this.keyboarder.on_keyheldDict["s"] = () => { //retard
            bones[0].x += Math.cos(bones[0].ang) * -0.5
            bones[0].y += Math.sin(bones[0].ang) * -0.5
        }*/
        this.keyboarder.on_keyheldDict["a"] = fishLeft
        this.keyboarder.on_keyheldDict["d"] = fishRight

        const controls = game.rect.copy.resize(200 * 3 + 150, 100).bottomat(this.HEIGHT - 10)
            .splitGrid(1, 3).flat().map(x => Button.fromRect(x)).map(x => x.resize(200, 100))
        this.add_drawable(controls, 2)
        controls.forEach((x, i) => {
            x.txt = ["Left", "Forward", "Right"][i]
            x.on_hold = [fishLeft, fishForward, fishRight][i]
        })

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
