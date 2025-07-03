//should import scripts.js
const framerateUnlocked = true
const denybuttons = false

window.onload = function () {
	let canvas = document.getElementById("myCanvas")
	canvas.style.touchAction = 'none'
	canvas.style.userSelect = 'none'
	canvas.style.webkitUserDrag = 'none'
	document.addEventListener('dragover', (e) => {
		e.preventDefault()
		e.stopPropagation()
	}
	)
	document.addEventListener('drop', (e) => {
		e.preventDefault()
		e.stopPropagation()
	}
	)
	canvas.tabIndex = 0
	//canvas.focus()
	main(canvas)
}

const main = function (canvas) {
	canvas ??= document.getElementById("myCanvas")
	gd = {}
	game = new Game(canvas)
	game.tick()
}

class Game {
	constructor(canvas) {
		gd.game = this
		gd = { ...gd, ...stgs } //might want to remove later

		this.canvas = canvas
		this.screen = canvas.getContext("2d")
		this.WIDTH = canvas.width
		this.HEIGHT = canvas.height
		this.SIZE = {
			x: this.WIDTH,
			y: this.HEIGHT
		}
		this.rect = new Rect(0, 0, this.WIDTH, this.HEIGHT)
		this.BGCOLOR = "lightgray"
		//null for transparent
		this.CENTER = {
			x: this.SIZE.x / 2,
			y: this.SIZE.y / 2
		}

		this.mouser = new Mouser(canvas)
		this.keyboarder = new Keyboarder(denybuttons)
		this.framerate = new Framerater(true)
		this.framerateUnlocked = framerateUnlocked

		this.drawables = []
		this.clickables = []

		this.add_clickable(this.framerate.button) //may be unwise

		this.animator = new Animator()

		this.lastCycle = Date.now()

		this.isRunning = true
		this.isDrawing = true

		Object.assign(gd, {
			rect: this.rect.copy,
			screen: this.screen,
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
		if (!this.isDrawing) {
			this.drawnAlready = true
		}
		if (!this.isRunning) {
			return
		}
		const now = Date.now()
		const dt = (now - this.lastCycle) / 1000
		this.lastCycle = now

		const screen = this.screen
		this.drawnAlready ? null : this.draw_reset(screen)
		this.update(dt)
		this.update_more(dt)
		this.drawnAlready ? null : this.draw(screen)
		this.drawnAlready ? null : this.draw_more(screen)
		this.next_loop()
		this.next_loop_more()
		if (!this.isRunning) {
			return
		}

		this.framerate.update(dt, this.drawnAlready)
		if (!this.framerateUnlocked) {
			requestAnimationFrame(this.tick.bind(this))
		} else {
			setTimeout(this.tick.bind(this), 0)
			if (!this.drawnAlready) {
				this.drawnAlready = true
				requestAnimationFrame((function () { this.drawnAlready = false }).bind(this))
				this.animator.draw()
			}
		}




	}

	update(dt) {
		//update
		const now = Date.now()
		this.keyboarder.update(dt, now)
		this.update_clickables(dt)
		this.animator.update(dt)
		this.update_more(dt)

	}

	update_clickables(dt) {
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
	draw_prioritize(item) {
		this.drawables = MM.putAsLast(item, this.drawables)
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
		this.shm = new SpatialHashGrid(this.WIDTH, this.HEIGHT, 20, 20)



		gd.massRandomizer = () => (Math.random() * 4000 + 200) * 1.8
		gd.cheatcount = 0
		gd.truecheatcount = 0
		let buts = this.rect.copy.splitGrid(gd.partrow, gd.partcol).flat().map(b => Button.fromRect(b).inflate(-30, -30).move(30, 30))
		let but = Button.fromRect(new Rect(this.WIDTH - 270, 10, 250, 50))
		gd.but = but
		but.transparent = true
		but.opacity = .5
		but.fontsize = 24
		but.follow_mouse = true
		gd.particles = []
		this.add_particle = function (b, howmany) {
			b ??= new Rect(Math.random() * 400, Math.random() * 400, 0, 0)
			const m = gd.massRandomizer()
			const p = new Particle({
				x: b.x,
				y: b.y,
				randVelMax: gd.randVelMax,
				width: m ** (1 / 3)
			})
			p.randVel()
			p.recomputeMass()
			this.add_clickable(p)
			p.color = MM.randomColor()
			gd.particles.push(p)
			p.interactable = false
			if (stgs.rps) {
				p.rps = MM.choice("RPS")
				p.txt = p.rps
			}
			if (howmany) {
				this.add_particle(b, --howmany)
			}

			return p
		}
		this.remove_particle = function (b) {
			this.clickables = this.clickables.filter(x => x !== b)
			this.drawables = this.drawables.filter(x => x !== b)
			gd.particles = gd.particles.filter(x => x !== b)
		}
		buts.forEach(b => {
			this.add_particle(b)
		}
		)
		gd.first = gd.particles.at(-1)
		gd.first.size = 10

		gd.make_first = (what) => {
			gd.first = what
			gd.first.interactable = true
			gd.first.on_enter = () => {
				if (gd.game.mouser.held) {
					let what = gd.first
					what.velX = 0
					what.velY = 0
					what.waitForClick = true
					//w.color = "black"
					what.outline_color = "white"
					what.move = function () { }
				}
			}
		}

		gd.make_first(gd.first)

		//gd.first.follow_mouse = true
		gd.first.color = "yellow"

		this.framerate.active = true
		this.add_clickable(but)

		this.framerate.button.follow_mouse = true
		this.clickables.push(this.framerate.button)


		gd.TODO = []

		gd.boundary = this.rect.copy

		dev.flood(10, 10, 200)

	}
	///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                         ^^^^INITIALIZE^^^^                                                   ///
	///                                                                                                              ///
	///                                               UPDATE                                                         ///
	/// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	update_more(dt) {
		//gd.but.txt = this.keyboarder.strokes
		const txt = Math.round(gd.particles.reduce((s, t) => {
			return s + t.mass * 1 / 2 * Math.hypot(t.velX, t.velY) ** 2
		}
			, 0))
		const avgspeed = Math.round(MM.sum(gd.particles.map(x => x.mag)) / gd.particles.length)
		if (stgs.rps) {
			const RPS = "RPS".split("").map(x => gd.particles.filter(p => p.rps == x).length)
			gd.but.txt = `K_total = ${txt}\n R:${RPS[0]} P:${RPS[1]} S:${RPS[2]}`
		} else {
			gd.but.txt = `K_total = ${txt}\nV_avg = ${avgspeed}`
		}


		const particles = gd.particles
		for (const p of particles) {
			let [dvX, dvY] = [p.velX, p.velY]
			dvX *= dt
			dvY *= dt
			p.move(dvX, dvY)
			p.forceWithinRect(gd.game.rect)
			this.shm.addClient(p.boundingRect)
		}
		for (const p of particles) {
			for (const q of this.shm.findNear(p.boundingRect)) {
				if (p.collidecirc(q)) {
					Particle.collidePhysics(p, q)
					let stillcollides = true
					gd.cheatcount--
					const pmovefactor = 1// q.mass / (p.mass + q.mass)
					const qmovefactor = 1//p.mass / (p.mass + q.mass)
					while (stillcollides) {
						p.move(p.velX * dt * pmovefactor, p.velY * dt * pmovefactor)
						q.move(q.velX * dt * qmovefactor, q.velY * dt * qmovefactor)
						stillcollides = p.collidecirc(q)
						gd.cheatcount++
						gd.truecheatcount++
					}
					if (stgs.rps) {
						const [P, Q] = [p.rps, q.rps]
						if (P != Q) {
							if ("RS SP PR".split(" ").includes(`${P}${Q}`)) {
								q.rps = p.rps
							} else {
								p.rps = q.rps
							}
						}
						p.txt = p.rps
						q.txt = q.rps
					}

				}

			}

		}
		//end of loop
		const w = gd.first

		if (w.waitForClick) {
			if (this.mouser.released) {
				w.velX = (this.mouser.x - w.x) / 2
				w.velY = (this.mouser.y - w.y) / 2
				w.color = "yellow"
				w.outline_color = "black"
				w.waitForClick = false
				w.move = Particle.prototype.move
			} else {
				gd.TODO.push(() => MM.drawLine(this.screen, w.x, w.y, this.mouser.x, this.mouser.y))
			}
		}

		const a = gd.game.animator.animations

	}
	///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                           ^^^^UPDATE^^^^                                                     ///
	///                                                                                                              ///
	///                                                DRAW                                                          ///
	///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	draw_more(screen) {
		for (let func of gd.TODO) {
			func()
		}
		gd.TODO = []

		MM.drawCircle(this.screen, gd.first.x, gd.first.y, gd.first.width, {
			color: null,
			outline: 3,
			outline_color: gd.first.outline_color
		})




	}
	///end draw_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                            ^^^^DRAW^^^^                                                      ///
	///                                                                                                              ///
	///                                              NEXT_LOOP                                                       ///
	///start next_loop_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	next_loop_more() {
		this.shm.next_loop()
	}
	///end next_loop_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                          ^^^^NEXT_LOOP^^^^                                                   ///
	///                                                                                                              ///
	///                                                                                                              ///
	/// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
} //this is the last closing brace

/// dev options
const dev = {
	speedMult: (x) => { gd.particles.forEach(p => { p.velX *= x; p.velY *= x }) },
	sizeMult: (x) => { gd.particles.forEach(p => { p.width *= x; p.recomputeMass(); }) },
	particles: (func) => { gd.particles.forEach(p => func(p)) },
	restart: () => { gd.game.running = false; setTimeout(main, 100) },
	unlockFramerate: () => { gd.game.running = false; setTimeout(x => (main(null, { framerateUnlocked: true })), 100) },
	addParticles: (howmany, whatsize) => {
		MM.forr(howmany, x => {
			const p = gd.game.add_particle();
			p.width = whatsize * (0.5 + Math.random())
			p.recomputeMass()
		})
	},
	remove_particle: whichone => gd.game.remove_particle(whichone)
	,
	showText: (func, sizemin) => {
		dev.particles(p => {
			if (p.size < sizemin) { return }
			Object.defineProperty(p, "txt", { get() { return func(p) } })
		})
	},
	show: (func, sizemin) => {
		dev.particles(p => {
			if (p.size < sizemin) { return }
			Object.defineProperty(p, "txt", { get() { return Math.round(func(p)) } })
		})
	},
	showMany: (func, sizemin) => {
		dev.particles(p => {
			if (p.size < sizemin) { return }
			Object.defineProperty(p, "txt", { get() { return func(p).map(Math.round).join("; ") } })
		})
	},
	copy: () => { return (JSON.stringify(gd.particles)) }
	,
	paste: (paste) => {
		gd.particles = []
		gd.game.drawables = []
		gd.game.clickables = []
		const rebuild = function () {
			const parsed = JSON.parse(paste)
			console.log(parsed)
			const ret = []
			for (data of parsed) {
				let p = new Particle()
				Object.assign(p, data)
				ret.push(p)
			}
			gd.particles = ret
			gd.game.drawables = ret
			gd.game.clickables = ret
			gd.first = gd.particles.at(-1)
		}
		rebuild()
		//setTimeout(rebuild, 100)
	},
	flood: (big = 5, med = 5, sma = 300) => {
		dev.addParticles(big, 30); dev.addParticles(med, 10); dev.addParticles(sma, 5); dev.speedMult(.1);
	},
	set isDrawing(x) { gd.game.isDrawing = x; gd.game.drawnAlready = !x },
	remove_smallertan: (size) => { gd.particles.filter(x => x.size < size).map(dev.remove_particle) },
	follow_mouse_all: (x) => {
		gd.particles.filter(u => u !== gd.first).forEach(u => { u.interactable = true; u.follow_mouse = true })
	}
}
/// settings
const stgs = {
	partrow: 5,
	partcol: 5,
	partFontSize: 20,
	randVelMax: 200,
	rps: false
}
/// global dictionary
var gd = {}
var game 
