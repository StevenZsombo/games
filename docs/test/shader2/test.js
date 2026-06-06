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
        const other = this.other = new GameCanvas(this.rect.copy)
        const b = Button.fromRect(this.rect.copy
            // .stretch(.8, .8)
            , { color: "pink" })
        Cropper.loadImagePromise("cats.png").then(x => b.img = x)
        other.add_drawable(b)
        // Button.make_draggable(b)
        this.add_drawable(other)
        const shaderOutputButton = Button.fromRect(this.rect.copy
            // .stretch(.9, .9)
            , { color: "blue" })
        Button.make_stretchable(shaderOutputButton)
        this.add_drawable(shaderOutputButton, 8)
        // shaderOutputButton.imgScale = 1
        shaderOutputButton.update = () => {
            if (!this.shader) return
            const { off, w, h, fx, out, gl, vs, fs, prog, buf, pLoc, tex, ctxOut, redraw } = this.shader
            ctxOut.fillStyle = "lightgreen"
            ctxOut.fillRect(0, 0, w, h)
            // ctxOut.clearRect(0, 0, w, h)
            redraw(this.dtTotal / 2)

            shaderOutputButton.img = fx
        }




        const off = other.canvas
        const w = off.width, h = off.height;

        const fx = document.createElement('canvas');
        fx.width = w;
        fx.height = h;
        // document.body.appendChild(fx);

        const out = document.createElement('canvas');
        out.width = w;
        out.height = h;
        // document.body.appendChild(out);

        const gl = fx.getContext('webgl', { preserveDrawingBuffer: true });

        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, 'attribute vec2 p;varying vec2 frac;void main(){gl_Position=vec4(p,0,1);frac=(p+1.0)/2.0;}');
        gl.compileShader(vs);

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, await (await fetch("s.frag")).text());
        gl.compileShader(fs);

        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const pLoc = gl.getAttribLocation(prog, 'p');
        gl.enableVertexAttribArray(pLoc);
        gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);

        gl.uniform1i(gl.getUniformLocation(prog, 'texture'), 0);
        gl.uniform2f(gl.getUniformLocation(prog, 'size'), w, h);
        const uTime = gl.getUniformLocation(prog, 'time')
        const uPos = gl.getUniformLocation(prog, 'pos')

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        const ctxOut = out.getContext('2d');
        ctxOut.drawImage(fx, 0, 0);


        const redraw = (time) => {
            gl.uniform1f(uTime, time)
            gl.uniform2f(uPos,
                this.mouser.pos.x, this.HEIGHT - this.mouser.pos.y
            )
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off); //can just use myCanvas instead for full-screen effect!
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            ctxOut.drawImage(fx, 0, 0);
        }



        this.shader = { off, w, h, fx, out, gl, vs, fs, prog, buf, pLoc, tex, ctxOut, redraw, uTime, uPos }






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
