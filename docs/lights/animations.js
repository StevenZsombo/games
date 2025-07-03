
class Animator{
	constructor(){
		this.animations = []
		this.sequences = []
	}
	
	add_anim(objoranim,frame,code,args = {}){
		if (objoranim instanceof Animation){
			this.animations.push(objoranim)
			return
		}
		this.animations.push(new Animation(objoranim,frame,code,args))
	}
	
	add_sequence(...anims){
		this.sequences.push(anims)
	}
	
	update(){
		const newAnims = []
		for (const anim of this.animations){
			anim.frame -= 1
			if (anim.frame >= 0){
				anim.animate()
				newAnims.push(anim)
			} else {
				newAnims.push(...this.update_kill(anim))
			}
		}
		this.animations = newAnims
		
		this.update_sequences() //call after single animations to avoid doubling in frame
	}
	
	update_sequences(){
		const newSequences = []
		
		for (const sequence of this.sequences){
			const last = sequence[0]
			last.frame -= 1
			if (last.frame >=0){
				last.animate()
			} else {
				this.animations.push(...this.update_kill(last))
				sequence.shift()
			}
			if (sequence.length > 0){newSequences.push(sequence)}
		}
		this.sequences = newSequences
	}
	
	update_kill(anim){
		if (anim.repeat && anim.repeat > 1){
			anim.repeat -= 1
			anim.init = false
			anim.frame = anim.totFrames
			return [anim]
		} else {
			anim.on_end?.()		//on_end only when no repeat
			anim.chainNoRep?.() //chainNoRep only when no repeat
		}
		anim.append?.() 		//append regardless
								//chain even when repeat
		const chains = [...(anim.chainMany ?? []),...(anim.chain != null ? anim.chain : [])]
		//Sif (chains.lenght>0){console.log(chains)}
		return chains
		
	}
	draw(){
		
	}
	

}

class Animation{
	constructor(obj, frame, code, args={}){//accepts chain, chainMany repeat, on_end, NOT #append
		if (!this[code]){console.log({obj,frame,code,args});throw "animation not found"}
		this.animate = this[code]
		Object.assign(this,{...args,obj,frame})
		frame = frame > 0 ? frame : 0.5 //experiment: 1 may be better, or .5
		this.totFrames = frame
	}
	
	shapingFunction(t){
		return t
	}
	
	add_chain_depr(anim){
		if (!this.chainMany){
			this.chainMany = []
		}
		if (this.chain){
			this.chainMany.push(this.chain)
			this.chain = null
		}
		this.chainMany.push(anim)
		return this
	}
	/// ///////////////////////////////////////////////////////////////////////////////////////////////////////
	///                                    animations
	
	setTemp(){//varName, val
		MM.require(this,"varName val")
		if (!this.origVal){
			this.origVal = this.obj[this.varName]
			this.obj[this.varName] = this.val
			this.append = function(){this.obj[this.varName]=this.origVal}
		}
	}
	
	setTempMany(){//varNames, vals
		MM.require(this, "varNames vals")
		if (!this.origVals){
			this.origVals = this.varNames.map(n=>this.obj[n])
			this.vals.forEach((v,i) => this.obj[this.varNames[i]]=v)
			this.append = function(){
				this.varNames.forEach((n,i) => {this.obj[n] = this.origVals[i]})
			}
		}
	}
	
	delay(){
		this.init = true
	}
	
	hide(){
		if (!this.init){
			this.init=true
			this.obj.visible = false
			this.append = function(){this.obj.visible=true}
		}
	}
	scaleFromFactor(){//scaleFactor or scaleFactorX,scaleFactorY
		MM.requireEither(this, "scaleFactor", "scaleFactorX scaleFactorY")
		//if (!this.obj instanceof Rect){console.log(obj);throw "object is not a rectangle"}	
		if (!this.init){
			this.init = true
			this.origW = this.obj.width
			this.origH = this.obj.height
			this.scaleFactorX ??= this.scaleFactor
			this.scaleFactorY ??= this.scaleFactor

		}
		const {obj,frame,totFrames,scaleFactorX,scaleFactorY,origW,origH} = this
		let t = this.shapingFunction(1 - frame/totFrames) //0 -> 1
		//scaleFactor -> 1
		obj.resize(origW*(scaleFactorX+t*(1-scaleFactorX)),origH*(scaleFactorY+t*(1-scaleFactorY)))
	}
	
	scaleToFactor(){//scaleFactor or scaleFactorX,scaleFactorY
	MM.requireEither(this, "scaleFactor", "scaleFactorX scaleFactorY")
		if (!this.init){
			this.init = true
			this.origW = this.obj.width
			this.origH = this.obj.height
			this.scaleFactorX ??= this.scaleFactor
			this.scaleFactorY ??= this.scaleFactor

		}
		const {obj,frame,totFrames,scaleFactorX,scaleFactorY,origW,origH} = this
		let t = this.shapingFunction(frame/totFrames) //0 -> 1
		//scaleFactor -> 1
		obj.resize(origW*(scaleFactorX+t*(1-scaleFactorX)),origH*(scaleFactorY+t*(1-scaleFactorY)))
		this.append = function(){this.obj.resize(origW,origH)}
	}
	
	scaleThroughFactor(){//scaleFactor or scaleFactorX,scaleFactorY
	MM.requireEither(this, "scaleFactor", "scaleFactorX scaleFactorY")
		if (!this.init){
			this.init = true
			this.origW = this.obj.width
			this.origH = this.obj.height
			this.scaleFactorX ??= this.scaleFactor
			this.scaleFactorY ??= this.scaleFactor

		}
		const {obj,frame,totFrames,scaleFactorX,scaleFactorY,origW,origH} = this
		let t = this.shapingFunction(frame/totFrames) // 0 -> 1
		t = t < .5 ? 2*t : 2*(1-t) //0->1->0
		obj.resize(origW*((scaleFactorX-1)*t+1),origH*((scaleFactorY-1)*t+1))
		this.append = function(){
			this.obj.resize(this.origW,this.origH)
		}
	}
	
	scaleFromSize(){//w,h
		MM.require(this, "w h")
		//if (!this.obj instanceof Rect){console.log(obj);throw "object is not a rectangle"}
		if (!this.init){
			this.init = true
			this.origW = this.obj.width
			this.origH = this.obj.height
			this.diffW = this.w - this.origW
			this.diffH = this.h - this.origH
		}
		const {obj,frame,totFrames} = this
		let t = this.shapingFunction(frame/totFrames) //1 -> 0
		let currW = this.origW + this.diffW*t // target -> orig
		let currH = this.origH + this.diffH*t //target -> orig
		this.obj.resize(currW,currH)
	}
	
	stepFrom(){//varName (string), startVal, !!!endVal (optional, persistent)
		MM.require(this, "varName startVal")
		if (!this.init){
			this.init = true
			this.endVal ??= this.obj[this.varName]
		}
		let t = this.shapingFunction(1 - this.frame/this.totFrames) //0 -> 1
		let currVal = this.startVal + t*(this.endVal - this.startVal) //startVal -> endVal
		this.obj[this.varName] = currVal
		
	}
	
	stepFromMany(){//varNames (Array), startVals (Array), !!!endVals (optional,persistent)
		MM.require(this, "varNames startVals")
		if (!this.init){
			this.init = true
			if (!this.endVals){
				this.endVals = []
				this.varNames.forEach((b,i)=>{
					this.endVals[i] = [this.obj[b]]
				})
			}
		}
		let t = this.shapingFunction(1 - this.frame/this.totFrames) // 0 -> 1
		this.varNames.forEach((b,i)=>{
			this.obj[b] = this.startVals[i]*(1-t)+t*this.endVals[i] // startVals -> endVals
		})
		
	}
	
	moveFrom(){//x,y
		MM.require(this,"x y")
		Object.assign(this,{varNames:["x","y"],startVals:[this.x,this.y]})
		this.animate = this["stepFromMany"]
		this.animate()
		//will never be called again
	}
	
	moveFromRel(){//dx,dy
		MM.require(this,"dx dy")
		const startX = this.obj.x+this.dx
		const startY = this.obj.y+this.dy
		Object.assign(this,{varNames:["x","y"], startVals: [startX,startY]})
		this.animate = this["stepFromMany"]
		this.animate()
		
	}
	
	wiggle(){//dx,dy
		MM.require(this,"dx dy")
		Object.assign(this, {varNames: ["x","y"], vals: [this.obj.x+this.dx, this.obj.y+this.dy]})
		this.animate = this["setTempMany"]
		this.animate()
	}
	
	
	
	
}