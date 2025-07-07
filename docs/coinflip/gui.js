class Framerater {
	constructor(isRunning = true) {
		this.measuredTimeInterval = 1000
		this.timeStamps = []
		this.fps = 0.1
		this.tickrate = 0.1
		this.button = new Button({
			x: 10,
			y: 10,
			width: 60,
			height: 15,
			fontsize: 16,
			color: "yellow",
			outline: 0,
		})
		Button.make_draggable(this.button)
		this.isRunning = isRunning
		this.startTime = Date.now()
		this.totalTicks = 0
		this.totalFrames = 0
	}
	get elapsed() {
		return Math.floor((Date.now() - this.startTime) / 100) / 10
	}
	update(dt, noDrawingNeeded) {
		if (this.isRunning) {
			this.totalTicks += 1
			this.totalFrames += noDrawingNeeded ? 0 : 1
			let curr_time = Date.now()
			this.timeStamps.push([curr_time, noDrawingNeeded])
			let i = this.timeStamps.findIndex(x => curr_time - x[0] < this.measuredTimeInterval)
			this.timeStamps = this.timeStamps.slice(i)
			this.tickrate = Math.floor(this.timeStamps.length / this.measuredTimeInterval * 1000)
			this.fps = Math.floor(this.timeStamps.filter(
				x => !x[1]
			).length / this.measuredTimeInterval * 1000)

		}
	}

	draw(screen) {
		if (this.isRunning) {
			this.button.txt = `${this.fps} / ${this.tickrate}`
			this.button.draw(screen)
		}
	}
}

class Keyboarder {
	constructor(denybuttons) {
		if (denybuttons === null) {
			throw "did not specify whether keypress propagation should be denied or not"
		}
		/*-----------------------------------------------worst idea ever---------------------------------------------------------*/
		//fullscreenToggle = MM.extFunc(fullscreenToggle, () => game.mouser.whereIsCanvas())
		this.bufferExpiration = null //null for no expiration, or milliseconds
		this.held = {}
		const held = this.held
		this.pressed = {}
		const pressed = this.pressed
		this.strokeBuffer = []
		const strokeBuffer = this.strokeBuffer

		document.addEventListener('keydown', (e) => {
			if (denybuttons) {
				e.preventDefault()
				e.stopPropagation()
			}
			if (!held[e.key]) {
				held[e.key] = true
				pressed[e.key] = true
				strokeBuffer.push([Date.now(), e.key])
			}
		})
		document.addEventListener('keyup', (e) => {
			held[e.key] = false
			pressed[e.key] = false
			/*if (e.key == "F") {
				fullscreenToggle()
			}*/
			if (denybuttons) {
				e.preventDefault()
				e.stopPropagation()
			}
		})
		//there's also a 'blur' event for alt+tab
	}
	get strokes() {
		return this.strokeBuffer.map(x => x[1]).join("")
	}
	update(dt, now) {
		if (this.strokeBuffer.length && this.bufferExpiration != null) {
			if (now - this.strokeBuffer.at(-1)[0] > this.bufferExpiration) {
				this.strokeBuffer.length = 0
			}
		}
	}
	flushstrokes() {
		this.strokeBuffer.length = 0
	}
	next_loop() {
		Object.keys(this.pressed).forEach(
			x => this.pressed[x] = false
		)
	}

}

class Mouser {
	constructor(canvas) {
		this.x = null
		this.y = null
		this.clicked = false
		this.released = false
		this.down = false

		this.canvas = canvas
		this.canvasRect = new Rect(0, 0, canvas.width, canvas.height)
		this.addListeners(canvas)
		this.whereIsCanvas()

		this.wheel = 0
	}

	whereIsCanvas() {
		this.boundingRect = this.canvas.getBoundingClientRect()
		this.scaleX = this.canvasRect.width / this.boundingRect.width
		this.scaleY = this.canvasRect.height / this.boundingRect.height
	}
	whereAmI(e) {
		const x = (e.clientX - this.boundingRect.left) * this.scaleX
		const y = (e.clientY - this.boundingRect.top) * this.scaleY
		const withinInfo = this.canvasRect.boundWithinInfo(x, y)
		this.x = withinInfo.x
		this.y = withinInfo.y
		if (withinInfo.anyOut) {
			this.released = true
			//this.x = null
			//this.y = null
		}
	}

	addListeners(canvas) {
		canvas.addEventListener('pointermove', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.whereAmI(e)
			//e.pointerType //can be 'mouse', 'pen', 'touch'

		})
		canvas.addEventListener('pointerdown', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.whereAmI(e)
			this.clicked = true
			this.down = true
			//e.shiftKey, e.ctrlKey //true or false
			//button = 0 or 2
			//for some reason clicking both simultaneously does sweet FA
		})
		canvas.addEventListener('pointerup', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.whereAmI(e)
			this.released = true
			this.down = false
		})
		/*
		canvas.addEventListener('pointerleave', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.released = true
			//this.x = null
			//this.y = null
		})
		canvas.addEventListener('pointerout', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.released = true
			//this.x = null
			//this.y = null
		})*/
		canvas.addEventListener('pointercancel', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.released = true
		})
		canvas.addEventListener('wheel', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.wheel = e.deltaY
		})
		window.addEventListener("resize", this.whereIsCanvas.bind(this))
		window.addEventListener("scroll", this.whereIsCanvas.bind(this))
		window.addEventListener('contextmenu', (e) => {
			e.preventDefault()
			e.stopPropagation()
		})
	}
	get held() {
		return this.down && !this.released
	}

	get pos() {
		return {
			x: this.x,
			y: this.y
		}
	}

	next_loop() {
		this.clicked = false
		this.released = false
		this.wheel = 0
	}

	changeCursor(type) {
		game.canvas.style.cursor = type
	}

}

class Cropper {
	constructor() {
		/**@type {HTMLCanvasElement} */
		this.secondCanvas = document.createElement("canvas")
		/**@type {CanvasRenderingContext2D} */
		this.ctx = this.secondCanvas.getContext("2d")
		this.ctx.imageSmoothingEnabled = false
	}

	load_images(names, containerDict, whatToCallAfter) {
		let num = names.length
		const onload = () => { --num === 0 && whatToCallAfter() }
		for (const item of names) {
			const img = new Image
			containerDict[item] = img
			img.crossOrigin = "Anonymous"
			img.src = item
			img.onload = onload
		}

	}

	convertFont(image, fontDict, pattern) {
		fontDict ??= {}
		pattern ??= Cropper.pattern
		pattern.split("").forEach((b, i) => {
			fontDict[b] = this.crop(image, new Rect(1 + i * 9, 0, 8, 9))
		})
		return fontDict
	}

	load_img(source, on_end) {
		try {
			const img = new Image()
			img.crossOrigin = 'Anonymous'
			img.src = source
			if (on_end != null) {
				img.onload = () => { return on_end(img) }
			}
			return img
		} catch (error) {
			console.error(error)
		}

	}

	/**@returns {HTMLImageElement} */
	resize(img, width, height) {
		this.secondCanvas.width = width
		this.secondCanvas.height = height
		this.ctx.drawImage(img, 0, 0, width, height)
		const ret = new Image()
		ret.src = this.secondCanvas.toDataURL()
		return ret
	}

	/**@returns {HTMLImageElement} */
	crop(img, rect) {
		this.secondCanvas.width = rect.width
		this.secondCanvas.height = rect.height
		this.ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height)
		const ret = new Image()
		ret.src = this.secondCanvas.toDataURL()
		return ret
	}

	/**@returns {HTMLImageElement[][]} */
	cropGrid(img, rows, cols) {
		const rect = new Rect(0, 0, img.width, img.height)
		const rects = rect.splitGrid(rows, cols)
		const ret = []
		for (let row of rects) {
			ret.push([])
			for (let col of row) {
				ret.at(-1).push(this.crop(img, col))
			}
		}
		return ret
	}

	static pattern = `!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_${"\`"}abcdefghijklmnopqrstuvwxyz{|}~" `

	static drawText(screen, fontDict, txt, scale = 1) {
		txt.split("").forEach((c, i) => {
			screen.drawImage(fontDict[c], i * 9 * scale, 0, 8 * scale, 9 * scale)
		})
	}

	static loadCustomFont(fileName = "./resources/victoriabold.png") {
		const c = new Cropper()
		const ret = {}
		c.load_img(fileName, (img) => {
			c.convertFont(img, ret)
		})
		return ret
	}
}

class customFont {
	static pattern = `!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_${"\`"}abcdefghijklmnopqrstuvwxyz{|}~" `

	constructor() {//for now just monospace
		this.width = 8
		this.height = 9
		this.fontDict = null //will be received from Cropper
	}

	load_fontImage(fontDict) {
		this.fontDict = fontDict
	}

	drawText(screen, txt, rect, { fontScale = 24, color = "black", opacity = 0 } = {}) {
		const outRect = new Rect(0, 0, txt.length * this.width * fontScale, this.height * fontScale)
		outRect.centerinRect(rect)
		txt.split("").forEach((c, i) => {
			screen.drawImage(this.fontDict[c],
				i * this.width * fontScale + outRect.x, outRect.y,
				this.width * fontScale, this.height * fontScale)
		})
	}
}