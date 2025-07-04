const TWOPI = Math.PI * 2
const ONEDEG = Math.PI / 180

class Rect {
	constructor(x, y, width, height) {
		this.x = x ?? 50
		this.y = y ?? 50
		this.width = width ?? 100
		this.height = height ?? 100
	}

	//getters
	get size() {
		return {
			width: this.width,
			height: this.height
		}
	}

	get left() {
		return this.x
	}
	get right() {
		return this.x + this.width
	}
	get top() {
		return this.y
	}
	get bottom() {
		return this.y + this.height
	}
	get centerX() {
		return this.x + this.width / 2
	}
	get centerY() {
		return this.y + this.height / 2
	}
	get center() {
		return {
			x: this.x + this.width / 2,
			y: this.y + this.height / 2
		}
	}
	get cx() {
		return this.x + this.width / 2
	}
	get cy() {
		return this.y + this.height / 2
	}
	get topleft() {
		return {
			x: this.x,
			y: this.y
		}
	}
	get topright() {
		return {
			x: this.x + this.width,
			y: this.y
		}
	}
	get bottomleft() {
		return {
			x: this.x,
			y: this.y + this.height
		}
	}
	get bottomright() {
		return {
			x: this.x + this.width,
			y: this.y + this.height
		}
	}

	leftat(value) {
		this.x = value
		return this
	}
	rightat(value) {
		this.x = value - this.width
		return this
	}
	topat(value) {
		this.y = value
		return this
	}
	bottomat(value) {
		this.y = value - this.height
		return this
	}
	rightstretchat(value) {
		this.width = value - this.x
		return this
	}
	bottomstretchat(value) {
		this.height = value - this.y
		return this
	}
	topleftat(x, y) {
		this.x = x
		this.y = y
		return this
	}
	topleftatV({ x, y } = {}) {
		this.x = x
		this.y = y
		return this
	}
	/*
	toprightat(x, y) {
		this.x = x - this.width
		this.y = y
		return this
	}
	bottomleftat(x, y) {
		this.x = x
		this.y = y - this.height
		return this
	}
	bottomrightat(x, y) {
		this.x = x - this.width
		this.y = y - this.height
		return this
	}*/ //DEPR

	centerat(x, y) {
		this.x = x - this.width / 2
		this.y = y - this.height / 2
		return this
	}

	centeratV({ x, y }) {
		return this.centerat(x, y)
	}

	centerinRect(rect) {
		const { x, y } = rect.center
		this.centerat(x, y)
		return this
	}

	draw(screen, color = 'purple', fill = true) {
		if (fill) {
			screen.fillStyle = color
			screen.fillRect(this.x, this.y, this.width, this.height)
		} else {
			//!fill
			screen.strokeStyle = color
			screen.strokeRect(this.x, this.y, this.width, this.height)
		}
	}

	collidepoint(x, y) {
		return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height
	}

	colliderect(rect) {
		return this !== rect && this.x < rect.x + rect.width && this.x + this.width > rect.x && this.y < rect.y + rect.height && this.y + this.height > rect.y
	}

	move(dx, dy) {
		this.x += dx
		this.y += dy
		return this
	}

	inflate(dw, dh) {
		this.x -= dw / 2
		this.y -= dh / 2
		this.width += dw
		this.height += dh
		return this
	}

	stretch(fw, fh) {
		fw ||= 1
		fh ||= 1
		const { x, y } = this.center
		this.width = this.width * fw
		this.height = this.height * fh
		this.centerat(x, y)
		return this
	}

	resize(w, h) {
		const { x, y } = this.center
		this.width = w
		this.height = h
		this.centerat(x, y)
		return this
	}

	spread(x, y, sx, sy) {
		//spread out, similar to enlargement, from center point x,y
		const dx = (this.center.x - x) * (sx - 1)
		const dy = (this.center.y - y) * (sy - 1)
		this.move(dx, dy)
		return this
	}

	shrinkToSquare(enlargeInstead = false) {
		const { x, y } = this.center
		const smaller = enlargeInstead ? Math.max(this.width, this.height) : Math.min(this.width, this.height)
		this.width = smaller
		this.height = smaller
		this.centerat(x, y)
		return this
	}

	deflate(dw, dh) {
		return this.inflate(-dw, -dh)
	}

	boundWithinInfo(x, y) {
		let retX, retY
		let { left, right, top, bottom } = this
		const leftOut = x < left
		const rightOut = x > right
		const topOut = y < top
		const bottomOut = y > bottom
		retX = leftOut ? left : (rightOut ? right : x)
		retY = topOut ? top : (bottomOut ? bottom : y)
		return {
			x: retX,
			y: retY,
			leftOut: leftOut,
			rightOut: rightOut,
			topOut: topOut,
			bottomOut: bottomOut
		}
	}

	get copy() {
		return new Rect(this.x, this.y, this.width, this.height)
	}

	splitCell(i, j, toti, totj, jspan = 1, ispan = 1) {
		i--
		j--
		//one-indexed for ease of use (like a matrix)
		const w = this.width / totj
		const h = this.height / toti
		return new Rect(this.x + j * w, this.y + i * h, w * jspan, h * ispan)
	}

	splitCol(...weights) {
		const totj = MM.sum(weights)
		const w = this.width / totj
		const result = []
		let k = 0
		for (let c of weights) {
			result.push(new Rect(this.x + k * w, this.y, c * w, this.height))
			k += c
		}
		return result
	}

	splitRow(...weights) {
		const toti = MM.sum(weights)
		const h = this.height / toti
		const result = []
		let k = 0
		for (let c of weights) {
			result.push(new Rect(this.x, this.y + k * h, this.width, c * h))
			k += c
		}
		return result
	}

	splitGrid(cols, rows) {
		return this.splitGridWeight(Array(rows).fill(1), Array(cols).fill(1))
	}

	splitGridWeight(colWeights = [1], rowWeights = [1]) {
		return this.splitRow(...rowWeights).map(r => r.splitCol(...colWeights))
	}

}

class Clickable extends Rect {
	constructor(options = {}) {
		const defaults = {
			x: 100,
			y: 100,
			width: 100,
			height: 100,
			on_click: null,
			on_release: null,
			on_hover: null,
			on_enter: null,
			on_leave: null,
			just_entered: false,
			last_clicked: null,
			follow_mouse: false,
			follow_mouse_last: null,
			interactable: true
		}
		super(options.x ??= defaults.x, options.y ??= defaults.y, options.width ??= defaults.width, options.height ??= defaults.height)
		Object.assign(this, {
			...defaults,
			...options
		})
	}
	check(x, y, clicked, released, held) {
		if (!this.interactable || x === null || y === null) {
			return false
		}
		const pos = {
			x: x,
			y: y
		}
		let within = this.collidepoint(x, y)
		//will be declared as true while dragging
		if (this.follow_mouse) {
			//thus drag logic must go first
			if (released) {
				this.follow_mouse_last = null
				this.follow_mouse_offset = null
			}
			if (within && clicked) {
				this.follow_mouse_last = pos
				this.follow_mouse_offset = {
					x: this.x - x,
					y: this.y - y
				}
			}
			if (held && this.follow_mouse_last) {
				//this.move(x - this.follow_mouse_last.x, y - this.follow_mouse_last.y)
				within = true
				this.x = x + this.follow_mouse_offset.x
				this.y = y + this.follow_mouse_offset.y
				this.follow_mouse_last = pos

			}
		}
		if (within) {
			this.on_hover?.()
		}
		if (within && !this.just_entered) {
			this.just_entered = true
			this.on_enter?.()
		}
		if (!within && this.just_entered) {
			this.just_entered = false
			this.on_leave?.()
		}
		if (clicked && within) {
			this.last_clicked = pos
			this.on_click?.()
		}
		if (released && within) {
			this.on_release?.()
		}
		return within
	}

}

class Button extends Clickable {
	constructor(options = {}) {
		const defaults = {
			txt: null, //txtmult by default
			fontsize: 48,
			font_color: "black",
			font_font: "Times",
			outline: 2,
			outline_color: "black",
			color: "gray",
			transparent: false,
			selected: false,
			selected_color: "orange",
			hover_color: null,
			hover_selected_color: null,
			visible: true,
			tag: "",
			img: null,
			opacity: 0,
			rad: 0
		}
		const settings = {
			...defaults,
			...options
		}
		super(settings)
		Object.assign(this, settings)

	}

	get copy() {
		return new Button(this)
	}

	get copyRect() {
		return super.copy
	}

	static fromRect(rect, kwargs = {}) {
		const tobuild = { ...kwargs, ...rect }
		return new Button(tobuild)
	}

	static fromButton(but, kwargs = {}) {
		let temp = but.copy
		Object.assign(temp, kwargs)
		return temp

	}

	get deg() {
		return this.rad / ONEDEG
	}
	set deg(degree) {
		this.rad = degree * ONEDEG
	}

	draw(screen) {
		if (this.visible) {
			if (this.rad) { //context is restored below
				screen.save()
				MM.RotateContext(screen, this.rad, this.centerX, this.centerY)
			}
			if (!this.transparent && this.outline) {
				this.draw_outline(screen)
			}
			if (!this.transparent) {
				let draw_color
				if (this.selected) {
					//selected
					if (this.just_entered && this.hover_selected_color) {
						draw_color = this.hover_selected_color
					} else {
						draw_color = this.selected_color
					}
				} else if (this.hover_color && this.just_entered) {
					//not selected
					draw_color = this.hover_color
				} else {
					draw_color = this.color
				}
				this.draw_color = draw_color
				this.draw_background(screen)

			}
			if (this.img != null) {
				this.draw_image(screen)
			}
			if (this.txt != null) {
				this.draw_text(screen)
			}
			if (this.rad) {
				screen.restore() //started above, should go at the end
			}

		}

	}

	draw_background(screen) {
		MM.fillRect(screen, this.x, this.y, this.width, this.height, {
			color: this.draw_color,
			opacity: this.opacity
		})
	}
	draw_outline(screen) {
		MM.drawRect(screen, this.x, this.y, this.width, this.height, {
			color: this.outline_color,
			lineWidth: this.outline,
			opacity: this.opacity
		})
	}
	draw_image(screen) {
		MM.drawImage(screen, this.img, this, this.opacity)
	}
	draw_text(screen) {
		MM.drawMultiText(screen, this.txt, this, {
			font: `${this.fontsize}px ${this.font_font}`,
			color: this.font_color,
			opacity: this.opacity
		})
	}

	check(x, y, clicked, released, held) {
		if (this.visible) {
			return super.check(x, y, clicked, released, held)
		}
	}

	get copy() {
		let result = new Button()
		Object.assign(result, this)
		return result
	}
	selected_flip() {
		this.selected = !this.selected
	}

	static make_checkbox(button, preservePreviousFunction = false) {
		if (preservePreviousFunction) {
			button.on_click = MM.extFunc(button.on_click, button.selected_flip.bind(button))
		} else {
			button.on_click = button.selected_flip.bind(button)
		}
		button.hover_color ??= "pink"
		return button
	}

	static make_radio(buttons, preservePreviousFunction = false) {
		let radio_group = {
			buttons: buttons,
			selected: buttons[0]
		}
		radio_group.buttons.forEach(b => b.selected = (b === radio_group.selected))
		for (let b of buttons) {
			const wanted = function () {
				buttons.forEach(a => {
					a.selected = (a === b)
				}
				)
				radio_group.selected = b
			}
			if (preservePreviousFunction) {
				b.on_click = MM.extFunc(b.on_click, wanted)
			} else {
				b.on_click = wanted
			}
			b.hover_color ??= "pink"
			b.selected_color ??= "orange"

		}
		return radio_group
	}

}

class Particle extends Clickable {
	constructor(options = {}) {
		const defaults = {
			color: "blue",
			velX: 1.2,
			velY: 2.1,
			unresolved: false,
			randVelMax: 5,
			mass: 100,
			txt: null
		}
		super()
		Object.assign(this, { ...defaults, ...options })
		this.height = this.width
		//oddities: radius is width, x,y refer to center instead
	}

	draw(screen) {
		MM.drawCircle(screen, this.x, this.y, this.width, {
			color: this.color
		})
		if (this.txt) {
			MM.drawText(screen, this.txt, this.x, this.y, { font: "24px times", color: "black" })
		}

	}

	collidepoint(x, y) {
		return MM.dist(this.x, this.y, x, y) < this.width
	}
	collidecirc(particle) {
		if (Math.abs(this.x - particle.x) > (this.width + particle.width) || Math.abs(this.y - particle.y) > (this.width + particle.width)) {
			return false
		}
		return MM.dist(this.x, this.y, particle.x, particle.y) < this.width + particle.width
	}

	randVel() {
		this.velX = Math.random() * this.randVelMax
		this.velY = Math.random() * this.randVelMax
	}

	get center() { return { x: this.x, y: this.y } }
	set mag(val) {
		let currmag = this.mag
		currmag = currmag == 0 ? 0.0001 : currmag
		const factor = val / currmag
		this.velX *= factor
		this.velY *= factor
	}

	get mag() {
		return Math.hypot(this.velX, this.velY)
	}

	set size(x) {
		this.width = x
		this.recomputeMass()
	}

	get size() {
		return this.width
	}

	get height() { return this.width }
	set height(x) { this.width = x }

	recomputeMass() {
		this.mass = Math.pow(this.width, 3)
	}


	static collidePhysics(p1, p2) {
		if (p1 === p2) { return }
		const dx = p2.x - p1.x
		const dy = p2.y - p1.y
		const dist = Math.hypot(dx, dy)
		const minDist = p1.radius + p2.radius
		if (dist < minDist) {
			// Separate particles to prevent sticking
			const correction = (minDist - dist) / 2
			const correctionX = (dx / dist) * correction
			const correctionY = (dy / dist) * correction

			p1.x -= correctionX
			p1.y -= correction;
			p2.x += correctionX
			p2.y += correctionY
		}
		const nx = dx / dist
		const ny = dy / dist

		const v1n = p1.velX * nx + p1.velY * ny
		const v2n = p2.velX * nx + p2.velY * ny

		const v1t = p1.velX * ny - p1.velY * nx
		const v2t = p2.velX * ny - p2.velY * nx

		const m1 = p1.mass
		const m2 = p2.mass
		const newV1n = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2)
		const newV2n = (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2)


		p1.velX = newV1n * nx + v1t * ny
		p1.velY = newV1n * ny - v1t * nx
		p2.velX = newV2n * nx + v2t * ny
		p2.velY = newV2n * ny - v2t * nx
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


}

class Malleable {
	constructor(...comps) {
		this.components = [...comps]
	}

	update() {
		for (let c of this.components) {
			c.update?.()
		}
	}

	draw(screen) {
		for (let c of this.components) {
			c.draw?.(screen)
		}
	}
}

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

