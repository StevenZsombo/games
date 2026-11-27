///@ts-nocheck
class Temp {
    //#region spam eggs
    _uniqueIDSpam = 0
    get nextUniqueIDSpam() {
        return ++this._uniqueIDSpam
    }
    static defaultSpamRetries = 5
    static defaultSpamInterval = 500
    /**@type {Map<string,{on_success:Function,cleanup:Function}}*/
    pendingSpams = new Map()
    /**
     * @param {string} value
     * @param {Object} params
     * @param {Object} [options]
     * @param {number} [options.retries=3]
     * @param {number} [options.interval=500]
     * @param {?function(retries:number):any} [options.on_retry=null] - receives number of remaning retries
     * @returns {void}
     */
    spam(value, params, {
        retries = Chat.defaultSpamRetries, interval = Chat.defaultSpamInterval, on_retry = null,
        msgMore = {}, on_success = null, on_fail = null
    } = {}) {
        const uniqueID = this.nextUniqueIDSpam
        const flag = `s${uniqueID}`
        const msg = { ...msgMore, spam: uniqueID, value }
        params && (msg.params = params)
        const send = () => this.isConnected ? this.sendMessage(msg) && cleanup() && on_success?.() : this.on_join_sendMany.set(flag, msg)
        const clock = setInterval(() => {
            if (--retries < 0) {
                cleanup()
                on_fail?.()
            } else {
                on_retry?.(retries)
                send()
            }
        }, interval)
        const cleanup = () => {
            clearInterval(clock)
            this.pendingSpams.delete(uniqueID)
            this.on_join_sendMany.delete(flag)
        }
        this.pendingSpams.set(uniqueID, { on_success, cleanup })

        send()
    }
    /**@type {Map<string, function(params: Object, person: Person|Participant): any>}*/
    on_spamFunctions = new Map()
    /**
     * @param {ChatMessage} message
     * @param {Person|Participant} person
     * @returns {void}
     */
    spamHandler(message, person) { //no return value - won't be sent back
        this.on_spamFunctions.get(message.value)?.(message.params, person)
    }
    /**
     * @param {string} spam
     * @param {function(params: Object, person: Person|Participant): any} fn
     * @returns {this}
    */
    eggs(spam, fn) {
        this.on_spamFunctions.set(spam, fn)
        return this
    }

    /**
     * @param {"client"|"server"} clientOrServer 
     */
    initEggs(clientOrServer) {//best wrap each item in a function instead of polluting Game
        const wooLibrary = globalThis.wooLibrary ?? getWooLibrary?.()
        if (!wooLibrary) throw new Error("no wooLibrary, no getWooLibrary")
        wooLibrary.defaultWeeInterval && (Chat.defaultWeeInterval = wooLibrary.defaultWeeInterval)
        wooLibrary.defaultWeeRetries && (Chat.defaultWeeRetries = wooLibrary.defaultWeeRetries)
        for (const [key, obj] of Object.entries(wooLibrary.spam ?? {})) {
            if (obj[clientOrServer]) this.eggs(key, obj[clientOrServer])
        }
        for (const [key, fn] of Object.entries(wooLibrary[clientOrServer]?.spam ?? {})) {
            this.eggs(key, fn)
        }
    }
    //#endregion



}

(() => {
    // === WebRTC chat (no libraries) — paste into DevTools console ===
    const cfg = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
    const name = "anon-" + Math.random().toString(36).slice(2, 6);
    let pc, channel;

    const enc = (s) => btoa(s);              // SDP is ASCII → single-line code
    const dec = (s) => atob(String(s).trim());
    const copy = (s) => {
        try { if (typeof globalThis.copy === "function") { globalThis.copy(s); return; } } catch { }
        try { navigator.clipboard.writeText(s); } catch { }
    };

    function waitIce(p) {
        return new Promise((resolve) => {
            if (p.iceGatheringState === "complete") return resolve();
            const on = () => {
                if (p.iceGatheringState === "complete") {
                    p.removeEventListener("icegatheringstatechange", on);
                    resolve();
                }
            };
            p.addEventListener("icegatheringstatechange", on);
            setTimeout(resolve, 8000);            // safety net if STUN is blocked
        });
    }

    function fresh() {
        if (pc) try { pc.close(); } catch { }
        const p = new RTCPeerConnection(cfg);
        p.onconnectionstatechange = () => console.log("[chat] state:", p.connectionState);
        pc = p;
        return p;
    }

    function attach(ch) {
        channel = ch;
        ch.onopen = () => {
            console.log("%c[chat] connected as " + name, "color:green;font-weight:bold");
            ch.send(JSON.stringify({ type: "hello", name }));
        };
        ch.onclose = () => console.log("%c[chat] disconnected", "color:red");
        ch.onmessage = (e) => {
            let m; try { m = JSON.parse(e.data); } catch { return; }
            if (m.type === "hello") console.log(`[chat] ${m.name} joined`);
            else if (m.type === "msg") {
                console.log(`${m.name}: ${m.text}`);
                if (typeof window.onMessage === "function") window.onMessage(m.name, m.text);
            }
        };
    }

    window.host = async () => {
        fresh();
        attach(pc.createDataChannel("chat"));
        await pc.setLocalDescription(await pc.createOffer());
        await waitIce(pc);
        const code = enc(pc.localDescription.sdp);
        copy(code);
        console.log("%cOFFER CODE (copied to clipboard):", "color:blue;font-weight:bold");
        console.log(code);
        return code;
    };

    window.join = async (offerCode) => {
        if (!offerCode) return console.warn('[chat] pass the host\'s offer: join("…")');
        fresh();
        pc.ondatachannel = (e) => attach(e.channel);
        await pc.setRemoteDescription({ type: "offer", sdp: dec(offerCode) });
        await pc.setLocalDescription(await pc.createAnswer());
        await waitIce(pc);
        const code = enc(pc.localDescription.sdp);
        copy(code);
        console.log("%cANSWER CODE (copied to clipboard):", "color:blue;font-weight:bold");
        console.log(code);
        return code;
    };

    window.accept = async (answerCode) => {
        if (!answerCode) return console.warn('[chat] pass the guest\'s answer: accept("…")');
        await pc.setRemoteDescription({ type: "answer", sdp: dec(answerCode) });
    };

    window.say = (text) => {
        if (!channel || channel.readyState !== "open") return console.warn("[chat] not connected");
        channel.send(JSON.stringify({ type: "msg", name, text }));
        console.log(`you: ${text}`);
    };

    window.leave = () => {
        try { channel?.close(); } catch { }
        try { pc?.close(); } catch { }
        channel = pc = null;
        console.log("[chat] left");
    };

    window.onMessage = () => { };   // optional hook — override from console

    console.log("%c[chat] ready. You are " + name, "color:green;font-weight:bold");
    console.log("Commands:  host()  |  join(offerCode)  |  accept(answerCode)  |  say(text)  |  leave()");
})();

