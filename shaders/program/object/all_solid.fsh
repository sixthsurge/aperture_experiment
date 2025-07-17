#version 430

layout (location = 0) out uvec4 gbuffer_data_out;

in VertexOutputs {
    vec2 atlas_uv;
    vec2 lightmap;
    vec3 normal;
    vec4 color;

#if defined OBJECT_TERRAIN_SOLID || defined OBJECT_TERRAIN_CUTOUT
    flat uint block;
#endif
} inputs;

#include "/include/prelude.glsl"
#include "/include/utility/dithering.glsl"
#include "/include/gbuffer_encoding.glsl"

#if defined OBJECT_TERRAIN_SOLID || defined OBJECT_TERRAIN_CUTOUT
#include "/include/material_mask.glsl"
#endif

void iris_emitFragment() {
    vec2 new_atlas_uv = inputs.atlas_uv;
    vec2 new_lightmap = inputs.lightmap;
    vec4 new_color    = inputs.color;
    iris_modifyBase(new_atlas_uv, new_color, new_lightmap);

    vec4 base_color = iris_sampleBaseTex(new_atlas_uv) * new_color;

    // Alpha test
    if (iris_discardFragment(base_color)) discard;

    // Dithering for lightmaps
    float dither = interleaved_gradient_noise(gl_FragCoord.xy, ap.time.frames);

    // Encode gbuffer data
    GbufferData gbuffer_data;
    gbuffer_data.base_color = base_color.rgb;
    gbuffer_data.flat_normal = inputs.normal;
    gbuffer_data.lightmap = dither_8bit(new_lightmap, dither);

#if defined OBJECT_TERRAIN_SOLID || defined OBJECT_TERRAIN_CUTOUT
    gbuffer_data.material_mask = create_material_mask(inputs.block);
#else
    gbuffer_data.material_mask = 0u;
#endif

    gbuffer_data_out = encode_gbuffer_data(gbuffer_data);
}
