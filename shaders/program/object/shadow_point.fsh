#version 430
#include "/include/prelude.glsl"

in VertexOutput {
    vec2 atlas_uv;
    vec4 color;
    vec3 pos_model;
    flat bool is_full_block;
} f_in;

void iris_emitFragment() {
    vec2 new_atlas_uv = f_in.atlas_uv;
    vec4 new_color = f_in.color;;
    vec2 new_light;
    iris_modifyBase(new_atlas_uv, new_color, new_light);

    vec4 base_color = iris_sampleBaseTex(new_atlas_uv) * new_color;
    if (iris_discardFragment(base_color)) discard;

    // from null
    float near = f_in.is_full_block ? 0.5 : 0.49999;
    if (clamp(f_in.pos_model, -near, near) == f_in.pos_model) discard;
}
