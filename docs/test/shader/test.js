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
    update_more(dt) { }
    next_loop_more() { }






    async initialize_more() {
        // 1. Offscreen canvas for 2D
        this.off = new GameCanvas(this.rect.copy)
        const bg = Button.fromRect(this.rect.copy.stretch(.8, .8), { color: "darkred" })
        this.off.add_drawable(bg)
        bg.img = await Cropper.loadImagePromise("cats.png")

        // 2. WebGL canvas
        const fxCanvas = document.createElement("canvas")
        fxCanvas.width = this.WIDTH
        fxCanvas.height = this.HEIGHT
        const gl = fxCanvas.getContext("webgl")

        // Shaders
        const vertexShader = gl.createShader(gl.VERTEX_SHADER)
        gl.shaderSource(vertexShader, "attribute vec2 cornerPosition;varying vec2 textureCoord;void main(){gl_Position=vec4(cornerPosition,0,1);textureCoord=(cornerPosition+1.)/2.;}")
        gl.compileShader(vertexShader)

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
        gl.shaderSource(fragmentShader, await (await fetch("shader.frag")).text())
        gl.compileShader(fragmentShader)

        const shaderProgram = gl.createProgram()
        gl.attachShader(shaderProgram, vertexShader)
        gl.attachShader(shaderProgram, fragmentShader)
        gl.linkProgram(shaderProgram)
        gl.useProgram(shaderProgram)

        // Fullscreen quad
        const quadBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
        const cornerAttrib = gl.getAttribLocation(shaderProgram, "cornerPosition")
        gl.enableVertexAttribArray(cornerAttrib)
        gl.vertexAttribPointer(cornerAttrib, 2, gl.FLOAT, false, 0, 0)

        // Texture
        const screenTexture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, screenTexture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        this.shader = {
            gl,
            fxCanvas,
            screenTexture,
            elapsedUniform: gl.getUniformLocation(shaderProgram, "elapsedSeconds"),
            widthUniform: gl.getUniformLocation(shaderProgram, "canvasWidth")
        }

        // 3. Draw fxCanvas to main
        this.add_drawable({
            draw(ctx) {
                ctx.drawImage(fxCanvas, 0, 0)
            }
        })

        this.hasFinishedLoading = true
    }

    draw_more(ctx) {
        if (!this.hasFinishedLoading) return
        const s = this.shader
        this.off.draw(this.off.ctx)

        s.gl.bindTexture(s.gl.TEXTURE_2D, s.screenTexture)
        s.gl.texImage2D(s.gl.TEXTURE_2D, 0, s.gl.RGBA, s.gl.RGBA, s.gl.UNSIGNED_BYTE, this.off.canvas)
        s.gl.uniform1f(s.elapsedUniform, this.dtTotal / 1000)
        s.gl.uniform1f(s.widthUniform, this.WIDTH)
        s.gl.drawArrays(s.gl.TRIANGLE_STRIP, 0, 4)
    }











    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
