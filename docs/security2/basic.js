//should import scripts.js

var gd = {}

class Game {
	constructor(canvas, startWhenBuilt = true) {
		this.canvas = canvas
		this.screen = canvas.getContext("2d")
		this.WIDTH = canvas.width
		this.HEIGHT = canvas.height
		this.SIZE = { x: this.WIDTH, y: this.HEIGHT }
		this.rect = new Rect(0, 0, this.WIDTH, this.HEIGHT)
		this.BGCOLOR = "lightgray" //null for transparent
		this.ATCENTER = { x: this.SIZE / 2, y: this.SIZE / 2 }

		this.mouser = new Mouser(canvas)
		this.keyboarder = new Keyboarder()

		this.drawables = []
		this.clickables = []

		this.initialize()
		var self = this
		var tick = function () {
			self.update()
			self.draw(self.screen)
			self.mouser.next_loop()
			requestAnimationFrame(tick)
		}

		if (startWhenBuilt) {
			tick()
		}
	}
	initialize() {
		let rects = new Rect(20, 20, 400, 400).splitGrid(4, 4).flat()
		let frams = rects.map(b => Button.fromRect(b.copy.inflate(10, 10)))
		gd.frams = {}
		frams.forEach((b, i) => {
			b.current_color = "blue"
			b.outline = null
			b.visible = false
			this.drawables.push(b)
			b.tag = `${Math.floor(i / 4)}x${i % 4}`
			gd.frams[b.tag] = b
		})
		let buts = rects.map(b => Button.fromRect(b))
		gd.buts = {}
		gd.cells = {}
		buts.forEach((b, i) => {
			b.inflate(-15, -15)
			this.drawables.push(b)
			this.clickables.push(b)
			b.tag = `${Math.floor(i / 4)}x${i % 4}`
			gd.buts[b.tag] = b
			gd.cells[b.tag] = false
			b.on_click = function (self) { clicked(...self.tag.split("x")) }
			b.on_hover = function (self) { highlight(...self.tag.split("x")) }
			b.default_color = "red"
			b.current_color = "red"
			b.selected_color = "green"
		})

		for (let b of ["1x1", "1x2", "2x1", "3x2", "3x1"]) {
			gd.cells[b] = true
		}

		let R = new Rect(450, 60, 120, 355)
		let ctrl = Button.fromRect(new Rect(R.left, R.top - 40, R.width, 40))
		ctrl.txt = "Controls:"
		ctrl.fontsize = 20
		this.drawables.push(ctrl)
		ctrl.outline = 0
		ctrl.transparent = true
		ctrl.follow_mouse = true
		this.clickables.push(ctrl)

		let botlab = Button.fromRect(new Rect(20, 420, 500, 50))
		botlab.outline = 0
		botlab.transparent = true
		botlab.txt = "You may swap the color of each of certain sets of cells,"
		botlab.fontsize = 20
		let other = Button.fromRect(botlab)
		other.move(0, 25)
		other.txt = "unlock the door!"
		other.fontsize = 20
		other.transparent = true
		other.outline = 0
		this.drawables.push(other)
		this.drawables.push(botlab)

		let modeoptions = ["2x2", "3x3", "row", "column", "diagonal", "corner"]
		let moderects = R.splitGrid(1, modeoptions.length).flat()
		moderects = moderects.map(b => Button.fromRect(b))
		moderects.forEach((b, i) => {
			b.inflate(-10, -10)
			this.drawables.push(b)
			this.clickables.push(b)
			b.txt = modeoptions[i]
			b.tag = modeoptions[i]
			b.fontsize = 20
			b.selected_color = "orange"
		})
		gd.modes = Button.make_radio(moderects)
		moderects[1].on_click()

	}


	update() {
		//update

		Object.entries(gd.buts).forEach(([key, value]) => {
			value.selected = gd.cells[key]
		})
		Object.values(gd.frams).forEach(b => b.visible = false)

		for (let b of this.clickables) {
			b.check(this.mouser.x, this.mouser.y, this.mouser.clicked, this.mouser.released, this.mouser.held)
		}



	}
	draw(screen) {
		//reset background
		if (this.BGCOLOR) {
			screen.fillStyle = this.BGCOLOR
			screen.fillRect(0, 0, this.WIDTH, this.HEIGHT)
		} else {
			screen.clearRect(0, 0, this.WIDTH, this.HEIGHT)
		}
		//draw
		for (let b of this.drawables) {
			b.draw(screen)
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


window.onload = function () {
	let canvas = document.getElementById("myCanvas")
	canvas.style.touchAction = 'none';  // Most effective for modern browsers
	canvas.style.userSelect = 'none';   // Prevent text selection
	canvas.style.webkitUserDrag = 'none'; // For Safari
	document.body.style.overflow = 'hidden';
	document.documentElement.style.overflow = 'hidden';
	//Additional prevention for document (catch stray drags)
	document.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); })
	document.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); })
	main(canvas)
}

var main = function (canvas) {
	new Game(canvas)
}

var clicked = function (a, b) {
	for (u of friends(a, b)) {
		gd.cells[u] = !gd.cells[u]
	}
}

var friends = function (a, b) {
	let mg = gd.modes.selected.tag
	let ret = []
	if (mg == "2x2") {
		a = Math.min(a, 2)
		b = Math.min(b, 2)
		ret = [[a, b], [a, b + 1], [a + 1, b], [a + 1, b + 1]]
	} else if (mg == "3x3") {
		a = [0, 0, 1, 1][a]
		b = [0, 0, 1, 1][b]
		ret = [[a, b], [a, b + 1], [a, b + 2], [a + 1, b], [a + 1, b + 1], [a + 1, b + 2], [a + 2, b], [a + 2, b + 1], [a + 2, b + 2]]
	} else if (mg == "row") {
		ret = Array.from({ length: 4 }, (_, i) => [a, i])
	} else if (mg == "column") {
		ret = Array.from({ length: 4 }, (_, i) => [i, b])
	} else if (mg == "diagonal") {
		if (a == b) {
			ret = Array.from({ length: 4 }, (_, i) => [i, i])
		} else if (a == 3 - b) {
			ret = Array.from({ length: 4 }, (_, i) => [i, 3 - i])
		} else {
			ret = []
		}
	} else if (mg == "corner") {
		if ([[0, 0], [3, 3], [0, 3], [3, 0]].some(([x, y]) => x == a && y == b)) {
			ret = [[a, b]]
		} else {
			ret = []
		}
	}
	return ret.map(u => `${u[0]}x${u[1]}`)
}

var highlight = function (a, b) {
	for (u of friends(a, b)) {
		gd.frams[u].visible = true
	}
}