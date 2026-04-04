const http = require("http")
const Location = "http//192.168.1.200:8000/"

http.createServer((req, res) => {
    res.writeHead(302, {
        Location: Location
    })
    res.end()
}).listen(80, "0.0.0.0", () => {
    console.log(`REDIRECTING all to ${Location}`)
})
