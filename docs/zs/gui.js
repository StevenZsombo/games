var documentHandlers = {}
var canvasHandlers = {}
var windowHandlers = {}

//#region Framerater
class Framerater {
	constructor(isRunning = true) {
		this.measuredTimeInterval = 1000
		this.timeStamps = []
		this.fps = 0.1
		this.tickrate = 0.1
		this.button = new Button({
			x: 10,
			y: 10,
			width: 150,
			height: 40,
			fontSize: 32,
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
//#region Keyboarder
class Keyboarder {
	constructor(denybuttons) {
		if (denybuttons === null) {
			throw new Error("did not specify whether keypress propagation should be denied or not")
		}
		/*-----------------------------------------------worst idea ever---------------------------------------------------------*/
		//fullscreenToggle = MM.extFunc(fullscreenToggle, () => game.mouser.whereIsCanvas())
		this.strokeBufferExpiration = 500 //null for no expiration, or milliseconds
		this.keyBufferExpiration = 200 //milliseconds
		this.held = {}
		const held = this.held
		this.pressed = {}
		const pressed = this.pressed
		this.strokeBuffer = []
		const strokeBuffer = this.strokeBuffer
		this.keyBuffer = []
		const keyBuffer = this.keyBuffer
		this.bufferedKeys = []
		this.lastPasted = null
		/*These might be a terrible idea, as they do not conform to gameloop.*/
		/*Calling explicitly in game.update seems more sensible. */
		this.on_keydown = null //takes event
		this.on_keydownDict = {} //takes event.key
		this.on_keyup = null //takes event
		this.on_keyupDict = {} //takes event.key
		this.on_paste = null //(text) => ...
		this.on_pasteEvent = null //(event) => ...
		this.on_copy = null
		this.on_undo = null
		this.on_redo = null
		this.isLogging = true //for copy paste undo redo

		const keydown = (e) => {
			if (!held[e.key]) {
				held[e.key] = true
				pressed[e.key] = true
				this.strokeBuffer.push([Date.now(), e.key])
				this.keyBuffer.push([Date.now(), e.key])
				this.on_keydown?.(e)
				this.on_keydownDict[e.key]?.()
			}
			if (denybuttons) {
				e.preventDefault()
				e.stopPropagation()
			}
		}
		const keyup = (e) => {
			this.held[e.key] = false
			this.pressed[e.key] = false
			this.on_keyup?.()
			this.on_keyupDict[e.key]?.()
			if (denybuttons) {
				e.preventDefault()
				e.stopPropagation()
			}
		}
		const paste = (e) => {
			this.on_pasteEvent?.(e)
			const text = e.clipboardData.getData('text/plain');
			this.lastPasted = text
			this.on_paste?.(text)
			this.isLogging && console.log("Pasted: ", text)
			e.preventDefault()
			e.stopPropagation()
		}
		const copy = (e) => {
			if (this.on_copy) {
				let data = this.on_copy()
				if (typeof data !== "string") data = JSON.stringify(data)
				//e.clipboardData.setData('text/plain', this.on_copy?.())
				//this is so dumb lol
				navigator.clipboard.writeText(data)
				this.isLogging && console.log("Copied: ", data)
			}
			e.preventDefault()
			e.stopPropagation()
		}
		const beforeinput = (e) => {
			if (this.on_undo && e.inputType === 'historyUndo') {
				this.on_undo?.()
				this.isLogging && console.log("Undo triggered.")
				e.preventDefault()
				e.stopPropagation()

			}
			if (this.on_redo && e.inputType === 'historyRedo') {
				this.on_redo?.()
				this.isLogging && console.log("Redo triggered.")
				e.preventDefault()
				e.stopPropagation()
			}
		}

		document.addEventListener('keydown', keydown)
		document.addEventListener('keyup', keyup)
		document.addEventListener('copy', copy)
		document.addEventListener('paste', paste)
		documentHandlers.keydown = keydown
		documentHandlers.keyup = keyup
		documentHandlers.copy = copy
		documentHandlers.paste = paste
		window.addEventListener('beforeinput', beforeinput) //{capture:true} omitted for now - removing it would require the same call...
		windowHandlers.beforeinput = beforeinput
	}
	get strokes() {
		return this.strokeBuffer.map(x => x[1]).join("")
	}
	update(dt, now) {
		if (this.strokeBuffer.length && this.strokeBufferExpiration != null) {
			if (now - this.strokeBuffer.at(-1)[0] > this.strokeBufferExpiration) {
				this.strokeBuffer.length = 0
			}
		}
		this.keyBuffer = this.keyBuffer.filter(x => now - x[0] < this.keyBufferExpiration)
		this.bufferedKeys = this.keyBuffer.map(x => x[1])
	}

	next_loop() {
		for (const k in this.pressed) {
			this.pressed[k] = false
		}
		/*Object.keys(this.pressed).forEach(
			x => this.pressed[x] = false
		)*/
	}

}


//#region Mouser
class Mouser {
	constructor(canvas) {
		this.x = null
		this.y = null
		this.clicked = false
		this.released = false
		this.down = false

		this.lastClickedTime = Date.now() - 1000
		this.lastReleasedTime = Date.now() - 1000
		this._blockNextClick = false
		this._blockNextRelease = false

		/**@type {?function(Mouser)}*/ this.on_click = null
		/**@type {?function(Mouser)}*/ this.on_click_once = null
		/**@type {?function(Mouser)}*/ this.on_release = null
		/**@type {?function(Mouser)}*/ this.on_release_once = null

		this.canvas = canvas
		this.canvasRect = new Rect(0, 0, canvas.width, canvas.height)
		this.addListeners(canvas)
		this.whereIsCanvas()

		this.wheel = 0
	}
	//#region Listeners
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
			// this.released = !this._blockNextRelease
			//do not want this.
		}
	}

	getDisplayedCoordV(x, y) {
		x ??= this.x
		y ??= this.y
		x /= this.scaleX
		y /= this.scaleY
		x += this.boundingRect.left
		y += this.boundingRect.top
		return { x, y }
	}

	addListeners(canvas) {
		const pointermove = (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.whereAmI(e)
			//e.pointerType //can be 'mouse', 'pen', 'touch'
		}
		const pointerdown = (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.whereAmI(e)
			if (!this._blockNextClick) {
				this.clicked = true
				this.on_click?.(this)
				this.on_click_once && (this.on_click_once(this), this.on_click_once = null)
			} else {
				this._blockNextClick = false
			}
			this.down = true //updates nevertheless? might be an issue
			this.lastClickedTime = Date.now()
			// if (e.pointerType === 'touch' || e.pointerType === 'pen') { this.canvas.setPointerCapture(e.pointerId) }
		}
		//e.shiftKey, e.ctrlKey //true or false
		//button = 0 or 2
		//for some reason clicking both simultaneously does sweet FA
		const pointerup = (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.whereAmI(e)
			if (!this._blockNextRelease) {
				this.released = true
				this.on_release?.(this)
				this.on_release_once && (this.on_release_once(this), this.on_release_once = null)
			} else {
				this._blockNextRelease = false
			}
			this.down = false
			this.lastReleasedTime = Date.now()
			// if (e.pointerType === 'touch' || e.pointerType === 'pen') { this.canvas.releasePointerCapture(e.pointerId) }
		}
		const pointercancel = (e) => {
			e.preventDefault()
			e.stopPropagation()
		}
		const wheel = (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.wheel = e.deltaY
		}

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
		const dblclick = (e) => {
			e.preventDefault()
			e.stopPropagation()
		}
		const notouch = (e) => {
			e.preventDefault()
			e.stopPropagation()
		}

		canvas.addEventListener('pointermove', pointermove)
		canvas.addEventListener('pointerdown', pointerdown)
		canvas.addEventListener('pointerup', pointerup)
		canvas.addEventListener('pointercancel', pointercancel)
		canvas.addEventListener('wheel', wheel, { passive: false }) //added removal manually
		canvas.addEventListener('dblclick', dblclick)
		canvasHandlers.pointermove = pointermove
		canvasHandlers.pointerdown = pointerdown
		canvasHandlers.pointerup = pointerup
		canvasHandlers.pointercancel = pointercancel
		canvasHandlers.wheel = wheel
		canvasHandlers.dblclick = dblclick
		canvas.addEventListener('touchstart', notouch, { passive: false });
		canvas.addEventListener('touchmove', notouch, { passive: false });
		canvas.addEventListener('touchend', notouch, { passive: false });
		canvasHandlers.notouch = notouch
		canvas.addEventListener('dragstart', notouch)
		canvasHandlers.dragstart = notouch //matches last line!

		const resize = (e) => { this.whereIsCanvas() }
		const scroll = (e) => { this.whereIsCanvas() }
		const contextmenu = (e) => {
			e.preventDefault()
			e.stopPropagation()
		}
		window.addEventListener("resize", resize)
		window.addEventListener("scroll", scroll)
		window.addEventListener('contextmenu', contextmenu)
		windowHandlers.resize = resize
		windowHandlers.scroll = scroll
		windowHandlers.contextmenu = contextmenu
	}
	//#endregion

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

	blockNextRelease() {
		this._blockNextRelease = true
	}
	blockNextClick() {
		this._blockNextClick = true
	}

}

//#region Cropper
class Cropper {
	constructor() {
		/**@type {HTMLCanvasElement} */
		this.secondCanvas = document.createElement("canvas")
		this.secondCanvas.style.imageRendering = "pixelated"
		/**@type {CanvasRenderingContext2D} */
		this.ctx = this.secondCanvas.getContext("2d", { willReadFrequently: true })
		this.ctx.imageSmoothingEnabled = false
	}

	load_images(names, containerDict, whatToCallAfter) {
		let num = names.length
		if (num == 0) return whatToCallAfter()
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

	/**
	 * Prompts to download the given image.
	 * @param {Image} img
	 * @param {string} filename 
	 */
	static downloadImage(img, filename = 'image.png') {
		const canvas = document.createElement('canvas')
		const ctx = canvas.getContext('2d')
		canvas.width = img.width
		canvas.height = img.height
		ctx.drawImage(img, 0, 0)

		canvas.toBlob(blob => {
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = filename
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
			canvas.remove() // Remove canvas from DOM
		}, 'image/png')
	}

	static screenshot(filename = "screenshot", doNotTimestamp = false) {
		if (!game) return
		game.canvas.toBlob(blob => {
			const url = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = url
			const fullName = filename + (doNotTimestamp ? "" : ":" + MM.time() + ".png")
			a.download = fullName.split(":").join("_")
			// document.body.appendChild(a) //not needed in modern browsers
			a.click()
			// document.body.removeChild(a)
			URL.revokeObjectURL(url)
		}, "image/png")
	}

	static downloadText(text, filename = "text", doNotTimestamp) {
		const blob = new Blob([text], { type: 'text/plain' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		const fullName = filename + (doNotTimestamp ? "" : ":" + MM.time() + ".txt")
		a.download = fullName.split(":").join("_")
		a.click()
		URL.revokeObjectURL(url)
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

	static listItemsInAFolder(callback) {
		const i = Object.assign(document.createElement('input'), {
			type: 'file', webkitdirectory: 1, directory: 1, multiple: 1, style: 'display:none'
		});
		callback ??= console.log
		i.onchange = e => {
			callback([...e.target.files].map(f => ({ name: f.name, path: f.webkitRelativePath, size: f.size, type: f.type })));
			document.body.removeChild(i);
		};
		document.body.appendChild(i);
		i.click();
	}
	/**
	 * MUST BE FOCUSED!!!
	 * @returns string
	 */
	static async readClipboardImage() { //BROWSER TAB MUST BE FOCUSED!
		try {
			for (const i of await navigator.clipboard.read()) {
				const t = i.types.find(t => t.startsWith('image/'))
				if (!t) continue
				const b = await i.getType(t)
				return await new Promise(r => {
					const f = new FileReader()
					f.onload = () => r(f.result)
					f.readAsDataURL(b)
				})
			}
		} catch (err) { console.error(err) }
	}



	static getFloodFillIndices(imageDataObj, x, y) {
		x = Math.round(x)
		y = Math.round(y)
		const { width, height, data } = imageDataObj
		const starti = (y * width + x) * 4 //RGBA => we do not care for A
		const startR = data[starti]
		const startG = data[starti + 1]
		const startB = data[starti + 2]
		const startA = data[starti + 3]
		const ret = []
		const stack = [[x, y]]
		const visited = new Set()
		while (stack.length) {
			const [pixelX, pixelY] = stack.pop()
			const key = pixelX + ',' + pixelY
			if (pixelX < 0 || pixelX >= width || pixelY < 0 || pixelY >= height || visited.has(key))
				continue
			const i = (pixelY * width + pixelX) * 4
			if (data[i] === startR && data[i + 1] === startG &&
				data[i + 2] === startB && data[i + 3] === startA) {
				visited.add(key)
				ret.push(i)
				stack.push([pixelX + 1, pixelY], [pixelX - 1, pixelY], [pixelX, pixelY + 1], [pixelX, pixelY - 1])
			}
		}
		return ret
	}

	static getFloodFillRunsFlat(imageDataObj, x, y) {
		x = Math.round(x)
		y = Math.round(y)
		const { width, height, data } = imageDataObj
		const starti = (y * width + x) * 4
		const startR = data[starti]
		const startG = data[starti + 1]
		const startB = data[starti + 2]
		const startA = data[starti + 3]

		const runs = [] // Temporary, will convert to flat
		const stack = [[x, y]]
		const visited = new Uint8Array(width * height)

		while (stack.length) {
			const [pixelX, pixelY] = stack.pop()
			if (pixelX < 0 || pixelX >= width || pixelY < 0 || pixelY >= height ||
				visited[pixelY * width + pixelX]) continue

			const i = (pixelY * width + pixelX) * 4
			if (data[i] === startR && data[i + 1] === startG &&
				data[i + 2] === startB && data[i + 3] === startA) {

				let left = pixelX
				while (left > 0 && !visited[pixelY * width + left - 1] &&
					data[(pixelY * width + left - 1) * 4] === startR &&
					data[(pixelY * width + left - 1) * 4 + 1] === startG &&
					data[(pixelY * width + left - 1) * 4 + 2] === startB &&
					data[(pixelY * width + left - 1) * 4 + 3] === startA) {
					left--
				}

				let right = pixelX
				while (right < width - 1 && !visited[pixelY * width + right + 1] &&
					data[(pixelY * width + right + 1) * 4] === startR &&
					data[(pixelY * width + right + 1) * 4 + 1] === startG &&
					data[(pixelY * width + right + 1) * 4 + 2] === startB &&
					data[(pixelY * width + right + 1) * 4 + 3] === startA) {
					right++
				}

				for (let cx = left; cx <= right; cx++) {
					visited[pixelY * width + cx] = 1
					if (pixelY > 0) stack.push([cx, pixelY - 1])
					if (pixelY < height - 1) stack.push([cx, pixelY + 1])
				}

				runs.push(pixelY, left, right) // Store as flat values
			}
		}

		// Convert to Uint16Array for compact storage
		return new Uint16Array(runs)
	}

	static getFloodFillRunsDelta(imageDataObj, x, y) {
		const runs = this.getFloodFillRunsFlat(imageDataObj, x, y)
		if (runs.length === 0) return new Uint16Array(0)

		const delta = []
		let lastY = 0

		for (let i = 0; i < runs.length; i += 3) {
			const y = runs[i]
			delta.push(y - lastY)      // Delta Y (smaller numbers)
			delta.push(runs[i + 1])    // left
			delta.push(runs[i + 2])    // right
			lastY = y
		}

		return new Uint16Array(delta)
	}


	/**
		 * @param {HTMLImageElement} img 
		 * @param {[number,number,number]} oldColor 
		 * @param {[number,number,number]} newColor 
		 * @returns 
		 */
	recolor(img, oldColor, newColor) {
		this.secondCanvas.width = img.width
		this.secondCanvas.height = img.height
		const ctx = this.ctx
		ctx.drawImage(img, 0, 0)
		const imageData = ctx.getImageData(0, 0, img.width, img.height)
		const data = imageData.data
		for (let i = 0; i < data.length; i += 4) {//RGBA => we do not care for A
			if (data[i] === oldColor[0] &&
				data[i + 1] === oldColor[1] &&
				data[i + 2] === oldColor[2]) {
				data[i] = newColor[0]
				data[i + 1] = newColor[1]
				data[i + 2] = newColor[2]
			}
		}
		ctx.putImageData(imageData, 0, 0)
		return this.secondCanvas
	}

	floodFill(x, y, color) {
		x = Math.round(x)
		y = Math.round(y)
		const canvas = this.secondCanvas
		const ctx = this.ctx
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
		const ind = Cropper.getFloodFillIndices(imageData, x, y)
		const data = imageData.data
		ind.forEach(i => {
			data[i] = color[0]
			data[i + 1] = color[1]
			data[i + 2] = color[2]
		})
		ctx.putImageData(imageData, 0, 0)
	}



}
//#region customFont
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
	/**
	 * @param {RenderingContext} screen
	 * @param {string} text
	 * @param {Rect} rect
	 * @param {Object} [param3={}] 
	 * @param {number} [param3.fontScale=2] 
	 * @param {string} [param3.color="black"] 
	 * @param {number} [param3.opacity=0] 
	 * @param {string} [param3.align=""]  top/middle/bottom left/center/right, default is middlecenter*/
	drawText(screen, txt, rect, {
		fontScale = 1, color = "black", opacity = 0, align = "", extraSpace = 1
	} = {}) {
		//const outRect = new Rect(0, 0, txt.length * this.width * fontScale, this.height * fontScale)
		//outRect.centerinRect(rect)
		const sW = this.width * fontScale
		const sH = this.height * fontScale
		extraSpace *= fontScale

		let targetX = rect.x
		let centered = align.includes("left") ? false : true //center by default
		const right = align.includes("right")
		if (right) { centered = false }
		let charFitPerLine = Math.floor(rect.width / sW)
		let lineWidth = 0
		let charCounter = 0
		const words = `${txt}`.split(" ")
		const lines = [[]]
		for (let i = 0; i < words.length; i++) {
			const word = words[i]
			if (word.includes('\n')) {
				const temp = word.split("\n")
				words.splice(i + 1, 0, temp.slice(1).join('\n'))
				lines.at(-1).push(temp[0])
				lines.push([])
				charCounter = temp[0].length + 1
				continue
			}
			charCounter += word.length + 1 //+1 is the space
			if (charCounter > charFitPerLine) {
				lines.push([])
				charCounter = word.length + 1
			}
			lines.at(-1).push(word)
		}
		let targetY = rect.y
		if (align.includes("top")) {
			//nothing, we declared with top
		} else if (align.includes("bottom")) {
			targetY = rect.bottom - lines.length * (sH + extraSpace) + extraSpace
		} else {//middle by default
			targetY = rect.y + (rect.height - lines.length * (sH + extraSpace) + extraSpace) / 2
		}
		for (let line of lines) {
			line = line.join(" ")
			if (right) { targetX = rect.right - line.length * sW }
			if (centered) { targetX = rect.x + (rect.width - line.length * sW) / 2 }

			line.split("").forEach((c, i) => {
				screen.drawImage(this.fontDict[c], targetX + i * sW, targetY, sW, sH)
			})
			targetY += sH + extraSpace
		}
	}
}
//#endregion
//#region LatexManager
class LatexManager {
	constructor(tex) {
		//if (!window["MathJax"]) { MM.loadScript("tex-svg.js") }
		MM.require(window, "MathJax")
		this._tex = tex ?? ""
		this._texLast = null
		this.img = new Image()
		this.refresh()
	}

	/**@param {string} str  */
	set tex(str) {
		if (str.includes("$")) str = LatexManager.dollarToPure(str)
		if (str === this._tex) return
		this._tex = str
		this.refresh()
		return str
	}
	get tex() { return this._tex }

	refresh() {
		this.img.src = 'data:image/svg+xml;base64,' + btoa(
			MathJax.tex2svg(this._tex).firstElementChild.outerHTML
		)
	}

	static dollarToPure(strWithDollars, alignmentLCR = "c") {
		// const chopped = MM.delimitedText(strWithDollars, ["$", "@"])
		//ill-advised, use MM.delimitedReplace or MM.delimitedReplaceExtract
		const chopped = MM.delimitedText(strWithDollars, ["$"])
		let out = ""
		const addText = (text) => {
			const spl = `{}${text}`.split("\\\\").filter(x => x != "") //double backslash \\
			out += spl.map(x => {
				if (x.includes("\\fbox")) {//special treatment to \fbox
					//deepseek
					const parts = x.split(/(\\fbox\{[^}]*\})/g)
					const processed = parts.map(part => {
						if (part.startsWith("\\fbox")) {
							return part
						} else if (part.length > 0) {
							return `\\text{${part}}`
						}
						return ""
					}).join("")
					return processed
					//--****************************************************
				}
				return `\\text{${x}}`
			}).join("\\\\")
		}
		chopped.forEach(x => {
			if (x.by == "") addText(x.piece)
			else if (x.by == "$") out += x.piece
		})
		return `\\begin{array}{${alignmentLCR}}${out}\\end{array}`
	}

	/**@deprecated */
	static dollarToPureDEPR(strWithDollars, alignmentLCR = "c") {
		const charArr = [...strWithDollars]
		let text = ""
		let math = ""
		let mode = "none" //or text or math
		let out = ""
		const addText = () => {
			const spl = `{}${text}`.split("\\\\").filter(x => x != "") //double backslash \\
			out += spl.map(x => {
				if (x.includes("\\fbox")) {//special treatment to \fbox
					//deepseek
					const parts = x.split(/(\\fbox\{[^}]*\})/g)
					const processed = parts.map(part => {
						if (part.startsWith("\\fbox")) {
							return part
						} else if (part.length > 0) {
							return `\\text{${part}}`
						}
						return ""
					}).join("")
					return processed
					//--****************************************************
				}
				return `\\text{${x}}`
			}).join("\\\\")
			text = ""
			mode = "none"
		}
		for (const c of charArr) {
			if (c != "$" && mode == "none") {//entering text
				mode = "text"
				text += c
			} else if (c != "$" && mode == "text") {//continuing text
				text += c
			} else if (c == "$" && mode == "none") {//entering math from none
				mode = "math"
			} else if (c == "$" && mode == "text") { //entering math from text
				addText()
				mode = "math"
			} else if (c != "$" && mode == "math") {//continuing math
				math += c
			} else if (c == "$" && mode == "math") { //leaving math
				out += math
				math = ""
				mode = "none"
			}
		}
		if (mode == "math") throw new Error("latex $ not closed")
		if (mode == "text") {
			addText()
		}
		return `\\begin{array}{${alignmentLCR}}${out}\\end{array}`
	}

	static matrixToTex(matrix) {
		if (!matrix || matrix.length == 0) return ""
		if (!Array.isArray(matrix[0])) return LatexManager.vectorToTex(matrix)
		return `\\begin{pmatrix}${matrix.map(row => row.join("&")).join("\\\\")}\\end{pmatrix}`
	}

	static vectorToTex(vector) {
		return `\\begin{pmatrix}${vector.join("\\\\")}\\end{pmatrix}`
	}


}
//#endregion
//#region Supabase
class Supabase {
	static acquireName() {//consistent with Chat
		const nameID = localStorage.getItem('nameID') ||
			(() => {
				const nameID = MM.randomID()
				localStorage.setItem("nameID", nameID)
				localStorage.setItem("nameIDtimestamp", Date.now()) //leave timestamp to know when to erase
				return nameID
			})()
		const name = localStorage.getItem('name') ||
			(() => {
				let name
				while (!name || name.length <= 3 || name.length > 25) {
					//consistent with chat, but does not call MM.lettersNumbersSpacesOnly
					name = prompt("Please tell me your name" + univ.acquireNameMoreStr).replace(/[^\w\s]/g, '')
					localStorage.setItem("name", name)
				}
				return name
			})()
		return { name, nameID }
	}
	static resetName() {
		localStorage.removeItem('name')
	}

	static SUPABASE_URL = 'https://mmkukvludjvnvfokdqia.supabase.co';
	static SUPABASE_KEY = 'sb_publishable_de7_OBQ3K3HrwcPWYlnSIQ_q-X_JH5t';
	static BUCKET_NAME = 'pngBucket';
	/** @param {*} callback - Called as callback(event,data) */
	static async addRow(event, data, callback) {
		const { SUPABASE_KEY, SUPABASE_URL } = Supabase
		try {
			const sent = await fetch(`${SUPABASE_URL}/rest/v1/gameEvents`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'apikey': SUPABASE_KEY,
					'Authorization': `Bearer ${SUPABASE_KEY}`
				},
				body: JSON.stringify({
					event, data,
					...Supabase.acquireName()
				})
			})
			console.log("Sent to server", event, data)
			callback?.(event, data)
			return sent
		} catch (e) {
			console.error("Failed to write", event, data)
		}
	}

	/** @returns {Promise<Array<{name: string, stage_text: string}>>} */
	static async readAllWins(callback) {
		try {
			const response = await fetch(`${Supabase.SUPABASE_URL}/rest/v1/gameevents_public_view?select=name,stage_text`, {
				headers: {
					apikey: Supabase.SUPABASE_KEY,
					Authorization: `Bearer ${Supabase.SUPABASE_KEY}`
				}
			})
			const text = await response.text()
			const table = JSON.parse(text)
			callback?.(table)
			return table
		} catch (error) {
			throw error // Re-throw for outer .catch()
		}
	}

	static async checkSolution(problem, solution, callback) {
		try {
			const response = await fetch(
				`${Supabase.SUPABASE_URL}/rest/v1/rpc/check_blake_solution`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'apikey': Supabase.SUPABASE_KEY,
						'Authorization': `Bearer ${Supabase.SUPABASE_KEY}`
					},
					body: JSON.stringify({
						p_problem: problem,
						p_solution: solution
					})
				}
			)
			if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
			const result = await response.json()
			callback?.(result)
			return result
		} catch (error) {
			console.error('Error checking solution:', error)
			return null //return null by default
		}
	}


	static async uploadImage(file, fileName) { //awesome!
		const url =
			`${Supabase.SUPABASE_URL}/storage/v1/object/${Supabase.BUCKET_NAME}/uploads/${fileName ?? Date.now()}.png`
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"apikey": Supabase.SUPABASE_KEY,
				"Authorization": `Bearer ${Supabase.SUPABASE_KEY}`,
				"Content-Type": file.type
			},
			body: file
		})
		if (!response.ok) throw new Error(await response.text())
		return await response.json()
	}

	static async uploadImageWithPicker(fileName, alertMsg, promptMsg) {
		const input = document.createElement("input")
		input.type = "file"
		input.accept = "image/png"
		input.onchange = async (e) => {
			const file = e.target.files[0]
			if (!file) return
			return await Supabase.uploadImage(file, fileName)
		}
		if (alertMsg) alert(alertMsg)
		if (promptMsg) fileName = prompt(promptMsg)
		input.click()
		input.remove()
	}

}
//#endregion