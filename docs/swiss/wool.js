
//used by chat.initWoo("client") and chat.initWoo("server")
var getWooLibrary = () => {
    return {
        either: {
            eval: {
                client: (v) => { eval(v); return 0 }
            },
            time: {
                client: Date.now,
                server: Date.now,
            },
            bounce: {
                client: x => x,
                server: x => x,
            }
        },
        client: {
            receiveSwiss: v => receive(v)
        },
        server: {
            want: v =>
                Object.values(listener.participants).forEach(x => {
                    chat.targetWee(x, "eval", v).then(_ => console.log("success!")).catch(_ => console.error("fail"))
                })
            ,
            shareSwiss: (v) => {
                Object.values(listener.participants).forEach(x => {
                    chat.targetWee(x, "receiveSwiss", v).then(_ => console.log("success!")).catch(_ => console.error("fail"))
                })
            }
        },
        defaultWeeInterval: 800,
        defaultWeeRetries: 20,

    }
}