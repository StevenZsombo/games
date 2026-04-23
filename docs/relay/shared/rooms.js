class Cell {
    constructor(i, j, state) {
        this.i = i
        this.j = j
        this.state = state ?? "none"
    }
}
class Grid extends Map {
    /**@returns {Cell}*/put(i, j, item) { return this.set(`${i},${j}`, item) }
    /**@returns {Cell}*/at(i, j) { return this.get(`${i},${j}`) }
    /**@returns {Boolean}*/valid(i, j) { return this.has(`${i},${j}`) }
}




class Loca extends GameWorld {
    constructor(fromRect, backgroundimgfile) {
        super(fromRect)
        /**@type {Grid} */
        const grid = this.grid = new Grid()
        const floors = MAP.layers.find(x => x.name === "floors")
        const floors_grid = MM.reshape(floors.data, floors.width)
        const events = MAP.layers.find(x => x.name === "events")
        const events_gridded = MM.reshape(events.data, events.width)
        console.log({ floors, gridded: floors_grid })
        for (let i = 0; i < floors.height; i++) {
            for (let j = 0; j < floors.width; j++) {
                if (floors_grid[i][j]) {
                    grid.put(i, j, new Cell(i, j))
                    if (events_gridded[i][j]) grid.at(i, j).state = "event"
                }

            }
        }
        const eventState = this.eventState = new StateManager()
        grid.values().forEach(x => {
            if (!eventState.has(x.state)) eventState.create(x.state)
        })

        const bg = this.bg = new Button({ transparent: true })
        const raw = new Image()
        raw.onload = () => {
            bg.width = raw.width
            bg.height = raw.height
            bg.img = cropper.resize(raw, raw.width, raw.height)
            this.add_drawable(bg, 0) //layer 0 for background map
        }
        raw.src = RULES.MAP_BACKGROUND_FOLDER + backgroundimgfile + ".png"
    }
}




class Player extends Button {
    /**
     * @param {string} imgfilename 
     * @param {number} i 
     * @param {number} j 
     * @param {Location} loca 
     */
    constructor(imgfilename, i, j, loca) {
        if (!(loca instanceof Loca)) throw new Error("invalid location for player spawn")
        if (!loca.grid.valid(i, j)) throw new Error("invalid i,j for player spawn!")
        super({
            width: GRAPHICS.SIZE, height: GRAPHICS.SIZE, transparent: true,
            x: i * GRAPHICS.SIZE, y: j * GRAPHICS.SIZE
        })
        const img = new Image()
        img.onload = () => this.img = img
        img.src = RULES.PICTURES_FOLDER + imgfilename + ".png"

        this.i = i
        this.j = j
        this.loca = loca
        this.canMove = true
        /**@type {[number,number] | null} */
        this.target = null

    }
    tryMoveTo(i, j) {
        const neighbours =
            [-1, 0, 1].flatMap(x => [-1, 0, 1].map(y => [this.i + x, this.j + y]))
                .filter(x => !(x[0] && x[1]))
        const closest = //current cell is always valid
            neighbours
                .filter(([u, w]) => this.loca.grid.valid(u, w))
                .sort(
                    ([a, b], [c, d]) =>
                        (a - i) ** 2 + (b - j) ** 2
                        - (i - c) ** 2 - (j - d) ** 2)
                .at(0)

        if (this.i === closest[0] && this.j === closest[1]) {
            this.target = null //keep?
            return
        } else this.waddleTo(...closest)
    }
    waddleTo(i, j) {
        //movement animation logic goes here.

    }
    update(dt) {
        if (!this.canMove) return
        if (!this.target) return
        if (this.target[0] === this.i && this.target[1] === this.j) {
            this.target = null; return;
        }
        this.tryMoveTo(...this.target)
    }
}
