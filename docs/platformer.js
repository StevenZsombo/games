class Wall extends Rect {

}



class inputManager {
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
        if (!player.grounded) { return States.falling }
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
        if (!player.grounded) {
            player.coyote = player.coyoteMaxTime
            return States.falling
        }
        return this
    }
    repr = "moving"
}

class JumpingState extends State {
    enter() {
        this.player.vY = this.player.jumpInitialSpeed
    }
    input() {
        if (!this.inputManager.jumpHeld) { return States.falling }
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
        return this
    }

    update(dt) {
        const player = this.player
        player.coyote -= dt
        player.vX = this.inputManager.dir * player.airSpeed
        player.vY = Math.min(player.vY + player.fallGravity * dt, player.fallVelMax)
        player.attemptMove(dt)
        if (player.grounded) { return States.idling }
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
        this.currentState = States.idling
        this.previousState = this.currentState
        this.keyboarder = game.keyboarder
        this.inputManager = new inputManager(this)
        Object.values(States).forEach(x => {
            x.player = this
            x.inputManager = this.inputManager
        })
        /**@type {Keyboarder} */
        this.vX = 0
        this.vY = 0

        this.coyote = 0
        this.coyoteMaxTime = 100
        this.jumpBufferTime = 100 //TODO
        this.grounded = false
        this.jumpsAvailable = 1

        this.walkSpeed = .6
        this.airSpeed = .4
        this.jumpInitialSpeed = -2
        this.jumpGravity = .005
        this.fallGravity = .015
        this.fallVelMax = 2

    }
    draw(screen) {
        super.draw(screen, "blue")
    }

    checkCollision() {
        for (const wall of game.walls) {
            const info = wall.collideRectInfo(this)
            if (info?.anyIn) {
                return { wall: wall, ...info }
            }
        }
    }
    attemptMove(dt, checkX = true, allowUpWarping = true) {
        this.y += this.vY * dt
        {//checkY
            const hit = this.checkCollision()
            this.grounded = false //will be reset
            if (hit) {
                if (hit.topIn) this.topat(hit.wall.bottom)
                else if (allowUpWarping && hit.bottomIn) this.bottomat(hit.wall.top)
                this.vY = 0
                this.grounded = true
            }
        }
        this.x += this.vX * dt

        if (checkX) {
            const hit = this.checkCollision()
            if (hit) {
                if (hit.leftIn) this.leftat(hit.wall.right)
                else if (hit.rightIn) this.rightat(hit.wall.left)
            }
        }
    }

    setState(newState) {
        if (newState !== this.currentState) {
            this.previousState = this.currentState
            this.currentState = newState
            newState.enter()
        }
    }
    update(dt) {
        this.inputManager.update()
        const inputState = this.currentState.input()
        this.setState(inputState)
        const updateState = this.currentState.update(dt)
        this.setState(updateState)

    }


}
//#endregion