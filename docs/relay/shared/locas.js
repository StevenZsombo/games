//#region Grid, Cell
class Cell {
    constructor(i, j, eventState, effectState) {
        this.i = i; this.j = j;
        this.eventState = eventState ?? -1 //for none state
        //@TODO implement effectState
    }
}
class Grid extends Map {
    /**@returns {Cell}*/put(i, j, item) { return this.set(`${i},${j}`, item) }
    /**@returns {Cell}*/at(i, j) { return this.get(`${i},${j}`) }
    /**@returns {Boolean}*/valid(i, j) { return this.has(`${i},${j}`) }
}
//#endregion


//#region Loca
class Loca extends GameWorld {
    static readGalaxyFromJSON() {
        const replacer = (name, assignData) => {
            const repstart = name.indexOf("#"); if (repstart === -1) return name;
            const repend = (name.indexOf(" ", repstart) + 1) || (name.length + 1)
            const extracted = +name.slice(repstart + 1, repend - 1)
            // assignData.isExlusiveToTeamID = extracted
            return name.slice(0, repstart) + Team.defaultNames[extracted] + name.slice(repend - 1)
        }
        const txt = MM.fetchSyncText("../tiled/galaxy.json")
        const map = JSON.parse(txt)
        const presets = []
        map.layers[0].objects.forEach(r => {
            const { x, y, width, height } = r
            const info = r.name
            const [rawname, fromfile, assignData = {}] = info.split(",")
            const name = replacer(rawname, assignData)
            const obj = { x, y, width, height, name, fromfile, assignData }
            if (r.properties?.[0]?.name === "homeOf") obj["homeOf"] = r.properties[0].value
            presets.push(obj)

        })
        return presets
    }
    static PRESETS = [
        { name: "base1", fromfile: "home1", },
        { name: "base2", fromfile: "home1" },
        { name: "base3", fromfile: "home1" },
        { name: "base4", fromfile: "home1" },
        { name: "base5", fromfile: "home1" },
        { name: "base6", fromfile: "home1" },
        { name: "factory1", fromfile: "factory1" }
    ]
    static homebases = []



    tag = "Loca"
    isBlocking = true
    isVisibleGlobally = true
    isExlusiveToTeamID = null
    constructor(fromfile, name, id) {
        super(globalThis.game.rect.copy)
        this.id = id
        this.name = name//doubles as name for now
        this.loadFromFile(fromfile)

        const bg = this.bg = new Button({ transparent: true, x: 0, y: 0 })
        const src = RULES.MAP_BACKGROUND_FOLDER + fromfile + ".png"
        this.bgReadyPromise = Cropper.loadImageToNewCanvasPromise(src).then(newCanvas => {
            bg.width = newCanvas.width
            bg.height = newCanvas.height
            bg.img = newCanvas
            bg.check = null
            bg.draw = (screen) => {
                if (GRAPHICS.SMOOTHING_DISABLED_FOR_BG) {
                    screen.imageSmoothingEnabled = false
                    screen.drawImage(bg.img, 0, 0)
                    screen.imageSmoothingEnabled = true
                } else {
                    screen.drawImage(bg.img, 0, 0)
                }
            }
            this.add_drawable(bg, 1)
        })

    }
    loadFromFile(fromfile) {
        // const MAP = await(await fetch(RULES.MAP_FOLDER + fromfile + ".png")).json()
        const textfilecontents = MM.fetchSyncText(RULES.MAP_FOLDER + fromfile + ".json")

        const MAP = JSON.parse(textfilecontents)
        /**@type {Grid} */
        const grid = this.grid = new Grid()
        const floors = MAP.layers.find(x => x.name === "floors")
        const floors_grid = MM.reshape(floors.data, floors.width)
        for (let i = 0; i < floors.width; i++) {
            for (let j = 0; j < floors.height; j++) {
                if (floors_grid[j][i]) {
                    grid.put(i, j, new Cell(i, j))
                }
            }
        }
        const eventInteractables = this.eventInteractables = new Panel()
        eventInteractables.isBlocking = true
        this.add_drawable(eventInteractables, 6)//just below the player(s)
        const eventStateManager = this.eventStateManager = new StateManager()
        eventStateManager.create(-1) //on_leave is now added to each state instead of general on_enter
        // .on_enter = () => { this.eventInteractables.components.length = 0 }
        this.trans = (i, j) => this.eventStateManager.trans(this.grid.at(i, j).eventState)
        this.controllableMoveToNewLocation = (i, j) => {
            this.trans(i, j)
        }
        const rects = MAP.layers.find(x => x.name === "rects").objects
        rects.forEach(objectData => {
            const but = new Button()
            but.x = objectData.x
            but.y = objectData.y
            but.width = objectData.width
            but.height = objectData.height
            // objectData.rotation && (but.rad = objectData.rotation * ONEDEG)
            pool.getTerminal(this.id * 100 + objectData.id, objectData.name, this,
                but)  //spawns in automatically!
        })

    }


    getIJ(pos) {
        const { x, y } = pos
        return [x, y].map(k => Math.floor(k / GRAPHICS.SIZE))
    }
    getIJscreen(pos) {
        const { x, y } = this.screenToWorldV(pos)
        return [x, y].map(k => Math.floor(k / GRAPHICS.SIZE))
    }
    zoom(worldX, worldY, zoomLevel) {
        this.worldRect.resizeFixed(this.bg.width / zoomLevel, this.bg.height / zoomLevel, worldX, worldY)
    }


    /**@type {Player[]}*/
    players = []
    /**@param {Player} player  */
    spawnPlayer(player) {
        if (!(player instanceof Player)) throw new Error("loca.spawnPlayer did not get a player")
        player.loca = this

        //need more clever spawning....
        const randIJ = MM.choice(Array.from(this.grid.keys())).split(",").map(Number)
        player.setIJ(...randIJ)

        this.players.push(player)
        this.add_drawable(player, 7)
        return player
    }
    /**@param {Player} player  */
    removePlayer(player) {
        const ind = this.players.indexOf(player)
        this.remove_drawable(player)
        if (ind !== -1) this.players.splice(ind, 1)
    }
    /**@type {Terminal[]} */
    terminals = []
    /**@param {Terminal} terminal @param {Rect} rect */
    spawnTerminal(terminal, rect) {
        if (!(terminal instanceof Terminal)) throw new Error("loca.spawnTerminal did not get a terminal")
        if (!(rect instanceof Rect)) throw new Error("loca.spawnTerminal did not get fromRect")
        this.terminals.push(terminal)
        if (!this.eventStateManager.has(terminal.id)) {
            const ev = this.eventStateManager.create(terminal.id)
            const rectIJData = Terminal.getRectIJData(rect)
            rectIJData.ijArr.forEach(([i, j]) => {
                if (!this.grid.valid(i, j)) throw new Error(`map rect ${rect} lies outside the floor at (${i},${j})`)
                this.grid.at(i, j).eventState = terminal.id
            })
            /**@type {Button & {terminal:Terminal}} creating terminal button*/
            const b = (rect instanceof Button) ? Button.fromButton(rect.copy) : Button.fromRect(rect.copy)
            terminal.button = b
            b.terminal = terminal
            b.visible = false
            b.isBlocking = false
            b.on_enter = () => {
                if (terminal.button.isBlocking) return
                terminal.button.opacity = 0.2; terminal.button.visible = true;
                terminal.putInspectFromAfarText()
            }
            b.on_leave = () => {
                if (terminal.button.isBlocking) return
                terminal.button.opacity = 0; terminal.button.visible = false
            }
            b.on_click = () => {
                terminal.tryAction()
            }
            ev.on_enter = () => terminal.onStandingOnEnter()
            ev.on_leave = () => terminal.onStandingOnLeave()
            this.eventInteractables.push(b)

            /**@type {Button & {terminal:Terminal}} creating terminal button*/
            const l = Button.fromRectShallow(b.copyRect)
            l.transparent = true
            l.terminal = terminal
            terminal.label = l
            l.check = null
            l.dynamicText = () => l.terminal.txt
            l.fontSize = GRAPHICS.TERMINAL_FONTSIZE
            b.draw_more = l.draw.bind(l) //lazy-like lol
            if (rectIJData.isVertical) {
                const { i, j } = rectIJData.topleft
                l.rad = this.grid.valid(i - 1, j) ? NINETYDEG : -NINETYDEG
                l.width = b.height
                l.height = b.width
                l.centerinRect(b)
                //im so clever lol
            }

        }
        this.add_drawable(terminal, 4) //sub-layer. will probably add opaque effects
        return terminal
    }


    eventCount = 0
    static EVENTS = {
        break: /**@param {Terminal} terminal */
            terminal => { },
        repair:/**@param {Terminal} terminal */
            terminal => { },
        capture:/**@param {Terminal} terminal @param {Team} team */
            (terminal, team) => { },
        lose: (terminal, team) => { },
    }
    /**@param {function | string} whichone  */
    eventHappened(whichone) {
        this.eventCount++
        typeof whichone === 'string' ? Loca.EVENTS[whichone]() : whichone()
    }




}
//#endregion


//// REMOVE LATER !!!!
Loca.PRESETS = Loca.readGalaxyFromJSON()

