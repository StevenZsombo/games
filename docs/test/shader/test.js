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
        const off = this.off = new GameCanvas(this.rect.copy)
        const bg = Button.fromRect(this.rect.copy.stretch(.8, .8), {
            color: "darkred"
        })
        // Cropper.loadImagePromise("cats.png").then(x => bg.img = x)
        bg.img = await Cropper.loadImagePromise("cats.png")
        off.add_drawable(bg)
        // const fg = bg.copy
        // fg.color = "blue"
        // fg.img = off.canvas
        // this.add_drawable(fg)

        // WebGL setup
        const fxCanvas = document.createElement("canvas")
        fxCanvas.width = this.WIDTH
        fxCanvas.height = this.HEIGHT
        const gl = fxCanvas.getContext("webgl")
        const fxDrawable = {
            draw(ctx) {
                ctx.drawImage(fxCanvas, 0, 0)
            }
        }
        // this.add_drawable(off)
        this.add_drawable(fxDrawable)


        // Shaders
        this.shader = {}

        // Vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER)
        gl.shaderSource(vertexShader, "attribute vec2 cornerPosition; varying vec2 textureCoord; void main() { gl_Position = vec4(cornerPosition, 0, 1); textureCoord = (cornerPosition + 1.0) / 2.0; }")
        gl.compileShader(vertexShader)

        // Fragment shader (loaded from file)
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
        gl.shaderSource(fragmentShader, await (await fetch("shader.frag")).text())
        gl.compileShader(fragmentShader)

        // Link shaders into a program
        const shaderProgram = gl.createProgram()
        gl.attachShader(shaderProgram, vertexShader)
        gl.attachShader(shaderProgram, fragmentShader)
        gl.linkProgram(shaderProgram)
        gl.useProgram(shaderProgram)
        // const textureUniform = gl.getUniformLocation(shaderProgram, "screenTexture")
        // gl.uniform1i(textureUniform, 0)

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error("Vertex shader error:", gl.getShaderInfoLog(vertexShader))
        }
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error("Fragment shader error:", gl.getShaderInfoLog(fragmentShader))
        }
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(shaderProgram))
        }
        // Fullscreen quad geometry
        const quadBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
        const cornerAttrib = gl.getAttribLocation(shaderProgram, "cornerPosition")
        gl.enableVertexAttribArray(cornerAttrib)
        gl.vertexAttribPointer(cornerAttrib, 2, gl.FLOAT, false, 0, 0)

        // Texture that will hold the main canvas
        const screenTexture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, screenTexture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        this.shader.gl = gl
        this.shader.fxCanvas = fxCanvas
        this.shader.program = shaderProgram
        this.shader.screenTexture = screenTexture
        // this.shader.textureUniform = textureUniform
        this.shader.elapsedUniform = gl.getUniformLocation(shaderProgram, "elapsedSeconds")
        this.shader.widthUniform = gl.getUniformLocation(shaderProgram, "canvasWidth")







        //last line
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
        const s = this.shader
        this.off.draw()
        this.shader.gl.drawImage(this.off.canvas, 0, 0)


        // Copy the main canvas into the texture
        s.gl.bindTexture(s.gl.TEXTURE_2D, s.screenTexture)
        s.gl.texImage2D(s.gl.TEXTURE_2D, 0, s.gl.RGBA, s.gl.RGBA, s.gl.UNSIGNED_BYTE, this.shader.fxCanvas)

        // Pass time and canvas width to the shader
        s.gl.uniform1f(s.elapsedUniform, this.dtTotal / 1000)
        s.gl.uniform1f(s.widthUniform, this.WIDTH)

        // Run the shader, rendering to the offscreen fxCanvas
        s.gl.drawArrays(s.gl.TRIANGLE_STRIP, 0, 4)
    }
    //#endregion
    //#endregion




    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
