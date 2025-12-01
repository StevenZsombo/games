const TWOPI = Math.PI * 2
const ONEDEG = Math.PI / 180
const PI = Math.PI
const NINETYDEG = Math.PI / 2


//#region Rect
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
			bottomOut: bottomOut,
			anyOut: leftOut || rightOut || topOut || bottomOut
		}
	}

	collideRectInfo(rect) {
		const { left, right, top, bottom } = this
		const leftIn = rect.left < left && left < rect.right
		const rightIn = rect.left < right && right < rect.right
		const topIn = rect.top < top && top < rect.bottom
		const bottomIn = rect.top < bottom && bottom < rect.bottom
		//const anyIn = this.colliderect(rect)
		//if (anyIn) return { anyIn, leftIn, rightIn, topIn, bottomIn }
		return { leftIn, rightIn, topIn, bottomIn }

	}


	get copy() {
		return new Rect(this.x, this.y, this.width, this.height)
	}

	packInto(rects, justify = "center", align = "middle") {
		//TODO
	}

	static packArray(sourceRects, targetRects) {
		sourceRects.forEach((b, i) => {
			b.centerinRect(targetRects[i])
		})
	}

	splitCell(i, j, toti, totj, jspan = 1, ispan = 1) {
		if (i > 0) { i-- } else { i += toti }
		if (j > 0) { j-- } else { j += totj }
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

	splitGrid(rows, cols) {
		return this.splitGridWeight(Array(cols).fill(1), Array(rows).fill(1))
	}

	splitGridWeight(colWeights = [1], rowWeights = [1]) {
		return this.splitRow(...rowWeights).map(r => r.splitCol(...colWeights))
	}


}
//#endregion
//#region Clickable
class Clickable extends Rect {
	constructor(options = {}) {
		super(options.x, options.y, options.width, options.height)
		this.on_click = null
		this.on_release = null
		this.on_hover = null
		this.on_enter = null
		this.on_leave = null
		this.on_drag = null
		this.on_drag_more = null
		this.on_hold = null
		this.on_wheel = null
		this._drag_force_within = false //won't let the button separate from mouse while dragging
		this.just_entered = false
		this.last_clicked = null
		this.last_held = null
		this.interactable = true
		this.clickable = true
		Object.assign(this, options)
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
			this.clickable && this.on_click?.(pos)
		}
		if (held && within) {
			this.on_hold?.(pos)
			//this.last_clicked && this.on_drag?.(pos) //drag means you clicked and now you hold
			if (this.last_clicked) {
				this.on_drag?.(pos)
				this.on_drag_more?.(pos)
			}
			this.last_held = pos
		}
		if (wheel && within) {
			this.on_wheel?.(wheel, pos)
		}
		return within
	}

}
//#endregion
//#region Button
class Button extends Clickable {
	constructor(options = {}) {
		super(options)
		/**@type {string} */
		this.txt = null //txtmult by default
		this.dynamicText = null //can be any function; might be bad practice, as it is called as part of the draw function isntead of update but whatevs
		this.fontSize = 24
		this.font_color = "black"
		this.font_font = "Times"
		this.fontScale = 1
		this.textSettings = {}
		this.outline = 2
		this.outline_color = "black"
		this.color = "gray"
		this.dynamicColor = null //can be any function
		this.transparent = false
		this.selected = false
		this.selected_color = "orange"
		this.hover_color = null
		this.hover_selected_color = null
		this.visible = true
		this.tag = ""
		this.img = null
		this.opacity = 0
		this.rad = 0

		Object.assign(this, options)

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
			if (this.dynamicText) { this.txt = this.dynamicText() }
			if (this.txt != null) {
				this.draw_text(screen)
			}
			if (this.rad) {
				screen.restore() //started above, should go at the end
			}
			this.draw_more?.(screen)
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

	draw_more = null

	draw_text(screen) {
		MM.drawText(screen, this.txt, this, {
			fontSize: this.fontSize,
			font: this.font_font,
			color: this.font_color,
			opacity: this.opacity,
			...this.textSettings
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
	flip_selected() {
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
		button.drag_others_list.push(...(others.filter(x => x !== button)))
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

	/**@param {Button} button  */
	static make_circle(button) {
		button ??= this

		button.draw_background = function (screen) {
			MM.drawCircle(screen, this.centerX, this.centerY, this.width, {
				color: this.color, outline: this.outline, outline_color: this.outline_color, opacity: this.opacity
			})
		}
		button.draw_outline = function () { }
		button.collidepoint = function (x, y) {
			return MM.dist(x, y, this.centerX, this.centerY) < this.width
		}
		return button
	}

	static make_pixelFont(button, customFontInstance) {
		button.draw_text = function (screen) { customFontInstance.drawText(screen, this.txt, this, { ...this }) }
	}

}
//#endregion

//#region MouseHelper
class MouseHelper extends Button {
	constructor(execute = true) {
		super({ width: 50, height: 50, fontSize: 36 })
		this.update = (dt) => this.centeratV(game.mouser.pos)
		if (execute) {
			game.add_drawable(this)
		}
	}
}
//#endregion

//#region Malleable
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
//#endregion

//#region Plot
class Plot {
	constructor(func, rect) {
		// explicit defaults (kept comments as they are)
		this.minX = 0
		this.maxX = 10
		this.minY = -5
		this.maxY = 5
		this.fixedRatio = false // to be implemented
		this.color = "black"
		this.width = 2
		this.show_axes = true
		this.axes_color = "plum"//"deeppink",//"fuchsia",
		this.axes_width = 3
		this.show_axes_labels = true
		this.axes_labels_font = "24px Times"
		this.show_dotting = true
		this.dottingDistance = [1, 1]
		this.show_grid = true
		this.grid_width = 1
		this.grid_color = "lightgray"
		this.show_border_values = true
		this.show_border_values_font = "12px Times"
		this.show_border_values_dp = 2
		this.highlightedPoints = [] //
		this.label_highlighted = true
		this.label_highlighted_font = "24px Times"
		/**@type {Array<{func: Function, color: string, highlightedPoints: Array}>} */
		this.pltMore = [] //{func, color, highlightedPoints}
		this.overrideBoundaryCheck = true
		this.func = func
		this.rect = rect
		this.density = rect.width * 2
		this.plotCanvas = document.createElement("canvas")
		this.plotCanvas.width = rect.width
		this.plotCanvas.height = rect.height
		this.plotScreen = this.plotCanvas.getContext("2d")
		this.plotRect = new Rect(0, 0, rect.width, rect.height)

	}

	draw(screen) {
		MM.plot(this.plotScreen, this.func, this.minX, this.maxX, this.minY, this.maxY, this.plotRect,
			{ ...this })
		this.highlightedPoints.forEach(p => this.highlightPoint(p))
		this.pltMore?.forEach(item => {
			if (item?.func) {
				MM.plot(this.plotScreen, item.func, this.minX, this.maxX, this.minY, this.maxY, this.plotRect,
					{
						...item,
						show_dotting: false, show_axes_labels: false,
						show_axes: false, show_grid: false,
						show_border_values: false,
					}
				)
			}
			item?.highlightedPoints?.forEach(x => this.highlightPoint(x, item.color)
			)

		})
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

	highlightPoint(p, color, label_highlighted) {
		let { x, y } = this.coordToPlotScreenInternalPos(...p)
		MM.drawCircle(this.plotScreen, x, y, 10, { color: color ?? this.color })
		label_highlighted ??= this.label_highlighted
		if (label_highlighted) {
			const label = `(${Number(p[0].toFixed(this.show_border_values_dp))}, ${Number(p[1].toFixed(this.show_border_values_dp))})`
			this.plotScreen.font = this.label_highlighted_font
			this.plotScreen.fillText(label, x - 40, y + ((y > this.rect.height / 2) * 2 - 1) * 40)
		}
	}

	fixAxes() {
		if (this.fixedRatio) {
			const widthDensity = (this.maxX - this.minX) / this.rect.width
			const heightDensity = (this.maxX - this.minX) / this.rect.width
			//TODO, this is kinda finnicky and probably pointless
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

	coordToPlotScreenInternalPos(x, y) {
		const rect = this.rect
		const { minX, maxX, minY, maxY } = this
		const drawX = (x - minX) / (maxX - minX) * rect.width
		const drawY = (1 - (y - minY) / (maxY - minY)) * rect.height
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

	zoomAtCenter(factor) {
		return this.zoomAtPos(factor, { x: this.rect.centerX, y: this.rect.centerY })
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
	/**@param {Array<number>} xs  @param {Array<number>} ys */
	reorient(xs, ys, zoomFactor = 0.6) {
		this.minX = Math.min(this.minX, ...xs)
		this.maxX = Math.max(this.maxX, ...xs)
		this.minY = Math.min(this.minY, ...ys)
		this.maxY = Math.max(this.maxY, ...ys)
		this.zoomAtCenter(zoomFactor)
	}

	matchAxesScaling() {
		let xDensity = (this.maxX - this.minX) / this.rect.width
		let yDensity = (this.maxY - this.minY) / this.rect.height
		this.translateX(-(this.maxX - this.minX) / 2)
		this.translateY(-(this.maxY - this.minY) / 2)
		if (xDensity < yDensity) {
			this.zoomX(xDensity / yDensity)
		} else {
			this.zoomY(yDensity / xDensity)
		}
		this.translateX((this.maxX - this.minX) / 2)
		this.translateY((this.maxY - this.minY) / 2)
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
//#endregion

//#region Field
//Is a prerequisite for InputBoard.
class Field extends Button {
	constructor(button = {}, { isATerm = false, isACoefficient = false, defaultValue = 0 } = {}) {
		super({ ...button })
		this.isATerm = isATerm
		this.isACoefficient = isACoefficient
		this.defaultValue = defaultValue
		this.untouched = true
		this.color = "lightgray"
		this.transparent = false
		this.outline = 0
		this.selected_color = "lightblue"
		this.hover_color = "purple"

		this.allowFraction = true
		this.allowNegative = true

		this.reset()

	}
	reset() {
		this.numerator = 0
		this.denominator = ""
		this.fraction = false
		this.negative = false
		this.untouched = true
		this.txtRefresh()
		this.untouched = true
	}

	txtRefresh() {
		let valText = this.fraction ? `${this.numerator}/${this.denominator == 0 ? "" : this.denominator}` : this.numerator
		if (this.numerator == 0) {
			if (this.isACoefficient) { valText = this.negative ? "-" : "" }
			else if (this.isATerm) { valText = this.untouched ? "" : 0 }
			else { valText = this.untouched ? "" : valText }
		}
		else {
			if (this.isACoefficient) { valText = `${this.negative ? "-" : ""}${valText}` }
			else if (this.isATerm) { valText = `${this.negative ? "-" : "+"}${valText}` }
			else { valText = `${this.negative ? "-" : ""}${valText}` }
		}

		this.txt = valText
	}

	getValue() {
		if (this.numerator == 0) { return this.negative ? -1 * this.defaultValue : this.defaultValue }
		return (this.fraction ? this.numerator / this.denominator : this.numerator) * (this.negative ? -1 : 1)
	}


}
//#endregion
//#region InputBoard
//Requires Field.
class InputBoard {
	/**
	 * @param {Rect} inputBackground 
	 * @param {Array<Field>} fields
	*/
	constructor(inputBackground, fields, { animationTime = 500 } = {}) {
		if (!fields || fields.length == 0) {
			throw "At least one field must be declared."
		}
		this.redefineFields(fields)
		this.animationTime = animationTime
		this.inputButtons = this.createButtonsBoard(inputBackground)

	}


	createButtonsBoard(inputBackground) {
		const inputButtons = inputBackground.copy.
			splitRow(1, 6)[1].
			stretch(.55, .7).
			move(-50, 0).
			splitGrid(5, 3).
			flat().map(x => x.deflate(10, 10)).
			map(Button.fromRect)

		const inputButtonsNumbers = [...inputButtons.slice(0, 9), inputButtons[10]]
		inputButtonsNumbers.forEach((x, i) => {
			x.txt = i + 1
			x.on_click = () => {
				this.addValueToField(x.txt)
				if (this.animationTime) { GameEffects.sendFancy(x, this.currentField, this.animationTime) }
			}
		})
		inputButtons.forEach(x => {
			x.fontSize = 48
			x.color = "lightblue"
		})
		inputButtons[10].txt = 0
		inputButtons[10].on_click = () => {
			this.addValueToField(0)
			if (this.animationTime) { GameEffects.sendFancy(inputButtons[10], this.currentField, this.animationTime) }
		}
		inputButtons[9].txt = "+"
		inputButtons[9].on_click = () => {
			this.currentField.negative = false
			this.currentField.txtRefresh()
			if (this.animationTime) { GameEffects.sendFancy(inputButtons[9], this.currentField, this.animationTime) }
		}
		inputButtons[11].txt = "-"
		inputButtons[11].on_click = () => {
			this.currentField.negative = this.currentField.allowNegative
			this.currentField.txtRefresh()
			if (this.animationTime) { GameEffects.sendFancy(inputButtons[11], this.currentField, this.animationTime) }
		}
		inputButtons[13].txt = "/"
		inputButtons[13].on_click = () => {
			if (this.currentField.numerator != 0) {
				this.currentField.fraction = this.currentField.allowFraction
				this.currentField.txtRefresh()
			}
			if (this.animationTime) { GameEffects.sendFancy(inputButtons[13], this.currentField, this.animationTime) }
		}
		inputButtons[12].txt = "Reset"
		inputButtons[12].fontSize = 30
		const resetButtonFunction = () => {
			this.fields.forEach(x => {
				x.reset()
				if (this.animationTime) {
					GameEffects.sendFancy(inputButtons[12], x, this.animationTime)
				}
			})

		}
		inputButtons[12].on_click = () => {
			resetButtonFunction()
		}
		inputButtons[14].txt = "Delete"
		inputButtons[14].fontSize = 30
		inputButtons[14].on_click = () => {
			let curr = this.currentField
			curr.txtRefresh()
			let v = String(curr.txt)
			if (v.length <= 1 || (v[0] == "+" && v.length == 2)) {
				curr.reset()
			} else {
				if (curr.fraction) {
					if (curr.denominator == "") {
						curr.fraction = false
					} else {
						const str = String(curr.denominator)
						curr.denominator = Number(str.substring(0, str.length - 1))
					}
				} else {
					const str = String(curr.numerator)
					curr.numerator = Number(str.substring(0, str.length - 1))
				}
			}
			curr.txtRefresh()
			if (this.animationTime) { GameEffects.sendFancy(inputButtons[14], this.currentField, this.animationTime) }
		}
		return inputButtons
	}

	getButtonsDict() {
		const inputButtons = this.inputButtons
		return {
			0: inputButtons[10],
			1: inputButtons[0],
			2: inputButtons[1],
			3: inputButtons[2],
			4: inputButtons[3],
			5: inputButtons[4],
			6: inputButtons[5],
			7: inputButtons[6],
			8: inputButtons[7],
			9: inputButtons[8],
			"+": inputButtons[9],
			"-": inputButtons[11],
			"/": inputButtons[13],
			"Delete": inputButtons[14],
			"Reset": inputButtons[12]
		}
	}

	/**@param {Array<Field>} fields  */
	redefineFields(fields) {
		if (!fields || fields.length == 0) { throw "At least one field must be provided" }
		fields.forEach((f, i) => {
			if (!(f instanceof Field)) { throw "The given object if not a field." }
			f.on_click = () => { this.currentField = f }
			f.txtRefresh()
		})
		this.fields = fields
		this.focusField(0)
		const radio_group = Button.make_radio(fields, true)
		return radio_group
	}

	addnum(oldVal, addVal) {
		if (oldVal == 0 && addVal == 0) { return 0 }
		return Number(String(oldVal) + String(addVal))
	}

	addValueToField(value) {
		const curr = this.currentField
		if (curr.fraction) {
			curr.denominator = this.addnum(curr.denominator, value)
		} else {
			curr.numerator = this.addnum(curr.numerator, value)
		}
		curr.untouched = false
		curr.txtRefresh()
	}

	freezeFields() {
		this.fields.forEach(x => {
			x.interactable = false
			x.selected = false
		})

	}

	unfreezeFields() {
		this.fields.forEach(x => x.interactable = true)
		this.fields[0].on_click()
	}

	get currentFieldIndex() {
		const index = this.fields.findIndex(x => x == this.currentField)
		if (index == -1) { throw "Requested field cannot be found" }
		return index
	}

	/**@param {number} index  */
	focusField(index) {
		this.currentField = this.fields[index]
		this.currentField.on_click?.()
	}

	nextField() {
		this.focusField((this.currentFieldIndex + 1) % this.fields.length)
	}

	previousField() {
		this.focusField((this.currentFieldIndex - 1 + this.fields.length) % this.fields.length)
	}
}
//#endregion
