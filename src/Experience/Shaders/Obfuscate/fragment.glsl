precision highp float;
uniform sampler2D u_texture;
uniform float u_mask;
varying vec2 v_uv;

void main() {
    float data = texture2D(u_texture, v_uv).r;
    int intData = int(floor(data * 255.0));
    int mask = int(u_mask * 255.0);
    int xorResult = intData ^ mask;
    float result = float(xorResult) / 255.0;

    gl_FragColor = vec4(result, 0.0, 0.0, 1.0);
}
