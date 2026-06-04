precision mediump float;
varying vec2 t;
uniform sampler2D u_tex;
uniform float u_time;
uniform float u_width;
    void main() {
        float wave = sin(u_time * 6.2831 + t.x * u_width / 200.0) * 20.0 / u_width;
        vec2 offset = vec2(0, wave);
        vec2 uv = vec2(t.x, 1.0 - t.y) + offset;
        gl_FragColor = texture2D(u_tex, uv);
}