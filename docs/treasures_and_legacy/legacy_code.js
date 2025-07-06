
/*Particle: original purpose: particle effects.
Deprecated now, due to custom object + animation being FAR superior.
Reserve dedicated objects for dedicated game items. For effects, just extend the
animations module.*/
class Particle {
    constructor(x, y, color, lifeTime, size = 1, velX, velY, img = null) {
        Object.assign(this, { x, y, color, size, lifeTime, img, velX, velY })
    }

    draw(screen) {
        MM.drawCircle(screen, this.x, this.y, this.size, {
            color: this.color
        })
    }

    update(dt) {
        this.lifeTime -= dt
        if (this.lifeTime < 0) {
            this.kill()
            return
        }
        this.logic(dt)
    }
    logic(dt) {
        //TODO
    }

    /**
     * @returns {boolean}
     */
    update_lifetime(dt) {
        this.lifeTime -= dt
        if (this.lifeTime > 0) {
            return true
        }
        this.kill()
        return false
    }
    kill() {
        game.remove_clickable(this)
    }


    forceWithinRect(rect) {
        const bound = rect.copy.deflate(this.width * 2, this.width * 2).boundWithinInfo(this.x, this.y)
        if (bound.leftOut || bound.rightOut) {
            this.velX *= -1
        }
        if (bound.topOut || bound.bottomOut) {
            this.velY *= -1
        }
        [this.x, this.y] = [bound.x, bound.y]
        return this
    }

    get boundingRect() {
        return new Rect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2)
    }

    static fireworks(pos, howmany = 50, howlong = 6000, howbig = 2) {
        const { x, y } = pos
        const ret = []
        for (let i = 0; i < howmany; i++) {
            const theta = MM.random(-60, 180 + 60) * ONEDEG
            const vX = Math.cos(theta) * MM.random(.2, 1) / 10
            const vY = -Math.sin(theta) * MM.random(.2, 1) / 10
            const p = new Particle(x, y,
                MM.choice("red green blue orange".split(" ")),
                howlong,
                howbig,
                vX,
                vY
            )
            ret.push(p)
            const logic = function (dt) {
                this.x += this.velX * dt
                this.velX = Math.sign(this.velX) * Math.max(0, Math.abs(this.velX) - .00002 * dt)
                this.velY += dt * 0.00005
                this.y += this.velY * dt
            }
            p.logic = logic
        }
        return ret
    }


}

/*RectRotatedExperimental: original purpose: rotated rect with drawing and hitbox.
Deprecated now, as I refactored the Rect methods into Button,
and the static rotation methods into MM.
*/
class RectRotatedExperimental extends Rect {
    constructor(rect) {
        super(rect.x, rect.y, rect.width, rect.height)
        this.rad = 0
    }

    get deg() {
        return this.rad / ONEDEG
    }
    set deg(degree) {
        this.rad = degree * ONEDEG
    }

    draw(screen) {
        screen.save()
        const { x, y } = this.center
        this.centerat(0, 0)
        screen.translate(x, y)
        screen.rotate(this.rad)
        super.draw(screen)
        this.centerat(x, y)
        screen.restore()
    }

    static toRad(x) {
        return toRad * ONEDEG
    }

    static rotatePointAroundOrigin(x, y, rad) {
        const [c, s] = [Math.cos(rad), Math.sin(rad)]
        return {
            x: x * c - y * s,
            y: x * s + y * c
        }
    }

    static rotatePointAround(x, y, a, b, rad) {
        const [dx, dy] = [x - a, y - b]
        const r = RectRotatedExperimental.rotatePointAroundOrigin(dx, dy, rad)
        return ({
            x: r.x + a,
            y: r.y + b
        })
    }

    rotateAround(u, w, rad, doNotAdjustFacing = false) {
        this.rad += rad
        this.centeratV(RectRotatedExperimental.rotatePointAround(this.cx, this.cy, u, w, rad))
    }

    collidepoint(x, y) {
        const [c, s] = [Math.cos(this.rad), Math.sin(this.rad)]
        const [dx, dy] = [x - this.centerX, y - this.centerY]
        const [nx, ny] = [this.centerX + dx * c - dy * s, this.centerY + dx * s + dy * c]
        //return super.collidepoint(nx, ny)
        return nx >= this.x && nx <= this.x + this.width && ny >= this.y && ny <= this.y + this.height
    }
}