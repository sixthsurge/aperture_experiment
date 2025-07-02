#version 430
#include "/include/prelude.glsl"

out VertexOutput {
    vec2 atlas_uv;
    vec2 lightmap;
    vec3 normal;
    vec4 color;
} v_out;

void iris_emitVertex(inout VertexData data) {
    vec3 position_view = transform(iris_modelViewMatrix, data.modelPos.xyz);
    data.clipPos = project(iris_projectionMatrix, position_view);
}

void iris_sendParameters(VertexData data) {
    vec3 normal_view = normalize(mat3(iris_modelViewMatrix) * data.normal);
    vec3 normal_world = mat3(ap.camera.viewInv) * normal_view;

    v_out.atlas_uv = data.uv;
    v_out.lightmap = data.light;
    v_out.normal   = normal_world;
    v_out.color    = data.color;
}
