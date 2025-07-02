#version 430 

noperspective out vec2 uv;

void main() {
    // From Arc II by Null
    vec2 position = vec2(gl_VertexID % 2, gl_VertexID / 2) * 4.0 - 1.0;

    uv = (position + 1.0) * 0.5;

    gl_Position = vec4(position, 0.0, 1.0);
}
