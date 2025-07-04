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
			fontsize: 12,
			color: "yellow",
			outline: 0,
			follow_mouse: true
		})
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
		}
		)
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
		}
		)
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
		this.addListeners(canvas)
		this.whereIsCanvas()
	}

	whereIsCanvas() {
		const canvas = this.canvas
		this.cRect = canvas.getBoundingClientRect()
		this.cW = canvas.width
		this.cH = canvas.height
		this.scaleX = canvas.width / this.cRect.width
		this.scaleY = canvas.height / this.cRect.height
	}
	whereAmI(e) {
		//event
		this.x = (e.clientX - this.cRect.left) * this.scaleX
		//Account for canvas position
		this.y = (e.clientY - this.cRect.top) * this.scaleY
	}

	addListeners(canvas) {
		canvas.addEventListener('pointermove', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.whereAmI(e)
			//e.pointerType //can be 'mouse', 'pen', 'touch'

		}
		)
		canvas.addEventListener('pointerdown', (e) => {
			e.preventDefault()
			e.stopPropagation()
			if (e.button == 0) {
				this.whereAmI(e)
				this.clicked = true
				this.down = true
			}
			//e.shiftKey, e.ctrlKey //true or false
			//button = 0 or 2
			//for some reason clicking both simultaneously does sweet FA
		}
		)
		canvas.addEventListener('pointerup', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.whereAmI(e)
			this.released = true
			this.down = false
		}
		)
		canvas.addEventListener('pointerout', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.released = true
			this.x = null
			this.y = null
		}
		)
		canvas.addEventListener('pointercancel', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.released = true
		}
		)
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
	}

	changeCursor(type) {
		game.canvas.style.cursor = type
	}

}

class Cropper {
	constructor() {
		this.canvas = document.createElement("canvas")
		this.ctx = this.canvas.getContext("2d")
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

	resize(img, width, height) {
		this.canvas.width = width
		this.canvas.height = height
		this.ctx.drawImage(img, 0, 0, width, height)
		const ret = new Image()
		ret.src = this.canvas.toDataURL()
		return ret
	}

	crop(img, rect) {
		this.canvas.width = rect.width
		this.canvas.height = rect.height
		this.ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height)
		const ret = new Image()
		ret.src = this.canvas.toDataURL()
		return ret
	}

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


}