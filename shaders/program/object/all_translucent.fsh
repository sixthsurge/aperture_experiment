#version 430

layout (location = 0) out vec4 color_out;

in VertexOutputs {
    vec2 atlas_uv;
    vec2 lightmap;
    vec3 normal;
    vec4 color;

#if defined OBJECT_TERRAIN_TRANSLUCENT
    flat uint block;
#endif
} inputs;

#include "/include/prelude.glsl"
#include "/include/utility/dithering.glsl"
#include "/include/gbuffer_encoding.glsl"

void iris_emitFragment() {
    vec2 new_atlas_uv = inputs.atlas_uv;
    vec2 new_lightmap = inputs.lightmap;
    vec4 new_color    = inputs.color;
    iris_modifyBase(new_atlas_uv, new_color, new_lightmap);

    vec4 base_color = iris_sampleBaseTex(new_atlas_uv) * new_color;

    // Alpha test
    if (iris_discardFragment(base_color)) discard;

    color_out = base_color;
}
