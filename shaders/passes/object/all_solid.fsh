#version 430

#include "/include/prelude.glsl"
#include "/include/utility/dithering.glsl"
#include "/include/gbuffer_encoding.glsl"

layout (location = 0) out vec4 gbuffer_data_out;

in VertexOutput {
    vec2 atlas_uv;
    vec2 lightmap;
    vec3 normal;
    vec4 color;
} f_in;

void iris_emitFragment() {
    vec4 base_color = iris_sampleBaseTex(f_in.atlas_uv) * f_in.color;

    // Alpha test
    if (iris_discardFragment(base_color)) discard;

    // Dithering for lightmaps
    float dither = interleaved_gradient_noise(gl_FragCoord.xy, ap.time.frames);

    // Encode gbuffer data
    GbufferData gbuffer_data;
    gbuffer_data.base_color = base_color.rgb;
    gbuffer_data.flat_normal = f_in.normal;
    gbuffer_data.lightmap = dither_8bit(f_in.lightmap, dither);

    gbuffer_data_out = encode_gbuffer_data(gbuffer_data);
}
