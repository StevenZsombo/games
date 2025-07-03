class Framerater{
	constructor(active = true){
		this.measuredTimeInterval = 250 //for now lock at 500, should be 30 or so or even less
		this.frameAt = [] 
		this.fps = 0.1
		this.button = new Button({x: 10, y: 10, width: 30, height: 15, fontsize: 12, color: "yellow", outline: 0, follow_mouse: true})
		this.active = active
		this.startTime = Date.now()
	}
	get elapsed(){
		return Math.floor((Date.now()-this.startTime)/100)/10
	}
	update(){
		if (this.active){
			let curr_time = Date.now()
			this.frameAt.push(curr_time)
			let i = this.frameAt.findIndex(x => curr_time - x < this.measuredTimeInterval)
			this.frameAt = this.frameAt.slice(i)
			this.fps = Math.floor(this.frameAt.length / this.measuredTimeInterval * 1000)
		}
	}
	
	draw(screen){
		if (this.active) {
		this.button.txt = this.fps
		this.button.draw(screen)
		}
	}
}

class Keyboarder{
	constructor(){
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
	constructor(canvas){
		this.x = 0
		this.y = 0
		this.clicked = false
		this.released = false
		this.down = false		
		this.addListeners(canvas)
	}
	addListeners(canvas) {
		canvas.addEventListener('pointermove', (e) => {
			e.preventDefault(); e.stopPropagation;
			const rect = canvas.getBoundingClientRect();
  			this.x = e.clientX - rect.left
			this.y = e.clientY - rect.top
			//pointer.type = e.pointerType //can be 'mouse', 'pen', 'touch'
		})
		canvas.addEventListener('pointerdown', (e) => {
			e.preventDefault(); e.stopPropagation;
			const rect = canvas.getBoundingClientRect();
  			this.x = e.clientX - rect.left
			this.y = e.clientY - rect.top
			this.clicked = true
			this.down = true
		})
		canvas.addEventListener('pointerup', (e) => {
			e.preventDefault(); e.stopPropagation;
			this.x = e.clientX
			this.y = e.clientY
			this.released = true
			this.down = false
		})
		canvas.addEventListener('pointerout', (e) => {
			e.preventDefault(); e.stopPropagation;
			this.released = true
		})
		canvas.addEventListener('pointercancel', (e) => {
			e.preventDefault(); e.stopPropagation;
			this.released = true
		})
	}	
	get held(){
		return this.down && !this.released
	}
	
	get pos(){
		return {x: this.x, y: this.y}
	}
	
	next_loop(){
		this.clicked = false
		this.released = false
	}
	
}