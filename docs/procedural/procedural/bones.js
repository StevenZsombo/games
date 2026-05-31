class Bone {
    constructor(skeleton) {
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
        /**@type {?Skeleton} */
        this.skeleton = skeleton
    }
    polar(ang = 0, rCoeff = 1) {
        return {
            x: this.x + this.size * rCoeff * Math.cos(ang + this.ang),
            y: this.y + this.size * rCoeff * Math.sin(ang + this.ang)
        }
    }
    polarAbsolute(ang, rCoeff = 1) {
        return {
            x: this.x + this.size * rCoeff * Math.cos(ang),
            y: this.y + this.size * rCoeff * Math.sin(ang)
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
     * @deprecated
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

    crawlTo(pos, crawlCoeff = 0.03) {
        this.x += (pos.x - this.x) * crawlCoeff
        this.y += (pos.y - this.y) * crawlCoeff

    }
    getButton() {
        const button = new Button()
        button.tag = "boneButton"
        button._bone = this
        button.visible = false
        button.isBlocking = true
        button.on_drag = (pos) => {
            button.x += (pos.x - button.x) * 0.03
            button.y += (pos.y - button.y) * 0.03
            // MM.drawCircle(game.screen, pos.x, pos.y, 5, { color: "blue" })
        }
        button._drag_force_within = true
        const bone = this
        Object.defineProperty(button, 'x', {
            get() { return bone.x },
            set(v) { bone.x = v }
        })
        Object.defineProperty(button, 'y', {
            get() { return bone.y },
            set(v) { bone.y = v }
        })
        /*head.draw = ctx => {
            MM.drawCircle(ctx, bone.x, bone.y, bone.r, {
                outline: head.outline,
                outline_color: head.outline_color,
                color: head.color
            })
        }*/
        button.collidepoint = (x, y) => {
            return Math.hypot(x - bone.x, y - bone.y) < bone.r
        }
        return button
    }
}


class Skeleton {
    /**@type {Bone[]}*/
    bones = []
    constructor(
        sizes = [64, 84, 90, 87, 83, 77, 64, 60, 51, 38, 32, 19, 12]
            .map(x => x * .6),
        radii = [],
    ) {
        sizes.forEach((x, i) => this.addBone(x, radii[i])) //r defaults to 30 anyways
        this.bones.forEach((b, i) => { b.x = 800 - i * 200 })
    }

    addBone(size, r) {
        const bone = new Bone(this)
        bone.size = size
        bone.r = r ?? 30
        if (this.bones.length) {
            bone.head = this.bones.at(-1)
            this.bones.at(-1).tail = bone
        }
        this.bones.push(bone)
    }

    rebone(sizes, radii = []) {
        if (!sizes) throw new Error("sizes array can't be empty or null")
        this.bones.splice(sizes.length)
        for (let i = this.bones.length; i < sizes.length; i++)
            this.addBone(5)
        sizes.forEach((x, i) => {
            this.bones[i].size = x
            if (radii[i]) this.bones[i].r = radii[i]
        })
    }

    /**@param {RenderingContext} ctx */
    draw(ctx) {
        const points = this.getPoints()
        this.draw_below(ctx, points)
        this.draw_skeleton(ctx, points)
        this.draw_above(ctx, points)
        this.draw_circles(ctx, points)
    }
    getPoints() {
        const { bones } = this
        return [
            ...[-60, -30, 0, 30, 60].map(x => bones[0].polar(ONEDEG * x)),
            ...bones.map(b => b.polar(NINETYDEG)),
            bones[bones.length - 1].polar(PI),
            ...bones.map(b => b.polar(-NINETYDEG)).reverse()
        ]

    }

    draw_below(ctx, points) { }
    outline_color = "black"
    color = "darkred"
    outline = 2
    draw_skeleton(ctx, points) {
        const { bones } = this
        MM.drawQuadraticSpline(ctx, points,
            { color: this.color, outline: this.outline, outline_color: this.outline_color }
        )
    }
    draw_above(ctx, points) { }

    isDrawingCircles = false
    isDrawingPoints = false
    draw_circles(ctx, points) {
        const { bones } = this
        if (this.isDrawingCircles) {
            bones.forEach(b => {
                MM.drawCircle(ctx, b.x, b.y, b.size, {
                    color: null, outline: 2, outline_color: "black"
                })
            })
        }
        if (this.isDrawingPoints)
            points.forEach(p => MM.drawCircle(ctx, p.x, p.y, 5, { color: "black", outline: 0 }))

    }

    update(dt) {
        const { bones } = this
        bones.forEach((b, i) => {
            if (b.head) b.snapTo(b.head)
        })
        // bones[0].capTo(bones[1])
        bones[0].ang = bones[1].ang

    }

    straighten() {
        const fisrtAng = this.bones[0].ang
        this.bones.forEach((b, i) => {
            if (i != 0) {
                const { x, y } = this.bones[i - 1].polarAbsolute(fisrtAng, -1)
                b.x = x
                b.y = y
            }
        })
        // this.update(0)
    }
}


class Fish extends Skeleton {
    color = "lightblue"
    fins = [
        { anchor: 3, angleDeg: 30, width: 0.8, height: 0.4 },
        { anchor: 6, angleDeg: 30, width: 0.65, height: 0.3 },
    ]
    tail = [
        [45, -1], [-45, -1], [-25, -6], [25, -6]
    ]
    dorsal = [2, 3, 5]
    draw_below(ctx) {
        const { bones } = this
        this.fins.forEach(fin => [1, -1].forEach(side => { //fins are guided by the bone before the anchor
            const anchor = (fin.anchor + this.bones.length) % this.bones.length
            if (!bones[anchor] || !bones[anchor - 1]) return
            ctx.save()
            const { x, y } = bones[anchor].polar(-NINETYDEG * side)
            ctx.translate(x, y)
            ctx.rotate(bones[anchor - 1].ang + fin.angleDeg * ONEDEG * side)
            MM.drawEllipse(ctx, 0, 0, bones[anchor].size * fin.width, bones[anchor].size * fin.height,
                { color: this.color, outline: this.outline, outline_color: this.outline_color }
            )
            ctx.restore()
        }))

        const last = bones[bones.length - 1] //tail is static for now
        const tailpoints = this.tail.map(x => last.polar(x[0] * ONEDEG, x[1]))
        MM.drawQuadraticSpline(ctx, tailpoints,
            { color: this.color, outline: this.outline, outline_color: this.outline_color }
        )

    }
    eye_color = "black"
    draw_above(ctx, points) {
        const { bones } = this
        ctx.fillStyle = "black"
        {
            ctx.save()
            const { x, y } = bones[0].polar(-60 * ONEDEG, 0.5)
            ctx.translate(x, y)
            ctx.rotate(bones[0].ang + 15 * ONEDEG)
            MM.drawEllipse(ctx, 0, 0, bones[0].size * .3, bones[0].size * .25, {
                color: this.eye_color
            })
            ctx.restore()
        }

        {
            ctx.save()
            const { x, y } = bones[0].polar(60 * ONEDEG, 0.5)
            ctx.translate(x, y)
            ctx.rotate(bones[0].ang - 15 * ONEDEG)
            MM.drawEllipse(ctx, 0, 0, bones[0].size * .3, bones[0].size * .25, {
                color: this.eye_color
            })
            ctx.restore()
        }
        {//draw dorsal

            const dorsal = this.bones
                // .slice(2, Math.ceil(this.bones.length * .5))
                .filter((_, i) => i == 2 || i == Math.ceil(this.bones.length * .3) || i == Math.ceil(this.bones.length * .45))
            MM.drawQuadraticSpline(ctx, [
                ...dorsal.map((x, i) => x.polar(-NINETYDEG, Math.sin(i * PI / dorsal.length) / 5)),
                dorsal[dorsal.length - 1].polar(0, -1),
                ...dorsal.map((x, i) => x.polar(NINETYDEG, Math.sin(i * PI / dorsal.length) / 5)).reverse(),
            ],
                { color: `hsla(0,0%,0%,0.3)`, outline: 2, outline_color: "black" })

            /*
            const { x, y } = bones[this.dorsal[0]].polar(0, 0)
            const { x: mx, y: my } = bones[this.dorsal[1]].polar(NINETYDEG, 0.25)
            const { x: mx2, y: my2 } = bones[this.dorsal[1]].polar(-NINETYDEG, 0.25)
            const { x: a, y: b } = bones[this.dorsal[2]].polar(0, 0)

            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.quadraticCurveTo(mx, my, a, b)     // curve outward along one side
            ctx.quadraticCurveTo(mx2, my2, x, y)   // curve back along the other side
            ctx.closePath()
            ctx.strokeStyle = "black"
            ctx.stroke()
            ctx.fillStyle = `hsla(0,0%,0%,0.4)`
            ctx.fill()
            */
        }
    }

    static getFishShape() {
        const length = MM.randomInt(10, 20) + 4
        const minSize = MM.random(5, 10)
        const maxSize = MM.clamp(MM.random(15, 50), 10, 50)
        const multiplier = 1.5
        const sizes = MM.rangeArr(length)
            .map(x => x / length)
            .map(x => x * PI)
            .map(x => Math.sin(x))
            .map(x => x * maxSize + minSize)
            .map(x => x * multiplier)
            .map(x => MM.toDP(x, 2))
            .slice(4, -1)
        sizes[0] *= MM.random(.75, .9)
        sizes.push(sizes.at(-1) * MM.random(0.4, 0.7))
        return sizes
    }

}


class Snake extends Skeleton {

}