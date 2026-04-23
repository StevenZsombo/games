//#region Observable
class Observable {
    _value = null
    constructor(value) { this._value = value }
    get value() { return this._value }
    set value(newValue) {
        if (newValue === this._value) return
        this.refresh(newValue)
        this._value = newValue
    }
    /**@type {Set<Function(newValue,oldValue)>} */
    callbacks = new Set()
    /**
     * 
     * @param {Function(newValue,oldValue)} callback 
     * @param {boolean} [immediate=true] should it also execute?
     * @returns the unsubscribe function
     */
    subscribe(callback, immediate = true) {
        this.callbacks.add(callback)
        if (immediate) callback(this._value, null)
        return () => this.unsubscribe(callback)
    }
    unsubscribe(callback) {
        this.callbacks.delete(callback)
    }
    refresh(newValue) {
        this.callbacks.forEach(fn => fn(newValue, this._value))
    }
    monkeyPatch(obj, propertyKey) {
        const me = this
        Object.defineProperty(obj, propertyKey, {
            get() { return me.value },
            set(newValue) { me.value = newValue }
        })
    }
}
//#endregion

//#region Observatory
class Observatory {
    /**@type {Map<string, Set<Function>>} */
    on_changeCallables = new Map()
    /**@type {Map<string, Set<Function>>} */
    on_setCallables = new Map()
    /**@type {Map<string, Set<Function>>} */
    on_getCallables = new Map()
    /**@type {Map<string, *>} */
    items = new Map()

    createItem(key, value) {
        this.items.set(key, value)
    }
    setItem(key, value) {//change called AFTER changes.
        const oldValue = this.items.get(key)
        this.items.set(key, value)
        this.on_setCallables.get(key)?.forEach(fn => fn(value))
        if (oldValue !== value) this.on_changeCallables.get(key)?.forEach(fn => fn(value, oldValue))
    }
    getItem(key) {
        const value = this.items.get(key)
        this.on_getCallables.get(key)?.forEach(fn => fn(value))
        return value
    }
    removeItem(key) {
        this.on_changeCallables.delete(key)
        this.on_setCallables.delete(key)
        this.on_getCallables.delete(key)
        this.items.delete(key)
    }
    on_change(key, callable) {
        if (!this.on_changeCallables.has(key)) this.on_changeCallables.set(key, new Set())
        this.on_changeCallables.get(key).add(callable)
    }
    on_set(key, callable) {
        if (!this.on_setCallables.has(key)) this.on_setCallables.set(key, new Set())
        this.on_setCallables.get(key).add(callable)
    }
    on_get(key, callable) {
        if (!this.on_getCallables.has(key)) this.on_getCallables.set(key, new Set())
        this.on_getCallables.get(key).add(callable)
    }

}
//#endregion






//#region StateManager
class StateManager {
    /**@type {Map<string,State>} */
    states = new Map()
    /**@type {?State} */
    current = null
    get currentKey() { return this.current?.key ?? null }

    create(key) {
        return new State(this, key)
    }
    remove(key) {
        this.to(key)?.destroy()
    }
    has(key) { return this.states.has(key) }
    /**@type {function(from:?State,to:State)} */
    on_transition = null //for debugging

    /**@returns {State} */
    to(newState) {
        if (newState instanceof State) return newState
        if (typeof newState !== 'string') throw new Error(`Invalid key/state ${newState}.`)
        if (!this.states.has(newState)) throw new Error(`Invalid key/state ${newState}.`)
        return this.states.get(newState)
    }

    trans(nextState) {
        if (!this.current) {
            const st = this.to(nextState)
            this.current = st
            st.on_enter?.(null)
            this.on_transition?.(null, st)
            return true
        }
        return this.current.trans(nextState)
    }


    /**@param {number} dt*/
    update(dt) {
        return this.current?.update?.(dt)
    }
    /**@param {CanvasRenderingContext2D} ctx*/
    draw(ctx) {
        return this.current?.draw?.(ctx)
    }

}
//#endregion

//#region State
class State {
    /**
     * @param {StateManager} manager
     * @param {string} key    
    */
    constructor(manager, key) {
        this.manager = manager
        if (manager.states.has(key)) {
            throw new Error(`state with key "${key}" already exists`)
        }
        this.key = key
        manager.states.set(key, this)
    }
    /**@type {?function(dt:number)} */
    update = null
    /**@type {?function(ctx:CanvasRenderingContext2D)} */
    draw = null
    //finnicky
    /**@deprecated Yet to be implemented.*/
    check = null
    /**@deprecated Yet to be implemented.*/
    input = null
    /**@type {function(previousState:?State)} */
    on_enter = null
    /**@type {function(nextState:State)} */
    on_leave = null
    /**@type {function(): boolean} */
    canLeave = null
    /**@type {function(nextState: State): boolean} */
    canTransTo = null
    /**@type {function(): boolean} */
    isCurrent() {
        return this.manager.current === this
    }

    /**
     * @param {State|string} nextState  
     * @returns {boolean} if transition was successful
    */
    trans(nextState) {
        const st = this.manager.to(nextState)
        if (this.canLeave && !this.canLeave?.()) return false
        if (this.canTransTo && !this.canTransTo?.(st)) return false
        if (this === st) return false //no need to refresh
        //successful transition begins here
        return this.uncheckedTrans(st)
    }
    /**
     * @param {State|string} nextState 
     * @returns {boolean} if transition was successful
    */
    uncheckedTrans(nextState) {
        const st = this.manager.to(nextState)
        this.on_leave?.(st)
        this.manager.on_transition?.(this, st)
        this.manager.current = st
        st.on_enter?.(this)
        return true
    }

    destroy() {
        if (this.manager.current === this) this.manager.current = null
        this.manager.states.delete(this.key)
    }

}
//#endregion