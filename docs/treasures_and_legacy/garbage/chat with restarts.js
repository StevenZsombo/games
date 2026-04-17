//really awkward... best not use any of it
/**@deprecated */
startContest() {
    univ.on_next_game_once = () => {
        this.isActive = true
        GameEffects.popup("Contest has started, good luck!")
        this.on_start?.()
    }
    main()
}
/**@deprecated */
endContest() {
    this.isActive = false
    GameEffects.popup("Contest has ended. Stand by for the results.", GameEffects.popupPRESETS.redLinger)
    this.on_end?.()
}
/**@deprecated */
pauseContest() {
    this.isActive = false
    GameEffects.popup("Contest was paused, please stand by.")
    this.on_pause?.()
    game.isAcceptingInputs = this.doesPauseBlockInputs
}
/**@deprecated */
unpauseContest() {
    this.isActive = true
    GameEffects.popup("Contest was unpaused, you may continue.")
    this.on_unpause?.()
    game.isAcceptingInputs = true
}
/**@deprecated */
startAfter(seconds) {
    GameEffects.countdown("Contest will start in:", seconds, this.startContest.bind(this))
}
/**@deprecated */
endAfter(seconds) {
    GameEffects.countdown("Contest will end in:", seconds, this.endContest.bind(this))
}
