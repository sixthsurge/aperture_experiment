#version 430

out VertexOutput {
    vec2 atlas_uv;
    vec4 color;
    vec3 pos_model;
    flat bool is_full_block;
} v_out;

void iris_emitVertex(inout VertexData data) {
    data.clipPos = iris_projectionMatrix * iris_modelViewMatrix * data.modelPos;
}

void iris_sendParameters(VertexData data) {
    v_out.atlas_uv      = data.uv;
    v_out.color         = data.color;
    v_out.pos_model     = data.modelPos.xyz;

    ap_PointLight light = iris_getPointLight(iris_currentPointLight);
    v_out.is_full_block = iris_isFullBlock(light.block);
}
