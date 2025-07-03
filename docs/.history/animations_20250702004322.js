class Animator {
	constructor() {
		this.animations = []
		this.sequences = []
	}

	add_anim(objoranim, time, code, args = {}) {
		if (objoranim instanceof Anim) {
			this.animations.push(objoranim)
			return
		}
		this.animations.push(new Anim(objoranim, time, code, args))
	}

	add_sequence(...anims) { // input is flattened
		this.sequences.push(anims.flat())
	}

	update(dt) {
		const newAnims = []
		for (const anim of this.animations) {
			anim.time -= dt //times+frames are only managed here
			if (anim.time >= 0) {
				anim.animate()
				newAnims.push(anim)
			} else {
				newAnims.push(...this.update_kill(anim))
			}
		}
		this.animations = newAnims

		this.update_sequences()
		//call after single animations to avoid doubling in time
	}

	update_sequences() {
		const newSequences = []

		for (const sequence of this.sequences) {
			const last = sequence[0]
			last.time -= 1
			if (last.time >= 0) {
				last.animate()
			} else {
				this.animations.push(...this.update_kill(last))
				sequence.shift()
			}
			if (sequence.length > 0) {
				newSequences.push(sequence)
			}
		}
		this.sequences = newSequences
	}

	update_kill(anim) {
		anim.append?.()
		//append regardless, and first!
		if (anim.repeat && anim.repeat > 1) {
			anim.repeat -= 1
			anim.init = false //for true repetition
			anim.time = anim.totTime
			anim.animate() //no lost frame
			return [anim]
			//breaks out of the function: no chains happen on rep.
		} else {
			anim.on_end?.()
			//on_end only when no repeat
		}
		//chain even when repeat
		const chains = [...(anim.chainMany ?? []), ...(anim.chain != null ? [anim.chain] : [])]
		//Sif (chains.lenght>0){console.log(chains)}
		for (anim of chains) {
			anim.animate()
		}
		return chains

	}
	draw() {
	}

}

class Anim {
	constructor(obj, time, code, args = {}) {
		//accepts chain, chainMany repeat, on_end, lerp, mutate                    NEVER #append
		//all changes are non-mutating: object properties are to be reset when we are done!
		//this can be overriden by {mutate:true}//TODO actually implement this.
		if (!this[code]) {
			console.log({
				obj,
				time,
				code,
				args
			});
			throw "animation not found"
		}
		if (args.append != null) { throw "shouldn't ever append" }
		this.animate = this[code]
		Object.assign(this, {
			...args,
			obj,
			time,
			code // just for debugging
		})
		time = time > 0.001 ? time : 0.001 //at least a single frame
		this.totTime = time
	}

	lerp(t) {
		return t
	}

	extendChain(anim) {
		if (!this.chainMany) {
			this.chainMany = []
		}
		if (this.chain) {
			this.chainMany.push(this.chain)
			this.chain = null
		}
		this.chainMany.push(anim)
		return this
	}
	/// ///////////////////////////////////////////////////////////////////////////////////////////////////////
	///                                    animations                                convention: no this beyond init
	///

	setTemp() {
		//varName, val
		if (!this.origVal) {
			MM.require(this, "varName val")
			this.origVal = this.obj[this.varName]
			this.obj[this.varName] = this.val
			this.append = function () {
				this.obj[this.varName] = this.origVal
			}
		}
	}

	setTempMany() {
		//varNames, vals
		if (!this.origVals) {
			MM.require(this, "varNames vals")
			this.origVals = this.varNames.map(n => this.obj[n])
			this.vals.forEach((v, i) => this.obj[this.varNames[i]] = v)
			this.append = function () {
				this.varNames.forEach((n, i) => {
					this.obj[n] = this.origVals[i]
				}
				)
			}
		}
	}

	delay() {
		if (!this.init) {
			this.init = true
		}
	}

	hide() {
		if (!this.init) {
			this.init = true
			this.obj.visible = false
			this.append = function () { this.obj.visible = true }
		}
	}
	scaleFromFactor() {
		//scaleFactor or scaleFactorX,scaleFactorY
		//if (!this.obj instanceof Rect){console.log(obj);throw "object is not a rectangle"}	
		if (!this.init) {
			MM.requireEither(this, "scaleFactor", "scaleFactorX scaleFactorY")
			this.init = true
			this.origW = this.obj.width
			this.origH = this.obj.height
			this.scaleFactorX ??= this.scaleFactor
			this.scaleFactorY ??= this.scaleFactor
			this.append = function () { this.obj.resize(this.origW, this.origH) }

		}
		const { obj, time, totTime, scaleFactorX, scaleFactorY, origW, origH } = this
		let t = this.lerp(1 - time / totTime)
		//0 -> 1
		//scaleFactor -> 1
		obj.resize(origW * (scaleFactorX + t * (1 - scaleFactorX)), origH * (scaleFactorY + t * (1 - scaleFactorY)))
	}

	scaleToFactor() {
		//scaleFactor or scaleFactorX,scaleFactorY
		if (!this.init) {
			MM.requireEither(this, "scaleFactor", "scaleFactorX scaleFactorY")
			this.init = true
			this.origW = this.obj.width
			this.origH = this.obj.height
			this.scaleFactorX ??= this.scaleFactor
			this.scaleFactorY ??= this.scaleFactor
			this.append = function () { obj.resize(this.origW, this.origH) }

		}
		const { obj, time, totTime, scaleFactorX, scaleFactorY, origW, origH } = this
		let t = this.lerp(time / totTime)
		//0 -> 1
		//scaleFactor -> 1
		obj.resize(origW * (scaleFactorX + t * (1 - scaleFactorX)), origH * (scaleFactorY + t * (1 - scaleFactorY)))

	}

	scaleThroughFactor() {
		//scaleFactor or scaleFactorX,scaleFactorY
		if (!this.init) {
			MM.requireEither(this, "scaleFactor", "scaleFactorX scaleFactorY")
			this.init = true
			this.origW = this.obj.width
			this.origH = this.obj.height
			this.scaleFactorX ??= this.scaleFactor
			this.scaleFactorY ??= this.scaleFactor
			this.append = function () { this.obj.resize(this.origW, this.origH) }
		}
		const { obj, time, totTime, scaleFactorX, scaleFactorY, origW, origH } = this
		let t = this.lerp(time / totTime)
		// 0 -> 1
		t = t < .5 ? 2 * t : 2 * (1 - t)
		//0->1->0
		obj.resize(origW * ((scaleFactorX - 1) * t + 1), origH * ((scaleFactorY - 1) * t + 1))

	}

	scaleFromSize() {
		//w,h
		//if (!this.obj instanceof Rect){console.log(obj);throw "object is not a rectangle"}
		if (!this.init) {
			MM.require(this, "w h")
			this.init = true
			this.origW = this.obj.width
			this.origH = this.obj.height
			this.diffW = this.w - this.origW
			this.diffH = this.h - this.origH
			this.append = this.obj.resize(this.origW, this.origH)
		}
		const { obj, time, totTime } = this
		let t = this.lerp(time / totTime)
		//1 -> 0
		let currW = this.origW + this.diffW * t
		// target -> orig
		let currH = this.origH + this.diffH * t
		//target -> orig
		this.obj.resize(currW, currH)
	}



	step() {
		//varName (string), startVal, endVal (optional)
		if (!this.init) {
			MM.requireEither(this, "varName startVal", "varName endVal")
			MM.require(this.obj, this.varName)
			this.init = true
			const orig = this.obj[this.varName]
			this.origVal = orig
			this.startVal ??= orig
			this.endVal ??= orig
			this.append = () => { this.obj[this.varName] = orig }
		}
		let t = this.lerp(1 - this.time / this.totTime)
		//0 -> 1
		let currVal = this.startVal + t * (this.endVal - this.startVal)
		//startVal -> endVal
		this.obj[this.varName] = currVal

	}

	stepMany() {
		//varNames (Array), startVals (Array) and/or endVals (Array)
		if (!this.init) {
			MM.requireEither(this, "varNames startVals", "varNames endVals")
			this.init = true
			if (!this.endVals) {
				this.endVals = []
				this.varNames.forEach((b, i) => {
					this.endVals[i] = this.obj[b]
				}
				)
			}
			if (!this.startVals) {
				this.startVals = []
				this.varNames.forEach((b, i) => {
					this.startVals[i] = this.obj[b]
				}
				)
			}
			this.origVals = []
			this.varNames.forEach((b, i) => {
				this.origVals[i] = this.obj[b]
			})
			this.append = function () {
				this.varNames.forEach((b, i) => {
					this.obj[b] = this.origVals[i]
				})
			}
		}
		let t = this.lerp(1 - this.time / this.totTime)
		// 0 -> 1
		this.varNames.forEach((b, i) => {
			this.obj[b] = this.startVals[i] * (1 - t) + t * this.endVals[i]
			// startVals -> endVals
		}
		)

	}

	moveFrom() {
		//x,y
		MM.require(this, "x y")
		Object.assign(this, {
			varNames: ["x", "y"],
			startVals: [this.x, this.y]
		})
		this.animate = this["stepMany"]
		this.animate()
		//will never be called again
	}

	moveFromRel() {
		//dx,dy
		MM.require(this, "dx dy")
		const startX = this.obj.x + this.dx
		const startY = this.obj.y + this.dy
		Object.assign(this, {
			varNames: ["x", "y"],
			startVals: [startX, startY]
		})
		this.animate = this["stepMany"]
		this.animate()
		//will never be called again
	}

	moveTo() {
		//x,y
		MM.require(this, "x y")
		Object.assign(this, {
			varNames: ["x", "y"],
			startVals: [this.obj.x, this.obj.y]
		})
		this.obj.x = this.x
		this.obj.y = this.y
		this.animate = this["stepMany"]
		this.animate()
	}

	moveToRel() {
		//dx,dy
		MM.require(this, "dx dy")
		Object.assign(this, {
			varNames: ["x", "y"],
			startVals: [this.obj.x, this.obj.y]
		})
		this.obj.x += this.dx
		this.obj.y += this.dy
		this.animate = this["stepMany"]
		this.animate()

	}

	wiggle() {
		//dx,dy
		MM.require(this, "dx dy")
		Object.assign(this, {
			varNames: ["x", "y"],
			vals: [this.obj.x + this.dx, this.obj.y + this.dy]
		})
		this.animate = this["setTempMany"]
		this.animate()
		//will never be called again
	}

	rotate() {
		//startRad OR endRad on Anim (not on obj)
		// obj must have draw & center
		if (!this.init) {
			MM.requireEither(this, "startRad", "endRad")
			MM.require(this.obj, "draw center")
			this.startRad ??= 0
			this.endRad ??= 0
			this.origDrawFunction = this.obj.draw
			this.obj.draw = null //TODO
			this.append = () => { this.obj.draw = this.origDrawFunction }
		}


	}

	static interpol(start, end, t) {
		return start + t * (end - start)
	}
	/*
		if (!this.init) {
				MM.requireEither(this, "varName startVal", "varName endVal")
				MM.require(this.obj, this.varName)
				this.init = true
				const orig = this.obj[this.varName]
				this.origVal = orig
				this.startVal ??= orig
				this.endVal ??= orig
				this.append = () => { this.obj[this.varName] = orig }
			}
			let t = this.lerp(1 - this.time / this.totTime)
			//0 -> 1
			let currVal = this.startVal + t * (this.endVal - this.startVal)
			//startVal -> endVal
			this.obj[this.varName] = currVal
	 */
}
