#version 430

in VertexOutputs {
    vec2 atlas_uv;
    vec4 color;
} inputs;

void iris_emitFragment() {
    vec2 new_atlas_uv = inputs.atlas_uv;
    vec2 new_lightmap;
    vec4 new_color    = inputs.color;
    iris_modifyBase(new_atlas_uv, new_color, new_lightmap);

    vec4 base_color = iris_sampleBaseTex(inputs.atlas_uv) * inputs.color;
    if (iris_discardFragment(base_color)) discard;
}
