precision mediump float;
varying vec2 textureCoord;
uniform sampler2D screenTexture;
uniform float elapsedSeconds;
uniform float canvasWidth;

void main() {
    float waveOffset = sin(elapsedSeconds * 6.2831 + textureCoord.x * canvasWidth / 200.0) * 20.0 / canvasWidth;
    vec2 displacedCoord = vec2(textureCoord.x, 1.0 - textureCoord.y) + vec2(0, waveOffset);
    gl_FragColor = texture2D(screenTexture, displacedCoord);
}