//should import scripts.js


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

var gd = {} //global dictionary

class Game {
	constructor(canvas) {
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
		this.framerate = new Framerate(false)

		this.drawables = []
		this.clickables = []

		this.initialize()
		this.initialize_more()
	}
	initialize() {

	}

	tick() {
		const screen = this.screen
		this.draw_reset(screen)
		this.update()
		this.update_more()
		this.draw(screen)
		this.draw_more(screen)
		this.next_loop()
		this.next_loop_more()
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
	add_drawable(item) {
		this.drawables.push(item)
	}

	/// customize here
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
	///                                                                                                                |
	///                                                                                                                |
	///                                             INITIALIZE                                                         |
	/// start initialize_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	initialize_more() {
		gd.buts = []

		this.rect.copy.shrinkToSquare().stretch(.9, .9).splitGrid(4, 4).forEach((row, j) => {
			gd.buts[j] = []
			row.forEach((b, i) => {
				const verify = function () {
					if (gd.buts.flat().every(x => x.selected)) {
						setTimeout(x => alert("victory!"), 100)
					}
				}
				b = Button.fromRect(b)
				b.deflate(15, 15)

				Button.make_checkbox(b)
				//b.hover_color = "pink"
				this.add_clickable(b)
				b.color = "darkred"
				b.selected_color = "darkgreen"
				//b.selected_hover_color = 
				gd.buts[j][i] = b
				b.tag = [j, i]
				b.selected = Math.random() > .5
				b.on_click = function () {
					MM.forr(4, x => { gd.buts[j][x].selected_flip() })
					MM.forr(4, x => { gd.buts[x][i].selected_flip() })
					this.selected_flip()
					verify()
				}
			})

		})
		//setTimeout(x=> alert("Clicking a cell flips the color of every cells in its row and column. Make all the cells green!"),100)


	} ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                                                                   |
	///                                                                                                                |
	///                                               UPDATE                                                           |
	/// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	update_more() {




	}
	///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                                                                                                |
	///                                                                                                                |
	///                                                DRAW                                                            |
	///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	draw_more() {





	} ///end draw_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                                                                                                |
	///                                                                                                                |
	///                                               NEXT_LOOP                                                                 |
	///start next_loop_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	next_loop_more() {





	} ///end next_loop_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                                                                                                |
	///                                                                                                                |
	///                                                                                                                |
	/// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
} //this is the last closing brace



