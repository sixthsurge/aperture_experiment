#version 430

layout (local_size_x = 256, local_size_y = 1, local_size_z = 1) in;

layout (r32ui) uniform writeonly restrict uimage2D exposure_histogram_img;

void main() {
    imageStore(exposure_histogram_img, ivec2(gl_LocalInvocationIndex, 0), uvec4(0));
}
