#version 430
#include "/include/prelude.glsl"

in VertexOutputs {
    vec2 atlas_uv;
    vec4 color;
    vec3 pos_model;
    flat bool is_full_block;
} inputs;

void iris_emitFragment() {
    vec2 new_atlas_uv = inputs.atlas_uv;
    vec2 new_lightmap;
    vec4 new_color = inputs.color;
    iris_modifyBase(new_atlas_uv, new_color, new_lightmap);

    vec4 base_color = iris_sampleBaseTex(new_atlas_uv) * new_color;
    if (iris_discardFragment(base_color)) discard;

    // from null
    float near = inputs.is_full_block ? 0.5 : 0.49999;
    if (clamp(inputs.pos_model, -near, near) == inputs.pos_model) discard;
}
