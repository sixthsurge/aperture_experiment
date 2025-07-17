#version 430
#include "/include/prelude.glsl"
#include "/include/buffer/global.glsl"

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

layout (std140, binding = 0) uniform GlobalBuffer {
    GlobalData global;
};

#include "/include/gbuffer_encoding.glsl"
#include "/include/utility/color.glsl"
#include "/include/utility/dithering.glsl"

void iris_emitFragment() {
    vec2 new_atlas_uv = inputs.atlas_uv;
    vec2 new_lightmap = inputs.lightmap;
    vec4 new_color    = inputs.color;
    iris_modifyBase(new_atlas_uv, new_color, new_lightmap);

    vec4 base_color = iris_sampleBaseTex(new_atlas_uv) * new_color;

    // Alpha test
    if (iris_discardFragment(base_color)) discard;

    color_out.rgb = (srgb_eotf_inv(base_color.rgb) * rec709_to_rec2020) * global.light_irradiance;
    color_out.a = base_color.a;
}
