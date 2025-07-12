#version 430

in VertexOutput {
    vec2 atlas_uv;
    vec4 color;
} f_in;

void iris_emitFragment() {
    vec4 base_color = iris_sampleBaseTex(f_in.atlas_uv) * f_in.color;
    if (iris_discardFragment(base_color)) discard;
}
