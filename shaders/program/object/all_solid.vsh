#version 430

out VertexOutputs {
    vec2 atlas_uv;
    vec2 lightmap;
    vec4 color;
    flat mat3 tbn;

#if defined OBJECT_TERRAIN_SOLID || defined OBJECT_TERRAIN_CUTOUT
    flat uint block;
#endif
} outputs;

#include "/include/prelude.glsl"

void iris_emitVertex(inout VertexData data) {
    vec3 position_view = transform(iris_modelViewMatrix, data.modelPos.xyz);
    data.clipPos = project(iris_projectionMatrix, position_view);
}

void iris_sendParameters(VertexData data) {
    outputs.atlas_uv = data.uv;
    outputs.lightmap = data.light;
    outputs.color    = data.color;

    vec3 tangent_view = normalize(mat3(iris_modelViewMatrix) * data.tangent.xyz);
    vec3 normal_view = normalize(mat3(iris_modelViewMatrix) * data.normal);
    outputs.tbn[0] = mat3(ap.camera.viewInv) * tangent_view;
    outputs.tbn[2] = mat3(ap.camera.viewInv) * normal_view;
    outputs.tbn[1] = normalize(cross(outputs.tbn[0], outputs.tbn[2])) * sign(data.tangent.w);

#if defined OBJECT_TERRAIN_SOLID || defined OBJECT_TERRAIN_CUTOUT
    outputs.block    = data.blockId;
#endif
}
