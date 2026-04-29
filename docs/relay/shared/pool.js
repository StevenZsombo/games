//#region Pool
class Pool {
    static singletonAlreadyExists = false
    LIMIT = 100
    /**@type {Map<number,Player} */
    players = new Map()
    /**@type {Map<number,Loca} */
    locas = new Map()
    /**@type {Map<number,Terminal} */
    terminals = new Map()
    constructor() {
        if (Pool.singletonAlreadyExists) throw new Error("Pool singleton already exists")
        else Pool.singletonAlreadyExists = true
    }
    /**@param {number} id @param {Loca} loca  */
    getPlayer(id, loca, team) {
        let p = this.players.get(id)
        if (p) return p
        if (!loca) throw new Error("pool can't spawn new player: no loca given")
        p = new Player("player", "player_" + id, id, team)
        this.players.set(id, p)
        loca.spawnPlayer(p)
        return p
    }
    /**
     * @param {number} id 
     * @param {string} type 
     * @param {Loca} loca 
     * @param {Rect} rect
     */
    getTerminal(id, type, loca, rect) {
        let t = this.terminals.get(id)
        if (t) return t
        if (!loca) throw new Error("pool can't spawn new terminal: no loca given")
        if (!rect) throw new Error("pool can't spawn new terminal: no ijArr given")
        t = new Terminal(type, id)
        loca.spawnTerminal(t, rect)
        return t
    }
    getLoca(id) {
        if (this.locas.has(id)) return this.locas.get(id)
        const preset = Loca.PRESETS[id]
        if (preset == null) throw new Error(`Loca.PRESETS has no ${id}`)
        const retrievedLoca = new Loca(preset.fromfile, preset.name, id)
        this.locas.set(id, retrievedLoca)
        preset.assignData && Object.assign(retrievedLoca, preset.assignData)
        return retrievedLoca
    }


    reset() {
        this.locas.clear()
        this.players.clear()
    }
}
const pool = new Pool()
//#endregion
