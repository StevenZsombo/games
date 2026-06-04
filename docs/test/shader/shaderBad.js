//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
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
    //#region initialize_more
    async initialize_more() {
        const fx = document.createElement("canvas")
        fx.width = this.canvas.width
        fx.height = this.canvas.height

        const gl = fx.getContext("webgl2")
        if (!gl) throw new Error("no webgl :( big sad")

        this.screenGL = {
            /**@param {RenderingContext} ctx  */
            draw(ctx) {
                ctx.drawImage(fx, 0, 0, fx.width, fx.height)
            }
        }

        this.add_drawable(this.screenGL)

        //shader stuff here
        const vs = gl.createShader(gl.VERTEX_SHADER)
        gl.shaderSource(vs, "attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}")
        gl.compileShader(vs)

        const fs = gl.createShader(gl.FRAGMENT_SHADER)
        gl.shaderSource(fs, "precision mediump float;void main(){gl_FragColor=vec4(1,0,0,1);}")
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

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)


    }
    //#endregion

    //#region update_more
    update_more(dt) {






    }
    //#endregion


    //#region draw_more
    draw_more(screen) {






    }
    //#endregion

    //#region next_loop_more
    next_loop_more() {




    }//#endregion



    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
