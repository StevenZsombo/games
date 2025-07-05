class Framerater {
	constructor(active = true) {
		this.measuredTimeInterval = 250 //for now lock at 500, should be 30 or so or even less
		this.frameAt = []
		this.fps = 0.1
		this.button = new Button({ x: 10, y: 10, width: 30, height: 15, fontsize: 12, color: "yellow", outline: 0, follow_mouse: true })
		this.active = active
		this.startTime = Date.now()
	}
	get elapsed() {
		return Math.floor((Date.now() - this.startTime) / 100) / 10
	}
	update() {
		if (this.active) {
			let curr_time = Date.now()
			this.frameAt.push(curr_time)
			let i = this.frameAt.findIndex(x => curr_time - x < this.measuredTimeInterval)
			this.frameAt = this.frameAt.slice(i)
			this.fps = Math.floor(this.frameAt.length / this.measuredTimeInterval * 1000)
		}
	}

	draw(screen) {
		if (this.active) {
			this.button.txt = this.fps
			this.button.draw(screen)
		}
	}
}

class Keyboarder {
	constructor() {
		const pressed = {};
		this.pressed = pressed
		document.addEventListener('keydown', (e) => {
			pressed[e.key] = true
		})
		document.addEventListener('keyup', (e) => {
			pressed[e.key] = false
		})
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

		this.wheel = 0
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

		})
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
		})
		canvas.addEventListener('pointerup', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.whereAmI(e)
			this.released = true
			this.down = false
		})
		canvas.addEventListener('pointerleave', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.released = true
			this.x = null
			this.y = null
		})
		/*canvas.addEventListener('pointerout', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.released = true
			this.x = null
			this.y = null
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
