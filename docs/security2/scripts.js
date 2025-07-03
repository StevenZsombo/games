class Rect {
	constructor(x, y, width, height){
		this.x = x
		this.y = y
		this.width = width
		this.height = height
	}	
		
	get left() {return this.x}

	get right() {return this.x + this.width}

	get top() {return this.y}

	get bottom() {return this.y + this.height}

	get center() {return {x: this.x + this.width / 2,y: this.y + this.height / 2}}
	
	get topleft() {return {x: this.x, y: this.y}}
	
	get topright() {return {x: this.x + this.width, y: this.y}}
	
	get bottomleft() {return {x: this.x, y: this.y + this.height}}
	
	get bottomright() {return {x: this.x + this.width, y:this.y + this.height}}
   
	centerat(x,y){
		this.x = x-this.width / 2
		this.y = y-this.height / 2
	}
	
	draw(screen, color = 'purple', fill = true) {
		if (fill) {
			screen.fillStyle = color
			screen.fillRect(this.x, this.y, this.width, this.height)
		} else { //!fill
			screen.strokeStyle = color
			screen.strokeRect(this.x, this.y, this.width, this.height)
		}
	}
	
	collidepoint(x,y){
		return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height
	}
	
	colliderect(rect){
		return  this!==rect && this.x < rect.x + rect.width && this.x + this.width > rect.x && this.y < rect.y + rect.height && this.y + this.height > rect.y
	}
	
	move(dx,dy){
		this.x += dx
		this.y += dy
		return this
	}
	
	inflate(dw, dh) {
		this.x -= dw / 2
		this.y -= dh / 2
		this.width += dw
		this.height += dh
		return this
	}
	
	inflatef(fw, fh){
		const oldcenter = this.center
		this.width = this.width * fw
		this.height = this.height * fh
		this.centerat(oldcenter.x, oldcenter.y)
		return this
	}
	
	get copy(){
		return new Rect(this.x, this.y, this.width, this.height)
	}

	splitCell(i, j, toti, totj, jspan = 1, ispan = 1){
		//zero-indexed
		const w = this.width / totj
		const h = this.height / toti
		return new Rect(this.x + j*w, this.y + i*h, w*jspan, h*ispan)
	}
	
	splitCol(...weights){
		const totj = MM.sum(weights)
		const w = this.width / totj
		const result = []
		let k = 0
		for (let c of weights){
			result.push(new Rect(this.x + k*w, this.y, c*w, this.height))
			k += c
		}
		return result
	}
	
	splitRow(...weights){
		const toti = MM.sum(weights)
		const h = this.height / toti
		const result = []
		let k = 0
		for (let c of weights){
			result.push(new Rect(this.x, this.y + k*h, this.width, c*h))
			k += c
		}
		return result
	}
	
	splitGrid(cols, rows){
		return this.splitGridWeight(Array(cols).fill(1),Array(rows).fill(1))
	}
	
	splitGridWeight(colWeights = [1], rowWeights = [1]){
		return this.splitRow(...rowWeights).map(r => r.splitCol(...colWeights))
	}
	
}

class Button extends Rect {
	constructor({
	x = 100,y = 100,width = 100,height = 100,
	txt = null, fontsize = 48, font_color = "black", font_font = "Times",
	outline = 5, outline_color = "black", default_color = "gray", transparent = false,
	selected = false, selected_color = "pink", hover_color = null,
	on_click = null, on_release = null, on_hover = null, on_enter = null, on_leave = null, 
	just_entered = false, last_clicked = null, follow_mouse = false, follow_mouse_last = null,
	visible = true, tag = ""
	} = {}){
		super(x,y,width,height)
		Object.assign(this, 
		{x,y,width,height,
		txt,fontsize,font_color,font_font,
		outline,outline_color,default_color,transparent,
		selected,selected_color, hover_color,
		on_click,on_release,on_hover,on_enter,on_leave,
		just_entered,last_clicked, follow_mouse, follow_mouse_last,
		visible, tag}
		)
		this.current_color = default_color
	}
	
	static fromRect(rect, kwargs = {}){
		kwargs.x=rect.x
		kwargs.y=rect.y
		kwargs.width=rect.width
		kwargs.height=rect.height
		return new Button(kwargs)
	}
	
	draw(screen){
		if (this.visible){
			if (this.outline){
				screen.lineWidth = this.outline
				screen.strokeStyle = this.outline_color
				screen.strokeRect(this.x,this.y,this.width,this.height)
			}
			if (!this.transparent){
				if (this.selected){
					screen.fillStyle = this.selected_color
				} else if (this.hover_color && this.just_entered) {
					screen.fillStyle = this.hover_color
				} else {
					screen.fillStyle = this.current_color
				}
				screen.fillRect(this.x,this.y,this.width,this.height)
			}
			if (this.txt){
				screen.font = `${this.fontsize}px ${this.font_font}`
				screen.textAlign = "center"
				screen.textBaseline = "middle"
				screen.fillStyle = this.font_color
				screen.fillText(this.txt,this.center.x,this.center.y)
			}
		}
		
	}
	
	
	check(x,y, clicked, released, held){
		const pos = {x: x, y: y}
		const within = this.collidepoint(x,y)
		if (within){
			if (this.on_hover){this.on_hover(this)}
		}
		if (within && !this.just_entered){			
			this.just_entered = true
			if (this.on_enter){this.on_enter(this)}
		}
		if (!within && this.just_entered){
			this.just_entered = false
			if (this.on_leave){this.on_leave(this)}
		}
		if (clicked && within){
			this.last_clicked = pos
			if (this.on_click){this.on_click(this)}
		}
		if (released && within){
			if (this.on_release){this.on_release(this)}
		}
		if (this.follow_mouse){
			if (released){
				this.follow_mouse_last = null
			}
			if (within && clicked){
				this.follow_mouse_last = pos
			}
			if (held && this.follow_mouse_last){
				this.move(x - this.follow_mouse_last.x, y - this.follow_mouse_last.y)
				this.follow_mouse_last = pos
			}
		}
		
	}
	
	static make_checkbox(button){
		button.on_click = function(self){self.selected = !self.selected}
	}
	
	static make_radio(buttons){
		let radio_group = {buttons: buttons, selected: buttons[0]}
		radio_group.buttons.forEach(b => b.selected = (b===radio_group.selected))
		for (let b of buttons){
			b.on_click = function(self){
				buttons.forEach(a => {a.selected = (a===b)})
				radio_group.selected = b
			}
		}
		return radio_group
	}
	
	
}

class MM {
	static sum(arr) {
		return arr.reduce((s,x) => s + x, 0)
	}
	
	
}