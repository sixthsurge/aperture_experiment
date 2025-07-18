#version 430

out VertexOutputs {
    vec2 atlas_uv;
    vec2 lightmap;
    vec3 normal;
    vec4 color;

#if defined OBJECT_TERRAIN_TRANSLUCENT
    flat uint block;
#endif
} outputs;

#include "/include/prelude.glsl"

void iris_emitVertex(inout VertexData data) {
    vec3 position_view = transform(iris_modelViewMatrix, data.modelPos.xyz);
    data.clipPos = project(iris_projectionMatrix, position_view);
}

void iris_sendParameters(VertexData data) {
    vec3 normal_view = normalize(mat3(iris_modelViewMatrix) * data.normal);
    vec3 normal_world = mat3(ap.camera.viewInv) * normal_view;

    outputs.atlas_uv = data.uv;
    outputs.lightmap = data.light;
    outputs.normal   = normal_world;
    outputs.color    = data.color;

#if defined OBJECT_TERRAIN_TRANSLUCENT
    outputs.block    = data.blockId;
#endif
}
