#version 430

out VertexOutput {
    vec2 atlas_uv;
    vec4 color;
} v_out;

void iris_emitVertex(inout VertexData data) {
    data.clipPos = iris_projectionMatrix * iris_modelViewMatrix * data.modelPos;
}

void iris_sendParameters(VertexData data) {
    v_out.atlas_uv = data.uv;
    v_out.color    = data.color;
}
