#version 430

out VertexOutputs {
    vec2 atlas_uv;
    vec4 color;
} outputs;

void iris_emitVertex(inout VertexData data) {
    data.clipPos = iris_projectionMatrix * iris_modelViewMatrix * data.modelPos;
}

void iris_sendParameters(VertexData data) {
    outputs.atlas_uv = data.uv;
    outputs.color    = data.color;
}
