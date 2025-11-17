class Wall extends Rect {
    color = "purple"

    draw(screen) {
        MM.fillRect(screen, this.x, this.y, this.width, this.height, { color: this.color })
    }
}


class inputManager {
    /**@param {Player} player  */
    constructor(player) {
        this.player = player
        this.keyboarder = player.keyboarder

        this.dir = 0
        this.jumpPressed = 0

    }
    update() {
        const keyboarder = this.keyboarder
        const left = keyboarder.held["a"]
        const right = keyboarder.held["d"]
        this.dir = (right ? 1 : 0) + (left ? -1 : 0)
        //this.jumpPressed = keyboarder.pressed[" "]
        if (keyboarder.pressed[" "]) {
            this.jumpLastPressed = Date.now()
            this.jumpPressed = true
        } else {
            this.jumpPressed = Date.now() - this.jumpLastPressed < this.player.jumpBufferTime

        }
        this.jumpHeld = keyboarder.held[" "]
    }
}

class StateManager {
    constructor(obj) {
        this.currentState = States.idling
        this.previousState = this.currentState
        this.obj = obj
    }
    setState(newState) {
        if (newState !== this.currentState) {
            this.previousState = this.currentState
            this.currentState = newState
            newState.enter()
        }
    }
    update(dt) {
        const updateState = this.currentState.update(dt)
        this.setState(updateState)

    }

}

class PlayerStateManager extends StateManager {
    /**@param {Player} player  */
    constructor(player) {
        super()
        this.obj = undefined
        this.inputManager = new inputManager(player)
        this.player = player
    }
    update(dt) {
        this.inputManager.update()
        const inputState = this.currentState.input()
        this.setState(inputState)
        const updateState = this.currentState.update(dt)
        this.setState(updateState)

    }
}

//#region State
class State {
    /**@type {Player} */
    player = null
    /**@type {inputManager} */
    inputManager = null
    /**@param {Keyboarder} keyboarder  */

    input() { }
    update(dt) { }
    enter() { }
}

class IdlingState extends State {
    enter() {
        this.player.vY = 0
        this.player.vX = 0
        this.player.jumpsAvailable = this.player.jumpsAvailableMax
    }
    input() {
        if (this.inputManager.jumpPressed) { return States.jumping }
        if (this.inputManager.dir) { return States.walking }
        return this
    }
    update(dt) {
        const player = this.player
        player.vY += player.fallGravity * dt / 2
        const hit = player.attemptMove(dt)
        player.vY += player.fallGravity * dt / 2
        if (!player.groundedWall) { return States.falling }
        return this
    }

    repr = "idling"
}

class WalkingState extends State {
    input() {
        if (this.inputManager.jumpPressed) { return States.jumping }
        if (!this.inputManager.dir) { return States.idling }
        return this
    }
    update(dt) {
        const player = this.player
        player.vX = this.inputManager.dir * player.airSpeed
        player.vY += player.fallGravity * dt / 2
        player.attemptMove(dt)
        player.vY += player.fallGravity * dt / 2
        if (!player.groundedWall) {
            player.coyote = player.coyoteMaxTime
            return States.falling
        }
        for (const box of game.boxes) {
            if (player.colliderect(box)) box.getPushedBy(player)
        } //before attempmove

        return this
    }
    repr = "moving"
}

class JumpingState extends State {
    enter() {
        this.player.vY = this.player.jumpInitialSpeed
        this.player.jumpsAvailable -= 1
    }
    input() {
        if (!this.inputManager.jumpHeld) { return States.falling }
        if (this.inputManager.jumpPressed && this.player.jumpsAvailable > 0) { return States.jumping }
        return this
    }
    update(dt) {
        const player = this.player
        player.vY += player.jumpGravity * dt / 2
        player.vX = this.inputManager.dir * player.airSpeed
        player.attemptMove(dt)
        player.vY += player.jumpGravity * dt / 2
        if (player.vY >= 0) { return States.falling }

        return this
    }
    repr = "jumping"
}

class FallingState extends State {

    input() {
        const player = this.player
        if (this.inputManager.jumpPressed && player.coyote > 0) { return States.jumping }
        if (this.inputManager.jumpPressed && player.jumpsAvailable > 0) { return States.jumping }
        return this
    }

    update(dt) {
        const player = this.player
        player.coyote -= dt
        player.vX = this.inputManager.dir * player.airSpeed
        player.vY = Math.min(player.vY + player.fallGravity * dt, player.fallVelMax)
        player.attemptMove(dt)
        if (player.groundedWall) { return States.idling }
        return this
    }
    repr = "falling"
}

const States = {
    idling: new IdlingState(),
    walking: new WalkingState(),
    jumping: new JumpingState(),
    falling: new FallingState()
}

//#endregion

//#region Player
class Player extends Rect {
    constructor(x, y, width, height) {
        super(x, y, width, height)
        //this.currentState = States.idling
        //this.previousState = this.currentState
        this.keyboarder = game.keyboarder
        this.stateManager = new PlayerStateManager(this)
        Object.values(States).forEach(x => {
            x.player = this
            x.inputManager = this.stateManager.inputManager
        })
        /**@type {Keyboarder} */
        this.vX = 0
        this.vY = 0

        this.coyote = 0
        this.coyoteMaxTime = 100
        this.jumpBufferTime = 100 //TODO
        this.groundedWall = null
        this.jumpsAvailableMax = 2
        this.jumpsAvailable = this.jumpsAvailableMax


        this.walkSpeed = .8
        this.airSpeed = .6
        this.jumpInitialSpeed = -1.5
        this.jumpGravity = .0035
        this.fallGravity = .01
        this.fallVelMax = 2

    }
    draw(screen) {
        super.draw(screen, "blue")
    }

    checkCollision(againstWhatArr) {
        for (const wall of againstWhatArr) {
            if (this.colliderect(wall)) {
                return { wall: wall, ...this.collideRectInfo(wall) }
            }
        }
    }

    attemptMove(dt, checkX = true, allowUpWarping = true) {
        this.y += this.vY * dt
        {//checkY
            const hit = this.checkCollision(game.walls.concat(game.boxes))
            this.groundedWall = null //will be reset
            if (hit) {
                if (hit.topIn) this.topat(hit.wall.bottom)
                else if (allowUpWarping && hit.bottomIn) {
                    this.bottomat(hit.wall.top)
                    this.groundedWall = hit.wall
                }
                this.vY = 0

            }
        }
        this.x += this.vX * dt
        if (checkX) {
            const hit = this.checkCollision(game.walls)
            if (hit) {
                if (hit.leftIn) this.leftat(hit.wall.right)
                else if (hit.rightIn) this.rightat(hit.wall.left)
            }
        }


    }

    /*setState(newState) {
        if (newState !== this.currentState) {
            this.previousState = this.currentState
            this.currentState = newState
            newState.enter()
        }
    }*/
    update(dt) {
        /* this.inputManager.update()
         const inputState = this.currentState.input()
         this.setState(inputState)
         const updateState = this.currentState.update(dt)
         this.setState(updateState)*/
        this.stateManager.update(dt)

    }

    /*
    getPushedBy(byWhat) {
        const { leftIn, rightIn, bottomIn, topIn } = this.collideRectInfo(byWhat)
        if (leftIn) { this.leftat(byWhat.right) }
        else if (rightIn) { this.rightat(byWhat.left) }
        [game.player, ...game.boxes.filter(x => x !== this)].forEach(x => {
            if (this.colliderect(x)) x.getPushedBy(this)
        })
        game.walls.forEach(w => {
            if (this.colliderect(w)) this.getPushedBy(w)
        })



    }*/


}
//#endregion

class BoxIdlingState extends State {

}
//#region Box
class Box extends Rect {
    color = "red"
    draw(screen) {
        MM.fillRect(screen, this.x, this.y, this.width, this.height, { color: this.color })
        MM.drawRect(screen, this.x, this.y, this.width, this.height, { color: "black" })
    }

    /**@param {Rect} byWhat  */
    getPushedBy(byWhat) {
        const { leftIn, rightIn, bottomIn, topIn } = this.collideRectInfo(byWhat)
        if (leftIn) { this.leftat(byWhat.right) }
        else if (rightIn) { this.rightat(byWhat.left) }
        [game.player, ...game.boxes.filter(x => x !== this)].forEach(x => {
            if (this.colliderect(x)) this.getPushedBy.call(x, this)
        })
        game.walls.forEach(w => {
            if (this.colliderect(w)) this.getPushedBy(w)
        })



    }
}


//#endregion



