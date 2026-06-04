precision mediump float;
varying vec2 coords;
uniform sampler2D texture; //texture
uniform vec2 size; //size
uniform float time;
void main(){
    float dy = sin(time*0.005 + coords.x * 20.0)*0.05;
    gl_FragColor=texture2D(texture,vec2(coords.x, coords.y + dy));
}