//Thank you DeepSeek.
//I use the AI to destroy the AI.
class Anticheat {
    static getAnticheat() {
        let active = false;
        let punished = false;
        let remainingSec = 0;
        let interval = null;
        let pendingCheck = false;
        let punishmentCount = 0;
        let immuneUntil = 0;
        let immuneTime = 0;
        let LOCALSTORAGE_KEY = "ac_state"

        // callbacks
        /**@type {?Function}*/let onPunish = null;
        /**@type {?Function}*/let onPunish_more = null;
        /**@type {?Function}*/let onNewPunish = null;
        /**@type {?Function}*/let onNewPunish_more = null;
        /**@type {?Function}*/let onEndPunish = null
        /**@type {?Function}*/let onEndPunish_more = null;
        /**@type {?Function}*/let onTick = null;
        /**@type {?Function}*/let onTick_more = null;

        let punishmentSec = 30;

        const save = () => {
            localStorage.setItem(LOCALSTORAGE_KEY,
                JSON.stringify({ remainingSec, punishmentCount, immuneUntil }));
        };

        const load = () => {
            const data = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) || "{}");
            punishmentCount = data.punishmentCount || 0;
            immuneUntil = data.immuneUntil || 0;
            if (data.remainingSec > 0) {
                punished = true;
                remainingSec = data.remainingSec;
                active = true
                startPunishment()
            }
        };

        const startPunishment = () => {
            if (!active) return;
            if (Date.now() < immuneUntil) return
            const wasPunished = punished;
            punished = true;
            remainingSec = punishmentSec;
            save();
            onPunish?.();
            onPunish_more?.()
            if (!wasPunished) { punishmentCount++; onNewPunish?.(); onNewPunish_more?.() }
        };

        const endPunishment = () => {
            if (!punished) return;
            punished = false;
            remainingSec = 0;
            save();
            onEndPunish?.();
            onEndPunish_more?.()
        };

        const absolve = () => {
            punishmentCount = Math.max(0, punishmentCount - 1);
            immuneTime && (immuneUntil = Date.now() + immuneTime);
            punished ? endPunishment() : save()
        }
        const whitelist = () => {
            immuneTime = SIXHOURS
            absolve()
        }

        const tick = () => {
            if (!active || !punished) return;
            if (document.hasFocus() && document.visibilityState === "visible") {
                remainingSec = Math.max(0, remainingSec - 1);
                save();
                if (remainingSec === 0) endPunishment();
                else { onTick?.(); onTick_more?.() }
            }
        };

        const scheduleCheck = () => {
            if (pendingCheck) return;
            pendingCheck = true;
            Promise.resolve().then(() => {
                pendingCheck = false;
                if (active && !document.hasFocus() && document.visibilityState === "visible")
                    startPunishment();
            });
        };

        const onBlur = () => scheduleCheck();
        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") startPunishment();
            else if (document.visibilityState === "visible") scheduleCheck();
        };

        const DEFAULTS = {
            overlay({ layer = 9, color = "rgba(255, 0, 0, 0.5)", alsoIsBlocking = false } = {}) {
                /**@type {Game|GameCore} game  */
                (game)
                const b = Button.fromRectShallow(game.rect)
                b.color = color
                b.outline = 0
                b.interactable = alsoIsBlocking
                b.isBlocking = alsoIsBlocking
                game.add_drawable(b, layer)
                onPunish = () => b.activate()
                onEndPunish = () => b.deactivate()
                b.activeState = punished
                return b
            },
            message({ color = "red", frac = 1,
                txt =
                "You are not allowed to use other apps while playing the game." +
                "\nDoing so will trigger this anticheat block." +
                "\n\nThis window will disappear in\n",
                txtAfter = "\nIf you were punished unfairly, talk to your teacher.",
                moreButtonSettings = {}
            } = {}) {
                /**@type {Game|GameCore} game  */
                (game)
                const b = Button.fromRectShallow(game.rect.copy.stretch(frac, frac))
                b.color = color
                b.outline = 0
                b.isBlocking = true
                b.fontSize = 60
                b.dynamicText = () => `${txt || ""}${remainingSec} seconds.\n${txtAfter || ""}`
                Object.assign(b, moreButtonSettings)
                game.add_drawable(b, 9)
                onPunish = () => { b.activate(); game.isAcceptingInputs = false }
                onEndPunish = () => { b.deactivate(); game.isAcceptingInputs = true }
                b.activeState = punished
                return b
            }
        }

        return {
            // callbacks
            set onPunish(fn) { onPunish = fn; },
            set onNewPunish(fn) { onNewPunish = fn; },
            set onEndPunish(fn) { onEndPunish = fn; },
            set onTick(fn) { onTick = fn; },
            set onPunish_more(fn) { onPunish_more = fn; },
            set onNewPunish_more(fn) { onNewPunish_more = fn; },
            set onEndPunish_more(fn) { onEndPunish_more = fn; },
            set onTick_more(fn) { onTick_more = fn; },

            // properties
            get punishmentCount() { return punishmentCount },
            set punishmentCount(count) { punishmentCount = count },
            get isPunished() { return punished; },
            get timeLeft() { return punished ? remainingSec : 0; },
            get timeTotal() { return punishmentSec; },
            set timeTotal(sec) { punishmentSec = sec; remainingSec = Math.min(remainingSec, sec) },

            // lifecycle
            activate() {
                if (active) return;
                load();
                active = true;
                window.addEventListener("blur", onBlur);
                document.addEventListener("visibilitychange", onVisibilityChange);
                interval = setInterval(tick, 1000);
                scheduleCheck();
            },
            deactivate() {
                if (!active) return;
                active = false;
                window.removeEventListener("blur", onBlur);
                document.removeEventListener("visibilitychange", onVisibilityChange);
                clearInterval(interval);
                interval = null;
                if (punished) endPunishment();
            },
            set immuneTime(milliseconds) { immuneTime = milliseconds },
            get immuneTime() { return immuneTime },
            absolve,
            whitelist,
            countdown(seconds = 10) {
                GameEffects.countdown("You will not be allowed to use other apps.\nAnticheat activates in", seconds,
                    () => this.activate())
            },
            LOCALSTORAGE_KEY,
            //DEFAULTS
            DEFAULTS
        };
    }
}