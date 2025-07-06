const TWOPI = Math.PI * 2
const ONEDEG = Math.PI / 180
const PI = Math.PI
const NINETYDEG = Math.PI / 2

/**
* @class Rect
* @property {number} [x=50] - x (left side)
* @property {number} [y=50] - y (top side)
* @property {number} [width=100]
* @property {number} [height=100]
*/
class Rect {

	constructor(x, y, width, height) {
		this.x = x ?? 50
		this.y = y ?? 50
		this.width = width ?? 100
		this.height = height ?? 100
		return this
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
	bottomrightstretchat(x, y) {
		this.rightstretchat(x)
		this.bottomstretchat(y)
		return this
	}
	bottomrightstretchatV({ x, y } = {}) {
		return this.bottomrightstretchat(x, y)
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
		if (w !== null) this.width = w
		if (h !== null) this.height = h
		this.centerat(x, y)
		return this
	}

	spread(x, y, spreadFactorX, spreadFactorY) {
		//spread out, similar to enlargement, from center point x,y
		const dx = (this.center.x - x) * (spreadFactorX - 1)
		const dy = (this.center.y - y) * (spreadFactorY - 1)
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

/**
 * @class Clickable
 * @extends Rect
 * @property {number} [x=100]
 * @property {number} [y=100]
 * @property {number} [width=100]
 * @property {number} [height=100]
 * @property {function} [on_click=null]
 * @property {function} [on_release=null]
 * @property {function} [on_hover=null]
 * @property {function} [on_enter=null]
 * @property {function} [on_leave=null]
 * @property {function} [on_drag=null]
 * @property {function} [on_hold=null]
 * @property {function} [on_wheel=null]
 * @property {boolean} [_drag_force_within=false] whether forcefully follows the mouse when dragger
 * @property {boolean} [just_entered=false]
 * @property {Object|null} [last_clicked=null]
 * @property {Object|null} [last_held=null]
 * @property {boolean} [interactable=true]
 */
class Clickable extends Rect {
	/**
	 * @class Clickable
	 * @extends Rect
	 * @param {Object} [options={}]
	 * @param {number} [options.x=100]
	 * @param {number} [options.y=100]
	 * @param {number} [options.width=100]
	 * @param {number} [options.height=100]
	 * @param {function} [options.on_click=null]
	 * @param {function} [options.on_release=null]
	 * @param {function} [options.on_hover=null]
	 * @param {function} [options.on_enter=null]
	 * @param {function} [options.on_leave=null]
	 * @param {function} [options.on_drag=null]
	 * @param {function} [options.on_hold=null]
	 * @param {function} [options.on_wheel=null]
	 * @param {boolean} [options._drag_force_within=false]
	 * @param {boolean} [options.just_entered=false]
	 * @param {Object|null} [options.last_clicked=null]
	 * @param {Object|null} [options.last_held=null]
	 * @param {boolean} [options.interactable=true]
	 */
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
			on_drag: null,
			on_hold: null,
			on_wheel: null,
			_drag_force_within: false, //won't let the button separate from mouse while dragging
			just_entered: false,
			last_clicked: null,
			last_held: null,
			interactable: true
		}
		super(options.x ??= defaults.x, options.y ??= defaults.y, options.width ??= defaults.width, options.height ??= defaults.height)
		Object.assign(this, {
			...defaults,
			...options
		})
	}

	check(x, y, clicked, released, held, wheel) {
		if (released) { //log releases anyways
			this.last_clicked = null
			this.last_held = null
		}
		if (!this.interactable || x === null || y === null) { //if not interactable then return
			return false
		}
		const pos = {
			x: x,
			y: y
		}
		let within = this.collidepoint(x, y) || (this._drag_force_within && this.last_clicked)
		//will be declared as true while dragging
		if (within) {
			this.on_hover?.(pos)
		}
		if (within && !this.just_entered) {
			this.just_entered = true
			this.on_enter?.(pos)
		}
		if (!within && this.just_entered) {
			this.just_entered = false
			this.on_leave?.(pos)
		}
		if (released && within) {
			this.on_release?.(pos)
		}
		if (clicked && within) {
			this.last_clicked = pos
			this.last_held = pos
			this.on_click?.(pos)
		}
		if (held && within) {
			this.on_hold?.(pos)
			this.last_clicked && this.on_drag?.(pos) //drag means you clicked and now you hold
			this.last_held = pos
		}
		if (wheel && within) {
			this.on_wheel?.(wheel, pos)
		}
		return within
	}

}
/**
 * @class Button
 * @extends Clickable
 * @property {string|null} [txt=null]
 * @property {number} [fontsize=48]
 * @property {string} [font_color="black"]
 * @property {string} [font_font="Times"]
 * @property {number|null} [outline=2]
 * @property {string|null} [outline_color="black"]
 * @property {string|null} [color="gray"]
 * @property {boolean} [transparent=false]
 * @property {boolean} [selected=false]
 * @property {string|null} [selected_color="orange"]
 * @property {string|null} [hover_color=null]
 * @property {string|null} [hover_selected_color=null]
 * @property {boolean} [visible=true]
 * @property {string|Object} [tag=""]
 * @property {HTMLImageElement} [img=null]
 * @property {number} [opacity=0]
 * @property {number} [rad=0]
 */
class Button extends Clickable {
	/**
	 * @class Button
	 * @extends Clickable
	 * @param {Object} [options={}]
	 * @param {string|null} [options.txt=null]
	 * @param {number} [options.fontsize=48]
	 * @param {string} [options.font_color="black"]
	 * @param {string} [options.font_font="Times"]
	 * @param {number} [options.outline=2]
	 * @param {string} [options.outline_color="black"]
	 * @param {string} [options.color="gray"]
	 * @param {boolean} [options.transparent=false]
	 * @param {boolean} [options.selected=false]
	 * @param {string} [options.selected_color="orange"]
	 * @param {string|null} [options.hover_color=null]
	 * @param {string|null} [options.hover_selected_color=null]
	 * @param {boolean} [options.visible=true]
	 * @param {string} [options.tag=""]
	 * @param {any} [options.img=null]
	 * @param {number} [options.opacity=0]
	 * @param {number} [options.rad=0]
	 */
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
		return new Rect(this.x, this.y, this.width, this.height)
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

	collidepoint(x, y) {
		if (!this.rad) { //non-rotated rectangle
			return this.collidePointDefault(x, y)
		} else { //rotated rectangle
			return this.collidepointRotated(x, y, this.rad)
		}
	}

	collidePointDefault(x, y) {
		return super.collidepoint(x, y)
	}

	collidepointRotated(x, y, rad) {
		const [c, s] = [Math.cos(rad), Math.sin(rad)]
		const [dx, dy] = [x - this.centerX, y - this.centerY]
		const [nx, ny] = [this.centerX + dx * c + dy * s, this.centerY - dx * s + dy * c]
		return this.collidePointDefault(nx, ny)
	}
	/**@param {RenderingContext} screen  */
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

	check(x, y, clicked, released, held, wheel) {//invisible buttons are also drawn now
		return super.check(x, y, clicked, released, held, wheel)
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

	static make_draggable(button) {
		button.on_drag = function (pos) {
			this.move(pos.x - this.last_held.x, pos.y - this.last_held.y)
		}
		button._drag_force_within = true
		return button
	}

	/**@param {Button} button @param {Button[]} others */
	static make_drag_others(button, others) {
		others ??= []
		button.drag_others_list ??= []
		button.drag_others_list.push(...others)
		button.on_drag = function (pos) {
			this.drag_others_list.forEach(b => {
				b.move(pos.x - button.last_held.x, pos.y - button.last_held.y)
			})
			this.move(pos.x - this.last_held.x, pos.y - this.last_held.y)
		}
		button._drag_force_within = true
		return button
	}

	static make_polygon(button, polyXYXYXY) {
		button.polyXYXYXY = polyXYXYXY
		button.draw_background = function (screen) {
			MM.drawPolygon(screen, this.polyXYXYXY, { ...this, color: this.draw_color })
		}
		button.draw_outline = function () { }
		button.collidepoint = function (x, y) {
			return MM.collidePolygon(x, y, this.polyXYXYXY)
		}
		button.move = function (dx, dy) {
			this.polyXYXYXY.forEach((x, i, a) => {
				a[i] += i % 2 ? dy : dx
			})
		}
		return button
	}

}

class Molecule extends Clickable {
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



/**
 * @typedef {Object} PlotOptions
 * @property {number} [minX=0] - Minimum x-value
 * @property {number} [maxX=10] - Maximum x-value
 * @property {number} [minY=-5] - Minimum y-value
 * @property {number} [maxY=5] - Maximum y-value
 * @property {string} [color="black"] - Plot line color
 * @property {number} [width=2] - Plot line width
 * @property {boolean} [axes=true] - Whether to show axes
 * @property {string} [axes_color="pink"] - Axes color
 * @property {number} [axes_width=1] - Axes line width
 * @property {boolean} [show_border_values=true] - Show border values
 * @property {string} [show_border_values_font="12px Times"] - Border values font
 * @property {number} [show_border_values_dp=2] - Decimal places for border values
 */
/**
 * Creates a new Plot instance
 * @param {Function} func - The function to plot
 * @param {Object} rect - The canvas rectangle dimensions
 * @param {PlotOptions} [args={}] - Configuration options
 */
class Plot {
	/**
	 * @class Plot
	 * @param {Function} func - The function to plot.
	 * @param {Rect} rect - The canvas rectangle dimensions.
	 * @param {Object} [args={}]
	 * @param {number} [args.minX=0]
	 * @param {number} [args.maxX=10]
	 * @param {number} [args.minY=-5]
	 * @param {number} [args.maxY=5]
	 * @param {string} [args.color="black"]
	 * @param {number} [args.width=2]
	 * @param {boolean} [args.axes=true]
	 * @param {string} [args.axes_color="pink"]
	 * @param {number} [args.axes_width=1]
	 * @param {boolean} [args.show_border_values=true]
	 * @param {string} [args.show_border_values_font="12px Times"]
	 * @param {number} [args.show_border_values_dp=2]
	 */
	constructor(func, rect, args = {}) {
		const defaults = {
			minX: 0,
			maxX: 10,
			minY: -5,
			maxY: 5,
			color: "black",
			width: 2,
			axes: true,
			axes_color: "pink",
			axes_width: 1,
			show_border_values: true,
			show_border_values_font: "12px Times",
			show_border_values_dp: 2,
		}
		this.func = func
		this.rect = rect
		this.density = this.rect.width * 2
		this.plotCanvas = document.createElement("canvas")
		this.plotCanvas.width = rect.width
		this.plotCanvas.height = rect.height
		this.plotScreen = this.plotCanvas.getContext("2d")
		this.plotRect = new Rect(0, 0, rect.width, rect.height)
		Object.assign(this, { ...defaults, ...args })
	}

	draw(screen) {
		MM.plot(this.plotScreen, this.func, this.minX, this.maxX, this.minY, this.maxY, this.plotRect,
			{ ...this, overrideBoundaryCheck: true })
		screen.drawImage(this.plotCanvas, this.rect.x, this.rect.y)
		this.plotScreen.clearRect(0, 0, this.plotCanvas.width, this.plotCanvas.height)
		if (this.show_border_values) {
			const { maxX, maxY, minX, minY } = this
			screen.fillStyle = "black"
			screen.font = this.show_border_values_font
			screen.textAlign = "center"
			screen.textBaseline = "top"
			screen.fillText(maxY.toFixed(this.show_border_values_dp), this.rect.centerX, this.rect.top)
			screen.textBaseline = "bottom"
			screen.fillText(minY.toFixed(this.show_border_values_dp), this.rect.centerX, this.rect.bottom)
			screen.textBaseline = "middle"
			screen.textAlign = "left"
			screen.fillText(minX.toFixed(this.show_border_values_dp), this.rect.left, this.rect.centerY)
			screen.textAlign = "right"
			screen.fillText(maxX.toFixed(this.show_border_values_dp), this.rect.right, this.rect.centerY)
		}
	}


	zoomX(factor) {
		this.minX /= factor
		this.maxX /= factor
		return this
	}
	zoomY(factor) {
		this.minY /= factor
		this.maxY /= factor
		return this
	}

	pointerPosToCoord(pos) {
		let { x, y } = pos
		x -= this.rect.x
		y -= this.rect.y
		x /= this.rect.width
		y /= this.rect.height
		y = 1 - y
		const { minX, maxX, minY, maxY } = this
		x = x * (maxX - minX) + minX
		y = y * (maxY - minY) + minY
		return { x: x, y: y }
	}

	coordToScreenPos(x, y) {
		const rect = this.rect
		const { minX, maxX, minY, maxY } = this
		const drawX = (x - minX) / (maxX - minX) * rect.width + rect.x
		const drawY = (1 - (y - minY) / (maxY - minY)) * rect.height + rect.y

		return { x: drawX, y: drawY }
	}

	zoomAtPos(factor, pos) {
		let { x, y } = this.pointerPosToCoord(pos)
		this.translateX(-x)
		this.translateY(-y)
		this.zoomX(factor)
		this.zoomY(factor)
		this.translateX(x)
		this.translateY(y)
		return this
	}

	translateX(u) {
		this.minX += u
		this.maxX += u
		return this
	}

	translateY(w) {
		this.minY += w
		this.maxY += w
		return this
	}

	translate({ x, y }) {
		this.translateX(x)
		this.translateY(y)
		return this
	}

	addControls(mouser, button) {
		button ??= this.rect
		if (!(button instanceof Button)) { throw "controls can only be added to a button" }
		const plot = this
		button.on_drag = function (pos) {
			plot.translateX((this.last_held.x - pos.x) * (plot.maxX - plot.minX) / this.width)
			plot.translateY(-(this.last_held.y - pos.y) * (plot.maxY - plot.minY) / this.height)
		}
		button.on_wheel = function (wheel, pos) {
			const factor = wheel < 0 ? 1.1 : 1 / (1.1)
			plot.zoomAtPos(factor, pos)
		}
	}
}

