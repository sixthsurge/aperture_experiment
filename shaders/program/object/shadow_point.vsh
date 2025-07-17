#version 430

out VertexOutput {
    vec2 atlas_uv;
    vec4 color;
    vec3 pos_model;
    flat bool is_full_block;
} outputs;

void iris_emitVertex(inout VertexData data) {
    data.clipPos = iris_projectionMatrix * iris_modelViewMatrix * data.modelPos;
}

void iris_sendParameters(VertexData data) {
    outputs.atlas_uv      = data.uv;
    outputs.color         = data.color;
    outputs.pos_model     = data.modelPos.xyz;

    ap_PointLight light = iris_getPointLight(iris_currentPointLight);
    outputs.is_full_block = iris_isFullBlock(light.block);
}
