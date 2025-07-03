//should import scripts.js

var gd = {}//global dictionary, contains game


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

const main = function (canvas = document.getElementById("myCanvas")) {
	const game = new Game(canvas)
	game.tick()
}



class Game {
	constructor(canvas) {
		gd.game = this

		this.canvas = canvas
		this.screen = canvas.getContext("2d")
		this.WIDTH = canvas.width
		this.HEIGHT = canvas.height
		this.SIZE = { x: this.WIDTH, y: this.HEIGHT }
		this.rect = new Rect(0, 0, this.WIDTH, this.HEIGHT)
		this.BGCOLOR = "lightgray" //null for transparent
		this.CENTER = { x: this.SIZE.x / 2, y: this.SIZE.y / 2 }

		this.mouser = new Mouser(canvas)
		this.keyboarder = new Keyboarder()
		this.framerate = new Framerater(false)

		this.drawables = []
		this.clickables = []

		this.animator = new Animator()

		this.running = true

		Object.assign(gd, {
			add_drawable: this.add_drawable.bind(this),
			add_clickable: this.add_clickable.bind(this),
			add_anim: this.animator.add_anim.bind(this.animator),
			add_sequence: this.animator.add_sequence.bind(this.animator)
		})


		this.initialize()
		this.initialize_more()
	}
	initialize() {

	}

	tick() {
		if (!this.running) { return }
		const screen = this.screen
		this.draw_reset(screen)
		this.update()
		this.update_more()
		this.draw(screen)
		this.draw_more(screen)
		this.next_loop()
		this.next_loop_more()
		if (!this.running) { return }
		requestAnimationFrame(this.tick.bind(this))

	}

	update() {
		//update
		this.update_clickables()
		this.framerate.update()
		this.update_more()

	}

	update_clickables() {
		for (const b of this.clickables) {
			b.check(this.mouser.x, this.mouser.y, this.mouser.clicked, this.mouser.released, this.mouser.held)
		}

	}

	draw(screen) {
		//draw
		this.draw_drawables(screen)
		this.framerate.draw(screen)


	}

	draw_reset(screen) {
		if (this.BGCOLOR) {
			screen.fillStyle = this.BGCOLOR
			screen.fillRect(0, 0, this.WIDTH, this.HEIGHT)
		} else {
			screen.clearRect(0, 0, this.WIDTH, this.HEIGHT)
		}
	}

	draw_drawables(screen) {
		for (const b of this.drawables) {
			b.draw(screen)
		}
	}

	next_loop() {
		this.mouser.next_loop()
	}

	add_clickable(item) {
		this.add_drawable(item)
		this.clickables.push(item)
	}
	add_clickable_first(item) {
		this.add_drawable_first(item)
		this.clickables.unshift(item)
	}
	add_drawable(item) {
		this.drawables.push(item)
	}
	add_drawable_first(item) {
		this.drawables.unshift(item)
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///                                             customize here                                                   ///
	/// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///                                                                                                              ///
	///         these are called  when appropriate                                                                   ///
	///                                                                                                              ///
	///         initialize_more                                                                                      ///                                   
	///         draw_more                                                                                            ///
	///         update_more                                                                                          ///
	///         next_loop_more                                                                                       ///
	///                                                                                                              ///
	///                                                                                                              ///
	///                                                                                                              ///
	///                                                                                                              ///
	///                                                                                                              ///
	///                                                                                                              ///
	///                                                                                                              ///
	///                                                                                                              ///
	///                                                                                                              ///
	///                                                                                                              ///
	///                                                                                                              ///
	///                                                                                                              ///
	///                                                                                                              ///
	///                                                                                                              ///
	///                                             INITIALIZE                                                       ///
	/// start initialize_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	initialize_more() {

		const firstrun = gd.number == null
		gd.number ??= 6
		gd.victories ??= []

		gd.pickNewNum = function (i) {
			gd.game.running = false
			//gd = {}
			gd.number = i
			main()

		}
		const topzone = gd.game.rect.copy.splitCell(1, 1, 10, 1, 1, 3)
		gd.selector = function () {
			this.interactable = false



			gd.game.drawables.forEach(x => x.visible = false)
			let r = gd.game.rect.copy.deflate(50, 0).stretch(0, 0.3)
			let sf = r.splitCol(...Array(13).fill(1))
			r = Button.fromRect(topzone)
			gd.topbut = r
			gd.add_drawable(r)
			r.txtmult = "How many lights?"
			r.transparent = true
			r.outline = 0
			gd.nrl = []
			sf.map(b => Button.fromRect(b)).forEach((b, i) => {
				//b.txt = i+4
				b.txt = `${i + 4}`

				b.shrinkToSquare()
				b.deflate(5, 5)
				b.outline = 2
				b.fontsize = 28
				b.move(0, 0)
				if (gd.victories.includes(i + 4)) {
					let victorysign = Button.fromRect(b)
					victorysign.move(0, 60)
					victorysign.color = "green"
					victorysign.transparent = true
					victorysign.fontsize = b.fontsize
					victorysign.outline = 0

					victorysign.txt = "\u2705"
					gd.game.add_drawable(victorysign)
					gd.nrl.push(victorysign)
				}

				gd.game.add_clickable_first(b)
				gd.nrl.push(b)
				b.on_click = () => {
					for (let x of gd.nrl.concat([gd.topbut])) {
						x.interactable = false
						if (x === b) { continue }
						x.opacity = 1
						gd.game.animator.add_anim(x, 100, "stepFrom", { varName: "opacity", startVal: 0 })
					}
					gd.game.drawables = MM.putAsLast(b, gd.game.drawables)


					b.stretch(2, 2)
					const a1 = new Animation(b, 120, "scaleFromFactor", { scaleFactor: .5 })
					const a2 = new Animation(b, 120, "stepFrom", { varName: "opacity", startVal: 0, endVal: 1, on_end: () => gd.pickNewNum(i + 4) })
					gd.game.animator.add_sequence(a1, a2)
					//a1.add_chain_depr(a2)
					//gd.game.animator.add_anim(a1)



				}
				b.hover_color = "pink"

				let lift = new Animation(b, 60, "moveFromRel", { dx: 0, dy: 30 })
				if (b.txt == gd.number && firstrun && localStorage.getItem("victories") == null) {
					b.color = "lightblue"
					//lift.chain = new Animation(b,120,"scaleThroughFactor",{scaleFactor: 1.1, repeat: 3})
				}


				gd.game.animator.add_anim(new Animation(
					b, i * 10, "hide", {
					chainMany:
						[
							new Animation(b, 30, "scaleFromFactor", { scaleFactorX: 1, scaleFactorY: .1 }),
							new Animation(b, 30, "setTemp", { varName: "txt", val: null })
						]
				}
				))





			})

		}


		gd.retry = new Button({ width: 150, height: 60, on_click: gd.selector, txt: "Retry" })
		let retry = gd.retry
		retry.bottomleftat(20, this.HEIGHT - 20)
		this.add_clickable(gd.retry)




		let rects = this.rect.copy.deflate(20, 0).splitCell(2, 1, 3, 1).splitGrid(1, gd.number).flat()
		this.lighton = new Image()
		this.lighton.src = "lighton.png"
		gd.on = this.lighton
		this.lightoff = new Image()
		this.lightoff.src = "lightoff.png"
		gd.off = this.lightoff
		gd.buts = []
		const verify = function () {
			if (gd.buts.every(x => x.img == gd.on)) {
				gd.lab.txtmult = "Congratulations! You did it!\n Can you do it with a different number of lights?"
				gd.victories.push(gd.number)
				window.localStorage.setItem("victories", gd.victories.join(","))
				gd.add_sequence(
					new Animation(gd.lab, 120, "stepFrom", { varName: "fontsize", startVal: 12 }),
					new Animation(gd.retry, 120, "delay", { on_end: x => gd.retry.color = "lightblue" }),
					new Animation(gd.retry, 120, "scaleThroughFactor", { scaleFactor: 1.2, repeat: 6 })
				)

				gd.buts.forEach(b => {
					b.interactable = false
					//gd.add_anim(b,120,"scaleThroughFactor",{scaleFactor:1.0 5,repeat:3})
				})
				return true
			}
		}
		rects.forEach((b, i) => {
			const p = Button.fromRect(b)
			p.deflate(10, 10)
			p.shrinkToSquare()
			gd.buts[i] = p
			p.tag = i
			this.add_clickable(p)
			p.img = this.lightoff
			p.on_click = function () {
				[this.tag - 1, this.tag + 1].filter(x => x >= 0 && x < gd.number).forEach(b => {
					gd.buts[b].img = gd.buts[b].img === gd.on ? gd.off : gd.on
				})
				if (!verify()) {
					const a1 = new Animation(p, 10, "wiggle", { dx: 5, dy: 5 })
					gd.game.animator.add_anim(a1)
				}
			}

			//p.resize(p.width,500)
		})

		const lab = Button.fromRect(topzone)
		gd.lab = lab
		lab.transparent = true
		lab.outline = 0
		lab.fontsize = 36
		lab.txtmult =
			`Pressing one of the lights will flip the adjacent ones.
Can you turn on all the lights?`
		this.add_drawable(lab)
		gd.game.animator.add_anim(lab, 120, "stepFrom", { startVal: 1, endVal: 0, varName: "opacity" })
		const botlab = gd.retry.copy
		gd.botlab = botlab
		botlab.rightat(this.WIDTH - gd.retry.left)
		botlab.txt = `(${gd.number} lights)`
		botlab.outline = 0
		botlab.transparent = 1
		botlab.fontsize = 28
		botlab.follow_mouse = true
		botlab.on_click = null
		this.add_clickable(botlab)



		if (firstrun) {
			gd.number = 6
			gd.victories = localStorage.getItem("victories")?.split(",").map(Number) ?? []
			console.log(localStorage.getItem("victories"))
			gd.selector()
			return
		}

		gd.buts.forEach(b => {
			this.animator.add_anim(b, 120, "setTemp", { varName: "interactable", val: false })
			this.animator.add_anim(b, 120, "scaleFromSize", { w: 1, h: 1 })
		})




	} ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                         ^^^^INITIALIZE^^^^                                                   ///
	///                                                                                                              ///
	///                                               UPDATE                                                         ///
	/// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	update_more() {
		this.animator.update()



	} ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                           ^^^^UPDATE^^^^                                                     ///
	///                                                                                                              ///
	///                                                DRAW                                                          ///
	///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	draw_more(screen) {





	} ///end draw_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                            ^^^^DRAW^^^^                                                      ///
	///                                                                                                              ///
	///                                              NEXT_LOOP                                                       ///
	///start next_loop_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	next_loop_more() {





	} ///end next_loop_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                          ^^^^NEXT_LOOP^^^^                                                   ///
	///                                                                                                              ///
	///                                                                                                              ///
	/// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
} //this is the last closing brace



