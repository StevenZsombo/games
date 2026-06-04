//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: true,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "auto",
    //BROKEN
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    //BROKEN
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_first_run_blocking: null,
    on_first_run_async: null, //async function. overrides on_first_run_blocking
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: true,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}
//#endregion


class Game extends GameCore {
    //#region nogood
    async initialize_more() {
        const bg = Button.fromRect(this.rect.copy.stretch(.8, .8), {
            color: "darkred"
        })
        bg.img = await Cropper.loadImagePromise("cats.png")
        this.add_drawable(bg)






    }
    update_more(dt) {
    }
    /**@param {CanvasRenderingContext2D} ctx */
    draw_more(ctx) {
        const dt = this.dt
        const imgData = ctx.getImageData(0, 0, this.WIDTH, this.HEIGHT)
        const data = imgData.data
        const dataCopy = [...data]
        const w = imgData.width
        const rowSin = Array.from({ length: w }, (_, i) => Math.round(20 * Math.sin(this.dtTotal / 1000 * TWOPI + i / 100)))
        let ind = 0
        for (let j = 0; j < imgData.height; j++) {
            for (let i = 0; i < imgData.width; i++) {
                if (rowSin[i]) {
                    data[ind] = dataCopy[ind + rowSin[i] * 4 * w]
                    data[ind + 1] = dataCopy[ind + 1 + rowSin[i] * 4 * w]
                    data[ind + 2] = dataCopy[ind + 2 + rowSin[i] * 4 * w]
                }
                ind += 4
            }
        }
        ctx.putImageData(imgData, 0, 0)
    }
    next_loop_more() {
    }
    //#endregion

    //#region @overrides

    //#region initialize_more
    async initialize_more() {
        const bg = Button.fromRect(this.rect.copy.stretch(.8, .8), {
            color: "darkred"
        })
        // Cropper.loadImagePromise("cats.png").then(x => bg.img = x)
        bg.img = await Cropper.loadImagePromise("cats.png")
        this.add_drawable(bg)

        // WebGL setup
        const fxCanvas = document.createElement("canvas")
        fxCanvas.width = this.WIDTH
        fxCanvas.height = this.HEIGHT
        const gl = fxCanvas.getContext("webgl")

        // Shaders
        const vs = gl.createShader(gl.VERTEX_SHADER)
        gl.shaderSource(vs, "attribute vec2 p;varying vec2 t;void main(){gl_Position=vec4(p,0,1);t=(p+1.)/2.;}")
        gl.compileShader(vs)

        const fs = gl.createShader(gl.FRAGMENT_SHADER)
        gl.shaderSource(fs, await (await fetch("shader.frag")).text())
        gl.compileShader(fs)

        const prog = gl.createProgram()
        gl.attachShader(prog, vs)
        gl.attachShader(prog, fs)
        gl.linkProgram(prog)
        gl.useProgram(prog)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
        const a = gl.getAttribLocation(prog, "p")
        gl.enableVertexAttribArray(a)
        gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)

        const tex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        this.uTime = gl.getUniformLocation(prog, "u_time")
        this.uWidth = gl.getUniformLocation(prog, "u_width")
        this.gl = gl
        this.fxCanvas = fxCanvas
        this.fxTexture = tex
        this.fxCanvasCtx = fxCanvas.getContext("2d") // not used, just for drawImage

        // Add the fxCanvas as a drawable overlay
        this.fxOverlay = {
            draw(ctx) {
                ctx.drawImage(fxCanvas, 0, 0)
            }
        }
        this.add_drawable(this.fxOverlay)

        this.hasFinishedLoading = true
    }
    //#endregion

    //#region update_more
    update_more(dt) {
        // Your update logic
    }
    //#endregion

    //#region draw_more
    /**@param {CanvasRenderingContext2D} ctx */
    draw_more(ctx) {
        if (!this.hasFinishedLoading) return
        const gl = this.gl

        // Upload the current main canvas to the texture
        gl.bindTexture(gl.TEXTURE_2D, this.fxTexture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas)

        // Set uniforms
        gl.uniform1f(this.uTime, this.dtTotal / 1000)
        gl.uniform1f(this.uWidth, this.WIDTH)

        // Draw the effect onto the fxCanvas
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    //#endregion
    //#endregion




    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
