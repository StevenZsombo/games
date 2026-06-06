precision mediump float;
varying vec2 frac;
uniform sampler2D texture; //texture
uniform vec2 size; //size
uniform float time;
uniform vec2 pos;
void main(){
    // float dy = sin(time*0.005 + coords.x * 10.0)*0.02;
    // vec2 mouse = pos / size; 
    vec2 coord = gl_FragCoord.xy;
    float d = distance(coord,pos);
    if (d < 250.0) {
        coord += (pos - coord) / 3.0;
        coord.y += sin(time * 0.005 + frac.x * 50.0) * 3.5;
        gl_FragColor = texture2D(texture, coord/size);
    } else if (abs(d - 250.0) < 10.0) {
        vec4 color = texture2D(texture,frac);
        color.r = 1.0;
        gl_FragColor = color;
    } else {
        gl_FragColor = texture2D(texture, frac);
    }
}