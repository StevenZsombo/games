const TWOPI = Math.PI*2
const ONEDEG = Math.PI/180

class Rect {
	constructor(x, y, width, height){
		this.x = x ?? 50
		this.y = y ?? 50
		this.width = width ?? 100
		this.height = height ?? 100
	}	
		
	//getters
	get size(){return {width: this.width, height: this.height}}
	
	get left() { return this.x }
	get right() { return this.x + this.width }
	get top() { return this.y }
	get bottom() { return this.y + this.height }
	get center() { return {x: this.x + this.width / 2, y: this.y + this.height / 2} }
	get cx(){return this.x + this.width / 2}
	get cy(){return this. y + this.height / 2}
	get topleft() { return {x: this.x, y: this.y} }
	get topright() { return {x: this.x + this.width, y: this.y} }
	get bottomleft() { return {x: this.x, y: this.y + this.height} }
	get bottomright() { return {x: this.x + this.width, y: this.y + this.height} }
	
	leftat(value) { this.x = value; return this; }
	rightat(value) { this.x = value - this.width; return this; }
	topat(value) { this.y = value; return this; }
	bottomat(value) { this.y = value - this.height; return this; }
	topleftat(x,y) { this.x = x; this.y = y; return this; }
	toprightat(x,y) { this.x = x - this.width; this.y = y; return this; }
	bottomleftat(x,y) { this.x = x; this.y = y - this.height; return this; }
	bottomrightat(x,y) { this.x = x - this.width; this.y = y - this.height; return this; }
   
	centerat(x,y){
		this.x = x-this.width / 2
		this.y = y-this.height / 2
		return this
	}
	
	centeratV({x,y}){
		return this.centerat(x,y)
	}
	
	centerin(rect){
		const {x,y} = rect.center
		this.centerat(x,y)
		return this
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
	
	stretch(fw, fh){
		if (!fw){fw=1}
		if (!fh){fh=1}
		const {x,y} = this.center
		this.width = this.width * fw
		this.height = this.height * fh
		this.centerat(x, y)
		return this
	}
	
	resize(w,h){
		const {x,y} = this.center
		this.width = w
		this.height = h
		this.centerat(x,y)
	}
	
	spread(x, y, sx, sy)
	{//spread out, similar to enlargement, from center point x,y
		const dx = (this.center.x-x)*(sx-1)
		const dy = (this.center.y-y)*(sy-1)
		this.move(dx,dy)
		return this
	}
	
	shrinkToSquare(enlargeInstead = false){
		const {x,y} = this.center
		const smaller = enlargeInstead ? Math.max(this.width,this.height) : Math.min(this.width,this.height)
		this.width = smaller
		this.height = smaller
		this.centerat(x,y)
		return this
	}
		
	deflate(dw,dh){
		return this.inflate(-dw,-dh)
	}
	
	boundWithin(x,y){ //takes coords, returns point
		let retX, retY
		retX = x < this.left ? this.left : x
		retX = x > this.right ? this.right : retX
		retY = y < this.top ? this.top : y
		retY = y > this.bottom ? this.bottom : retY
		return {x: retX, y: retY}
	}

	
	get copy(){
		return new Rect(this.x, this.y, this.width, this.height)
	}

	splitCell(i, j, toti, totj, jspan = 1, ispan = 1){
		i--
		j--
		//one-indexed for ease of use (like a matrix)
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
		return this.splitGridWeight(Array(rows).fill(1),Array(cols).fill(1))
	}
	
	splitGridWeight(colWeights = [1], rowWeights = [1]){
		return this.splitRow(...rowWeights).map(r => r.splitCol(...colWeights))
	}
	
}

class Clickable extends Rect{
	constructor(options = {}){
		const defaults = {
			x: 100, y: 100, width: 100, height: 100, 
			on_click: null, on_release: null, on_hover: null, on_enter: null, on_leave: null, 
			just_entered: false, last_clicked: null, follow_mouse: false, follow_mouse_last: null,
			interactable: true
		}
		super(options.x ??= defaults.x, options.y ??= defaults.y, options.width ??= defaults.width, options.height ??= defaults.height)		
		Object.assign(this,{...defaults,...options})
	}
	check(x, y, clicked, released, held){
		if (!this.interactable) {
			return false
		}
		const pos = {x: x, y: y}
		let within = this.collidepoint(x,y) //will be declared as true while dragging
		if (this.follow_mouse){ //thus drag logic must go first
			if (released){
				this.follow_mouse_last = null
				this.follow_mouse_offset = null
			}
			if (within && clicked){
				this.follow_mouse_last = pos
				this.follow_mouse_offset = {x: this.x-x, y: this.y-y}
			}
			if (held && this.follow_mouse_last){
				//this.move(x - this.follow_mouse_last.x, y - this.follow_mouse_last.y)
				within = true
				this.x = x + this.follow_mouse_offset.x
				this.y = y + this.follow_mouse_offset.y
				this.follow_mouse_last = pos
				
			}
		}
		if (within){
			this.on_hover?.()
		}
		if (within && !this.just_entered){			
			this.just_entered = true
			this.on_enter?.()
		}
		if (!within && this.just_entered){
			this.just_entered = false
			this.on_leave?.()
		}
		if (clicked && within){
			this.last_clicked = pos
			this.on_click?.()
		}
		if (released && within){
			this.on_release?.()
		}
		return within
	}
	
}

class Button extends Clickable {
	constructor(options = {}){
		const defaults = {
			txt: null, fontsize: 48, font_color: "black", font_font: "Times",
			outline: 5, outline_color: "black", color: "gray", transparent: false,
			selected: false, selected_color: "orange", hover_color: null, hover_selected_color: null,
			on_click: null, on_release: null, on_hover: null, on_enter: null, on_leave: null, 
			just_entered: false, last_clicked: null, follow_mouse: false, follow_mouse_last: null,
			visible: true, tag: "",
			img: null, opacity: 0
		}
		const settings = {...defaults,...options}
		super(settings)
		Object.assign(this, settings)
		
	}
	
	static fromRect(rect, kwargs = {}){
		kwargs.x=rect.x
		kwargs.y=rect.y
		kwargs.width=rect.width
		kwargs.height=rect.height
		return new Button(kwargs)
	}
	
	static fromButton(but, kwargs = {}){
		let temp = but.copy
		Object.assign(temp,kwargs)
		return temp
		
	}
	
	draw(screen){
		if (this.visible){
			if (!this.transparent && this.outline){
				MM.drawRect(
				screen,this.x,this.y,this.width,this.height,
				{color: this.outline_color, lineWidth: this.outline, opacity: this.opacity})
			}
			if (!this.transparent){
				let curr_color
				if (this.selected){ //selected
					if (this.just_entered && this.hover_selected_color){
						curr_color = this.hover_selected_color
					} else {
						curr_color = this.selected_color
					}
				} else if (this.hover_color && this.just_entered) { //not selected
					curr_color = this.hover_color
				} else {
					curr_color = this.color
				}
				MM.fillRect(screen,this.x,this.y,this.width,this.height,{color:curr_color,opacity:this.opacity})
			}
			if (this.img){
				MM.drawImage(screen,this.img,this)
			}
			if (this.txtmult){
				MM.drawMultiText(screen,this.txtmult,this,
				{font: `${this.fontsize}px ${this.font_font}`, color: this.font_color, opacity: this.opacity})
			}
			if (this.txt){
				MM.drawText(screen,this.txt,this.center.x,this.center.y,
				{font: `${this.fontsize}px ${this.font_font}`, color:this.font_color, opacity: this.opacity})
			}
			
		}
		
	}
	
	check(x, y, clicked, released, held){
		if (this.visible){
			return super.check(x,y,clicked,released,held)
		}
	}
	
	
	
	get copy(){
		let result = new Button()
		Object.assign(result,this)
		return result
		//return Object.assign(Object.create(Object.getPrototypeOf(this)),this)
		//would work too, but fail instanceof checks and finnicky with inheritance
	}
	
	selected_flip(){
		this.selected = !this.selected
	}
	
	static make_checkbox(button, preservePreviousFunction = false){
		const wanted = function(){this.selected = !this.selected}
		if (preservePreviousFunction){
			button.on_click = MM.extFunc(button.on_click, wanted)
		} else {
			button.on_click = wanted
		}
		return button
	}
	
	static make_radio(buttons, preservePreviousFunction = false){
		let radio_group = {buttons: buttons, selected: buttons[0]}
		radio_group.buttons.forEach(b => b.selected = (b===radio_group.selected))
		for (let b of buttons){
			const wanted = function(){buttons.forEach(a => {a.selected = (a===b)});radio_group.selected = b;}
			if (preservePreviousFunction){
				b.on_click = MM.extFunc(b.on_click, wanted)
			} else {
				b.on_click = wanted
			}
		}
		return radio_group
	}
	
	
	
	
}

class Particle extends Clickable{
	constructor(options = {}){
		const defaults = {
			color: "blue", velX: 1.2, velY: 2.1,
			unresolved: false, randVelMax: 5
		}
		super()
		Object.assign(this,{...defaults,...options})
		//oddities: radius is width, x,y refer to center instead
	}
	
	draw(screen){
		MM.drawCircle(screen, this.x,this.y,this.width,{color: this.color})
		
	}
	
	collidepoint(x,y){
		return MM.dist(this.x,this.y,x,y) < this.width
	}
	collidecirc(particle){
		if (Math.abs(this.x - particle.x)>(this.width+particle.width) || Math.abs(this.y-particle.y)>(this.width+particle.width)){return false}
		return MM.dist(this.x,this.y,particle.x,particle.y) < this.width + particle.width
	}
	
	randVel(){
		this.velX = Math.random()*this.randVelMax
		this.velY = Math.random()*this.randVelMax
	}
	
	set mag(val){
		let currmag = this.mag
		currmag = currmag == 0 ? 0.0001 : currmag
		const factor = val/currmag
		this.velX *= factor
		this.velY *= factor
	}
	
	get mag(){
		return Math.hypot(this.velX, this.velY)
	}
	
	static collidePhysics(p1, p2){
		const dx = p2.x - p1.x;
		const dy = p2.y - p1.y;
		const distance = Math.hypot(dx,dy)
		const nx = dx / distance;
		const ny = dy / distance;
		const v_rel = (p1.velX - p2.velX) * nx + (p1.velY - p2.velY) * ny;

		p1.velX -= v_rel * nx;
		p1.velY -= v_rel * ny;
		p2.velX += v_rel * nx;
		p2.velY += v_rel * ny;
	}
	
}



class Malleable{
	constructor(...comps){
		this.components = [...comps]
	}
	
	update(){
		for (let c of this.components){
			c.update?.()
		}
	}
	
	draw(screen){
		for (let c of this.components){
			c.draw?.(screen)
		}
	}
}



class Rotateable extends Rect{
	constructor(rect){
		super(rect.x,rect.y,rect.width,rect.height)
		this.rad = 0
	}
	
	get deg(){
		return this.rad/ONEDEG
	}
	set deg(degree){
		this.rad = degree*ONEDEG
	}
	
	draw(screen){
		screen.save()
		const {x,y} = this.center
		this.centerat(0,0)
		screen.translate(x,y)
		screen.rotate(this.rad)
		super.draw(screen)
		this.centerat(x,y)
		screen.restore()
	}
	
	static toRad(x){
		return toRad*ONEDEG
	}
	
	static rotatePointAroundOrigin(x,y,rad){
		const [c,s] = [Math.cos(rad), Math.sin(rad)]
		return {x: x*c-y*s, y: x*s+y*c}
	}
	
	static rotatePointAround(x,y,a,b,rad){
		const [dx,dy] = [x-a,y-b]
		const r = Rotateable.rotatePointAroundOrigin(dx,dy,rad)
		return({x: r.x+a,y: r.y+b})
	}

	
	rotateAround(u,w,rad, doNotAdjustFacing = false){
		this.rad += rad
		this.centeratV(Rotateable.rotatePointAround(this.cx,this.cy,u,w,rad))
	}
}

class MM {
	static sum(arr) {
		return arr.reduce((s,x) => s + x, 0)
	}
	
	static extFunc(func,ext){
		return function(...args){
			func?.(...args)
			return ext(...args)
			//func?.apply(this, args)
			//return ext.apply(this,args)
		}
	}
	static dist(x,y,u,w){
		return Math.hypot(x-u,y-w)
	}
	static distpos(pos1, pos2){
		return Math.hypot(pos1.x-pos2.y,pos1.y-pos2.y)
	}
	
	static drawText(screen, txt, x, y, {font = "12px Times", color = "red", opacity = 0} = {}){
		screen.save()
		screen.textAlign = "center"
		screen.textBaseline = "middle"
		screen.font = font
		screen.fillStyle = color
		screen.globalAlpha = 1 - opacity
		screen.fillText(txt, x, y)
		screen.restore()
		
	}
	
	static fillRect(screen,x,y,width,height,{color = "black",opacity = 0}={}){
		screen.save()
		screen.fillStyle = color
		screen.globalAlpha = 1 - opacity
		screen.fillRect(x,y,width,height)
		screen.restore()
	}
	
	static drawRect(screen,x,y,width,height,{lineWidth = 3, color = "black", opacity = 0} = {}){
		screen.save()
		screen.globalAlpha = 1 - opacity
		screen.lineWidth = lineWidth
		screen.strokeStyle = color
		screen.strokeRect(x,y,width,height)
		screen.restore()
	}
			
	static drawCircle(screen, x, y, width, {color = "black", outline = null, outline_color} = {}){
		if (color){
			screen.beginPath()
			screen.arc(x, y, width, 0, TWOPI) // x, y, radius, startAngle, endAngle
			screen.fillStyle = color
			screen.fill()
		}
		if (outline){
			screen.beginPath();
			screen.arc(x, y, width, 0, TWOPI)
			screen.strokeStyle = outline_color ?? color
			screen.lineWidth = outline
			screen.stroke()
		}
	}
	
	static drawLine(ctx, x, y, u, w, {color = 'black', width = 5} = {}) {
		ctx.save()
		ctx.strokeStyle = color
		ctx.lineWidth = width
		ctx.beginPath()
		ctx.moveTo(x, y)
		ctx.lineTo(u, w)
		ctx.stroke()
		ctx.restore()
	}
	
	static drawMultiText(screen, txtorarr, rect, {font="12px Times", color = "black", opacity = 0}={}){
			screen.save()
			screen.textAlign = "center"
			screen.textBaseline = "middle"
			screen.font = font
			screen.fillStyle = color
			screen.globalAlpha = 1 - opacity
			const lines = Array.isArray(txtorarr) ? txtorarr : txtorarr.split("\n")
			const h = rect.height / lines.length
			for (let i = 0; i < lines.length; i++){
				screen.fillText(lines[i], rect.center.x, rect.y + (i+.5)*h)
			}
			screen.restore()
	}
	
	static drawImage(screen, img, rect){
		screen.save()
		screen.drawImage(img,rect.x,rect.y,rect.width,rect.height)
	}
	
	static between(x,min,max){
		return (x >= min) && (x <= max)
	}
	
	static boundWithin(x,min,max){
		let ret = x < min ? min : x
		ret = x > max ? max : ret
		return ret
	}
	
	static randomColor(min=50,max=250){
		return `rgb(${Math.random()*(max-min)+min},${Math.random()*(max-min)+min},${Math.random()*(max-min)+min})`
	}
	
	static forr(arg1, arg2, arg3){ //forr(2,f) or forr(2,4,f)
		let start, end, func
		if (arg3){
			[start,end,func] = [arg1,arg2,arg3]
		} else {
			[start,end,func] = [0,arg1,arg2]
		}
		const step = start < end ? 1 : -1
		const ret = []
		for (let i = start; i < end; i += step){
			ret.push(func(i))
		}
		return ret
	}
	
	static choice(arr, num = 1){//TODO
		return arr.at(Math.floor(Math.random()*arr.length))
	}
	
	static putAsFirst(arr,val){
		return [val,...arr.filter(x=>x!==val)]
	}
	
	static putAsLast(arr,val){
		return [...arr.filter(x=>x!==val),val]
	}
	
	static insert(arr, item, start = null, end = null){
		if (arr.length == 0){return []}
		const ret = []
		start != null ? ret.push(start) : null
		ret.push(arr[0])
		for (let i = 1; i < arr.length; i++){
			ret.push(item)
			ret.push(arr[i])
		}
		end != null ? ret.push(end) : null
		return ret
		
	}
	
	static require(obj, propertyNamesWithSpace){
		for (const name of propertyNamesWithSpace.split(" ")){
			if (obj[name] === undefined){
				console.log({propertyNamesWithSpace,name,obj})
				throw "require failed"
			} 
		}
	}
	static requireEither(obj, props1, props2){
		if (
			props1.split(" ").some(x => obj[x] === undefined) && props2.split(" ").some(x => obj[x] === undefined)
		){
			console.log({obj,props1,props2})
			throw "requireEither failed"
		}
	}
		
	static zip(u, w){
		ret = []
		for (i = 0; i < Math.min(u.length, w.length); i++){
			ret.push([u[i],w[i]])
		}
		return ret
	}
	
}///end


//coolest shit ever: 
/*
(a=> a**2)(3) //will immediately evaluate
let a = but.on_enter; but.on_enter = ()=>{a(); console.log("hello")}
//but.on_enter = (orig => ()=>{orig();console.log("yay")})(but.on_enter)
careful with ()=>{}, it won't handle this like function(){} does
*/