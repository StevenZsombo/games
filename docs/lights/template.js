//should import scripts.js

var gd = {}//global dictionary, contains game
	

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



class Game{
	constructor(canvas){
		gd.game = this
		
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
		this.framerate = new Framerater(false)
		
		this.drawables = []
		this.clickables = []
		
		this.animator = new Animator()
		
		this.running = true
		
		Object.assign(gd,{
			screen: this.screen,
			add_drawable: this.add_drawable.bind(this),
			add_clickable: this.add_clickable.bind(this),
			add_anim: this.animator.add_anim.bind(this.animator),
			add_sequence: this.animator.add_sequence.bind(this.animator)
		})
		
		
		this.initialize()
		this.initialize_more()		
	}
	initialize(){
		
	}
	
	tick(){
		if (!this.running){return}
		const screen = this.screen
		this.draw_reset(screen)
		this.update()
		this.update_more()
		this.draw(screen)
		this.draw_more(screen)
		this.next_loop()
		this.next_loop_more()
		if (!this.running){return}
		requestAnimationFrame(this.tick.bind(this))
		
	}
	
	update(){
		//update
		this.update_clickables()
		this.animator.update()
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
	add_clickable_first(item){
		this.add_drawable_first(item)
		this.clickables.unshift(item)
	}
	add_drawable(item){
		this.drawables.push(item)
	}
	add_drawable_first(item){
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
	initialize_more(){
		gd.partrow = 3
		gd.partcol = 4
		gd.particleSize = 20
		gd.partFontSize = 20
		gd.randVelMax = 4
		
		let buts = this.rect.copy.splitGrid(gd.partrow,gd.partcol).flat().map(b => Button.fromRect(b).inflate(-30,-30).move(30,30))
		let but = Button.fromRect(new Rect(this.WIDTH-270,10,250,50))
		gd.but = but
		but.transparent = true
		but.opacity = .5
		but.fontsize = 24
		but.follow_mouse = true
		gd.particles = []
		
		
		buts.forEach(b=>{
			const maxvel = 4
			const p = new Particle({x:b.x, y:b.y, width: gd.particleSize, randVelMax: gd.randVelMax})
			p.randVel()
			this.add_clickable(p)
			p.color = MM.randomColor()
			gd.particles.push(p)
			p.interactable = false
			p.mag = 3
			p.rps = MM.choice("RPS")
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
		
		gd.boundary = this.rect.copy.deflate(gd.particleSize*2,gd.particleSize*2)
		
		
		
	} ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                         ^^^^INITIALIZE^^^^                                                   ///
	///                                                                                                              ///
	///                                               UPDATE                                                         ///
	/// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	update_more(){
		const txt = Math.round(gd.particles.reduce((s,t)=>{
			return s + 1/2*Math.hypot(t.velX,t.velY)**2
		},0))
		
		const RPS = "RPS".split("").map(x => gd.particles.filter(p => p.rps == x).length)
		gd.but.txtmult = `K_total = ${txt}\n R:${RPS[0]} P:${RPS[1]} S:${RPS[2]}`
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
					const [P,Q] = [p.rps,q.rps]
					if (P!= Q){
						if("RS SP PR".split(" ").includes(`${P}${Q}`)){
							q.rps=p.rps
						} else {p.rps = q.rps}
					}
				}
				
			}
			if ( !gd.boundary.collidepoint(p.x,p.y) ) {
				if (!MM.between(p.x,gd.boundary.left,gd.boundary.right)){
					p.velX *= -1
				}
				if (!MM.between(p.y,gd.boundary.top,gd.boundary.bottom)){
					p.velY *= -1
				}				
				const newPos = gd.boundary.boundWithin(p.x,p.y)
				p.x = newPos.x
				p.y = newPos.y
			}
			
		}//end of loop
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
		
	} ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                           ^^^^UPDATE^^^^                                                     ///
	///                                                                                                              ///
	///                                                DRAW                                                          ///
	///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	draw_more(screen){
		for (let func of gd.TODO){
			func()
		}
		gd.TODO = []
		
		MM.drawCircle(this.screen,gd.first.x,gd.first.y,gd.first.width,{color:null,outline: 3, outline_color: gd.first.outline_color})
		
		gd.particles.forEach(p=>{
			MM.drawText(screen,p.rps,p.x,p.y,{color:"black",font:`${gd.partFontSize}px Times`})
		})
		
		
		
		
	} ///end draw_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                            ^^^^DRAW^^^^                                                      ///
	///                                                                                                              ///
	///                                              NEXT_LOOP                                                       ///
	///start next_loop_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	next_loop_more(){
		
		console.log(gd.particles[0].x)
		
		
		
	} ///end next_loop_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	///                                          ^^^^NEXT_LOOP^^^^                                                   ///
	///                                                                                                              ///
	///                                                                                                              ///
	/// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
} //this is the last closing brace



