/// settings
const stgs = {
    stage: "menu",

}/// end of settings



class MouseHelper extends Button {
    constructor() {
        super({ width: 50, height: 50, fontsize: 36 })
        this.update = (dt) => this.centeratV(game.mouser.pos)
    }
}