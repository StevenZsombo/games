//should import scripts.js


window.onload = function(){
	let canvas = document.getElementById("myCanvas")
	canvas.style.touchAction = 'none';  // Most effective for modern browsers
	canvas.style.userSelect = 'none';   // Prevent text selection
	canvas.style.webkitUserDrag = 'none'; // For Safari
	document.body.style.overflow = 'hidden';
	document.documentElement.style.overflow = 'hidden';
	//Additional prevention for document (catch stray drags)
	document.addEventListener('dragover', (e) => {e.preventDefault();e.stopPropagation();})
	document.addEventListener('drop', (e) => {e.preventDefault();e.stopPropagation();})
	main(canvas)
}

const main = function(canvas = document.getElementById("myCanvas")){
	const game = new Game(canvas)
	game.tick()
}

var gd = {} //global dictionary

class Game{
	constructor(canvas){
		this.canvas = canvas
		this.screen = canvas.getContext("2d")
		this.WIDTH = canvas.width
		this.HEIGHT = canvas.height
		this.SIZE = {x: this.WIDTH, y: this.HEIGHT}
		this.rect = new Rect(0, 0, this.WIDTH, this.HEIGHT)
		this.BGCOLOR = "lightgray" //null for transparent
		this.CENTER = {x: this.SIZE.x / 2, y: this.SIZE.y / 2}
		
		this.mouser = new Mouser(canvas)
		this.keyboarder = new Keyboarder()
		this.framerate = new Framerate(false)
		
		this.drawables = []
		this.clickables = []
		
		this.initialize()
		this.initialize_more()		
	}
	initialize(){
		
	}
	
	tick(){
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
	
	update(){
		//update
		this.update_clickables()
		this.framerate.update()
		this.update_more()	

	}

	update_clickables(){
		for (const b of this.clickables){			
			b.check(this.mouser.x, this.mouser.y, this.mouser.clicked, this.mouser.released, this.mouser.held)		
		}
		
	}
		
	draw(screen){
		//draw
		this.draw_drawables(screen)
		this.framerate.draw(screen)
		
		
	}
	
	draw_reset(screen){
		if (this.BGCOLOR){
			screen.fillStyle = this.BGCOLOR
			screen.fillRect(0, 0, this.WIDTH, this.HEIGHT)
		} else {
			screen.clearRect(0, 0, this.WIDTH, this.HEIGHT)
		}
	}
	
	draw_drawables(screen){
		for (const b of this.drawables){
			b.draw(screen)
		}
	}
		
	next_loop(){
		this.mouser.next_loop()
	}
	
	add_clickable(item){
		this.add_drawable(item)
		this.clickables.push(item)
	}
	add_drawable(item){
		this.drawables.push(item)
	}
	
	////customize here
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
	initialize_more(){
		let buts = this.rect.copy.splitGrid(4,4).flat().map(b => Button.fromRect(b).inflate(-30,-30).move(30,30))
		let but = Button.fromRect(new Rect(this.WIDTH-170,10,150,50))
		gd.but = but
		but.fontsize = 24
		but.follow_mouse = true
		gd.particles = []
		
		buts.forEach(b=>{
			const maxvel = 4
			const p = new Particle({x:b.x, y:b.y, width: 20, randVelMax: 6})
			p.randVel()
			this.add_clickable(p)
			p.color = MM.randomColor()
			gd.particles.push(p)
			p.interactable = false
			p.mag = 3
			
			
		})
		gd.first = gd.particles.at(-1)
		gd.first.interactable = true
		//gd.first.follow_mouse = true
		gd.first.color = "yellow"
		Object.assign(gd.first,{velX : 3 + Math.random()*5, velY: 3 + Math.random()*5})
		this.framerate.active= true
		this.add_clickable(but)
		//gd.first.on_enter=MM.extFunc(gd.first.on_enter,function(){console.log('yay')})
		gd.colMat = Array(gd.particles.length).fill([])
		gd.iframes = 60
		this.framerate.button.follow_mouse = true
		this.clickables.push(this.framerate.button)	
		
		gd.first.on_enter = ()=>{
			if (this.mouser.held){
			let w = gd.first
			w.velX=0
			w.velY=0
			w.waitForClick = true
			//w.color = "black"
			w.outline_color = "white"
			w.move = function(){}}
		}
		gd.TODO = []
		
	}
	update_more(){
		const arr = [gd.first.x,gd.first.y,gd.first.mag].map(x=>`${Math.round(x)}`)
		gd.but.txt = arr.join(",")
		gd.but.txt = this.framerate.elapsed
		/* gd.but.txt = Math.round(gd.particles.reduce((s,t)=>{
			return s + 1/2*Math.hypot(t.velX,t.velY)**2
		},0)) */
		for (let i = 0; i < gd.particles.length; i++){
			const p = gd.particles[i]
			p.move(p.velX,p.velY)
			for (let j = 0; j < i; j++){
				const q = gd.particles[j]
				if (p.collidecirc(q)){
					Particle.collidePhysics(p,q)
					let stillcollides = true
					while (stillcollides){
						p.move(p.velX,p.velY)
						q.move(q.velX,q.velY)
						stillcollides = p.collidecirc(q)
					}

				}
				
			}
			let oob = false
			if (p.x < 0 || p.x > this.WIDTH) {
				p.velX = -p.velX
				oob = true
			}
			if (p.y < 0 || p.y > this.HEIGHT) {
				p.velY = -p.velY
				oob = true
			}
			if (oob){
				const newPos = this.rect.boundWithin(p.x,p.y)
				p.x = newPos.x
				p.y = newPos.y
			}
			
		}
		const w = gd.first
		
		if (w.waitForClick){
			if (this.mouser.released){
				w.velX = (this.mouser.x-w.x)/60
				w.velY = (this.mouser.y-w.y)/60
				w.color = "yellow"
				w.outline_color = "red"
				w.waitForClick = false
				w.move = Particle.prototype.move
			} else{
				gd.TODO.push(()=>
				MM.drawLine(this.screen,w.x,w.y,this.mouser.x,this.mouser.y)
				)
			}
		}
	}
	
	draw_more(){
		for (let func of gd.TODO){
			func()
		}
		gd.TODO = []
		MM.drawCircle(this.screen,gd.first.x,gd.first.y,gd.first.width,null,5,gd.first.outline_color)
	}
	
	next_loop_more(){
		
	}
	
	
} //this is the last closing brace



