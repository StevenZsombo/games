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
			fontsize: 32,
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
			throw "did not specify whether keypress propagation should be denied or not"
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
			}
			this.on_keydown?.(e)
			this.on_keydownDict[e.key]?.()
			if (denybuttons) {
				e.preventDefault()
				e.stopPropagation()
			}
		}
		const keyup = (e) => {
			this.held[e.key] = false
			this.pressed[e.key] = false
			this.on_keyup?.()
			this.on_keydownDict[e.key]?.()
			if (denybuttons) {
				e.preventDefault()
				e.stopPropagation()
			}
		}
		const paste = (e) => {
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
				e.preventDefault()
				e.stopPropagation()
				this.on_undo?.()

			}
			if (this.on_redo && e.inputType === 'historyRedo') {
				e.preventDefault()
				e.stopPropagation()
				this.on_redo?.()
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
			this.released = !this._blockNextRelease
		}
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
			this.clicked = !this._blockNextClick
			this.blockNextClick = false
			this.down = true //updates nevertheless? might be an issue
			this.lastClickedTime = Date.now()
			//e.shiftKey, e.ctrlKey //true or false
			//button = 0 or 2
			//for some reason clicking both simultaneously does sweet FA
		}
		const pointerup = (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.whereAmI(e)
			this.released = !this._blockNextRelease
			this._blockNextRelease = false
			this.down = false
			this.lastReleasedTime = Date.now()
		}
		const pointercancel = (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.released = !this._blockNextRelease
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

		canvas.addEventListener('pointermove', pointermove)
		canvas.addEventListener('pointerdown', pointerdown)
		canvas.addEventListener('pointerup', pointerup)
		canvas.addEventListener('pointercancel', pointercancel)
		canvas.addEventListener('wheel', wheel) //{passive:false} omitted for now as I do not want to deal with it
		canvasHandlers.pointermove = pointermove
		canvasHandlers.pointerdown = pointerdown
		canvasHandlers.pointerup = pointerup
		canvasHandlers.pointercancel = pointercancel
		canvasHandlers.wheel = wheel

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
		if (str === this._tex) return
		this._tex = str
		this.refresh()
	}
	get tex() { return this._tex }

	refresh() {
		this.img.src = 'data:image/svg+xml;base64,' + btoa(
			MathJax.tex2svg(this._tex).firstElementChild.outerHTML
		)
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
				return nameID
			})()
		const name = localStorage.getItem('name') ||
			(() => {
				let name
				while (!name || name.length <= 3 || name.length > 30) {
					name = prompt("Please tell me your name");
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
	static async addRow(event, data, callback) {
		const { SUPABASE_KEY, SUPABASE_URL } = Supabase
		try {
			await fetch(`${SUPABASE_URL}/rest/v1/gameEvents`, {
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
		} catch (e) {
			console.error("Failed to write", event, data)
		}
	}

	static async readAllWins(callback) {
		try {
			const response = await fetch(`${Supabase.SUPABASE_URL}/rest/v1/gameEvents?select=name,stage_text`, {
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


}
//#endregion