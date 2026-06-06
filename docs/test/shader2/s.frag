precision mediump float;
varying vec2 frac;
uniform sampler2D texture; //texture
uniform vec2 size; //size
uniform float time;
uniform vec2 pos;
void main(){
    vec2 coord = gl_FragCoord.xy;
    float d = distance(coord,pos);
    // gl_FragColor = vec4(d/300.0,0.0,0.0,1.0);
    vec4 color = texture2D(texture, frac);
    if (d>300.0){color = vec4(0,0,0,0);}
    gl_FragColor = color;

    /*
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
    */
}