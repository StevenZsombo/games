class Animator {
	constructor() {
		this.animations = [] //non-sequences lock by default unless {noLock:true}
		this.sequences = [] //sequences don't use lock
		this.locked = new Set()
	}

	add_anim(objoranim, time, code, args = {}) {
		if (!(objoranim instanceof Anim)) { //can just pass Anim immediately
			objoranim = new Anim(objoranim, time, code, args)
		}
		if (!(objoranim.noLock) && this.locked.has(objoranim.obj)) {
			console.error(this);// throw "Object is locked"
		}
		this.locked.add(objoranim.obj)
		this.animations.push(objoranim)


	}

	add_sequence(...anims) { // input is flattened
		this.sequences.push(anims.flat())
	}
	/**@param {Anim} [specimenAnim] apply this Anim to each object 
	* @param {function  | null} [on_each_start] apply this at the start of each
	* @param {function  | null} [on_final] apply this to the very last animation
	*/
	add_staggered(objList, delay, specimenAnim, { initialDelay = 0, on_each_start = null, on_final = null } = {}) {
		objList.forEach((obj, i) => {
			const a = specimenAnim.copy
			a.obj = obj
			if (on_final && i == objList.length - 1) { a.on_end = on_final }
			this.add_anim(obj, initialDelay + delay * i, "delay", { on_end: on_each_start, chain: a })
		})
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

		this.update_sequences(dt)
		//call after single animations to avoid doubling in time
	}

	update_sequences(dt) {
		const newSequences = []

		for (const sequence of this.sequences) {
			const last = sequence[0]
			last.time -= dt
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
			anim.on_repeat?.()
			anim.animate() //no lost frame
			return [anim]
			//breaks out of the function: no chains happen on rep.
		} else {
			anim.on_end?.()
			//on_end only when no repeat
		}
		//chain even when repeat
		const chains = [...(anim.chainMany ?? []), ...(anim.chain != null ? [anim.chain] : [])]
		for (anim of chains) {
			anim.animate()
		}
		this.locked.delete(anim.obj)
		return chains
	}
	draw() {
	}

}

class Anim {
	/**
	 * @param {Object} obj - Target object to animate
	 * @param {number} time - Duration in ms
	 * @param {string} code - Animation type
	 * @param {Object} [args={}] - Animation configuration
	 * @param {Anim} [args.chain] - Animation to chain to
	 * @param {Aray<Anim>} [args.chainMany] - Animations to chain to
	 * @param {Function} [args.on_end] - Callback when animation completes
	 * @param {string|Function} [args.lerp] - Lerp function name or function
	 * @param {number} [args.repeat] - How many times to repeat
	 * @param {Function}[args.on_repeat] - What to do on repeat
	 * @param {boolean}[args.noLock] - Avoids animation lock check, use with care
	 */
	constructor(obj, time, code, args = {}) {
		//accepts chain, chainMany repeat, on_end, lerp              NEVER #append
		//all changes are non-mutating: object properties are to be reset when we are done!
		if (!this[code]) {
			console.log({
				obj,
				time,
				code,
				args
			});
			throw "animation not found"
		}
		if (args.append !== undefined) { throw "shouldn't ever append" }
		this.animate = this[code]
		Object.assign(this, {
			...args,
			obj,
			time,
			code // just for debugging
		})
		if (typeof args?.lerp === "string") { this.lerp = Anim.library[this.lerp] }

		this.totTime = time
	}
	get copy() {
		return new Anim(this.obj, this.totTime ?? this.time, this.code, this)
	}
	/**
	 * Creates a custom animation
	 * @param {Object} obj - Target object
	 * @param {number} time - Duration in ms
	 * @param {Function} func - Animation function, receives t = 0 -> 1
	 * @param {string|Array<string>} origStrArr - Space-separated string or array
	 * @returns {Anim} Animation instance
	 */
	static custom(obj, time, func, origStrArr, args = {}) {
		if (origStrArr && !Array.isArray(origStrArr)) { origStrArr = origStrArr.split(" ") }
		const settings = { func: func, orig: origStrArr, ...args }
		return new Anim(obj, time, "custom", settings)
	}
	/**
	 * Shorthand for "stepMany" 
	 * @param {Object} obj - Target object
	 * @param {number} time - Duration in ms
	 * @param {string | Array<string>} varNames - Property names (space-separated or array)
	 * @returns {Anim}
	 */
	static stepper(obj, time, varNames, startVals, endVals, args = {}) {
		if (!Array.isArray(varNames)) { varNames = varNames.split(" ") }
		if (!Array.isArray(startVals)) { startVals = [startVals] }
		if (!Array.isArray(endVals)) { endVals = [endVals] }

		const settings = { varNames, startVals, endVals, ...args }
		return new Anim(obj, time, "stepMany", settings)
	}
	static delay(time, args = {}) {
		return new Anim(null, time, "delay", args)
	}

	lerp(t) {
		return t
	}
	static library = {
		"reverse": t => 1 - t,
		"smoothstep": t => 3 * t ** 2 - 2 * t ** 3,
		"smootherstep": t => t * t * t * (t * (6 * t - 15) + 10),
		"vee": t => t < 0.5 ? 2 * t : 2 - 2 * t,
		"veeReverse": t => t > 0.5 ? 1 - 2 * t : 2 * t - 1,
		"square": t => t ** 2,
		"sqrt": t => t ** .5,
		"sin": t => Math.sin(t / NINETYDEG),
		"cos": t => Math.cos(t / NINETYDEG),
		"sinFull": t => Math.sin(t / PI),
		"cosFull": t => Math.cos(t / PI)

	}





	/**
	 * Extends the current chain
	 * @param {Anim} anim 
	 */
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
		/*if (!this.init) {
			this.init = true
		}*/
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

	stretchFrom() {
		//w,h
		//if (!this.obj instanceof Rect){console.log(obj);throw "object is not a rectangle"}
		if (!this.init) {
			MM.require(this, "w h")
			this.init = true
			this.origW = this.obj.width
			this.origH = this.obj.height
			this.diffW = this.w - this.origW
			this.diffH = this.h - this.origH
			this.append = function () { this.obj.resize(this.origW, this.origH) }
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
			this.append = function () { this.obj[this.varName] = orig }
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

	rotate() {//BIG TODO? seems useless tho
		//startRad OR endRad on Anim (not on obj)
		// obj must have draw & center
		if (!this.init) {
			MM.requireEither(this, "startRad", "endRad")
			MM.require(this.obj, "draw center")
			this.init = true
			this.startRad ??= 0
			this.endRad ??= 0
			this.origDrawFunction = this.obj.draw
			this.obj.draw = null //TODO
			this.append = () => { this.obj.draw = this.origDrawFunction }
		}
	}

	typingCentered() {
		if (!this.init) {
			this.init = true
			const obj = this.obj
			this.origTxt = obj.txt
			this.len = obj.txt.length
			this.append = () => { this.obj.txt = this.origTxt }
		}
		const t = this.lerp(1 - this.time / this.totTime)//0 -> 1
		this.obj.txt = this.origTxt.slice(0, Math.floor(t * this.len))
	}

	typing() {
		if (!this.init) {
			this.init = true
			const obj = this.obj
			this.origTxt = obj.txt
			this.len = obj.txt.length
			this.append = () => { this.obj.txt = this.origTxt }
		}
		const t = this.lerp(1 - this.time / this.totTime)//0 -> 1
		const progress = Math.floor(t * this.len)
		this.obj.txt = [...this.origTxt.slice(0, progress), ...Array(this.len - progress).fill(" ")].join("")
	}


	static interpol(start, end, t) {
		return start + t * (end - start)
	}

	custom() {
		//{func: (t,obj)=>{}}, {orig:string[]} will be restored at the end
		if (!this.init) {
			MM.require(this, "func")
			this.init = true
			if (this.orig) {
				this.origVals = this.orig.map(x => this.obj[x])
				this.append = () => { this.orig?.forEach((x, i) => this.obj[x] = this.origVals[i]) }
			}
		}
		const t = this.lerp(1 - this.time / this.totTime) //0 -> 1
		//this.func.bind(this, t)
		this.func(t, this.obj)

	}
}
