class Anticheat {
    static create() {
        let active = false;
        let punished = false;
        let remainingSec = 0;
        let interval = null;
        let pendingCheck = false;

        // callbacks
        let onPunish = () => { };
        let onNewPunish = () => { };
        let onEndPunish = () => { };
        let onTick = () => { };

        let punishmentSec = 30;

        const save = () => {
            if (punished && remainingSec > 0)
                localStorage.setItem("ac_state", JSON.stringify({ remainingSec }));
            else
                localStorage.removeItem("ac_state");
        };

        const load = () => {
            const data = JSON.parse(localStorage.getItem("ac_state") || "{}");
            if (data.remainingSec > 0) {
                punished = true;
                remainingSec = data.remainingSec;
                onPunish();
                onNewPunish();
            }
        };

        const startPunishment = () => {
            if (!active) return;
            const wasPunished = punished;
            punished = true;
            remainingSec = punishmentSec;
            save();
            onPunish();
            if (!wasPunished) onNewPunish();
        };

        const endPunishment = () => {
            if (!punished) return;
            punished = false;
            remainingSec = 0;
            save();
            onEndPunish();
        };

        const tick = () => {
            if (!active || !punished) return;
            if (document.hasFocus() && document.visibilityState === "visible") {
                remainingSec = Math.max(0, remainingSec - 1);
                save();
                if (remainingSec === 0) endPunishment();
                else onTick();
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

        return {
            // callbacks
            set onPunish(fn) { onPunish = fn; },
            set onNewPunish(fn) { onNewPunish = fn; },
            set onEndPunish(fn) { onEndPunish = fn; },
            set onTick(fn) { onTick = fn; },

            // properties
            get isPunished() { return punished; },
            get timeLeft() { return punished ? remainingSec : 0; },
            get punishmentTime() { return punishmentSec; },
            set punishmentTime(sec) { punishmentSec = sec; },

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
            clearPunishment() { endPunishment(); }
        };
    }
}