#version 430

#include "/include/prelude.glsl"
#include "/include/atmosphere.glsl"

layout (local_size_x = 1, local_size_y = 1, local_size_z = 1) in;

layout (std140, binding = 0) buffer 
#include "/include/buffer/global.glsl"

layout (std140, binding = 1) buffer HistogramBuffer {
    uint bin[HISTOGRAM_BINS];
} histogram;

void main() {
    global.light_direction = mat3(ap.camera.viewInv) * normalize(ap.celestial.pos);
    global.sun_direction   = mat3(ap.camera.viewInv) * normalize(ap.celestial.sunPos);
    global.moon_direction  = mat3(ap.camera.viewInv) * normalize(ap.celestial.moonPos);

    global.light_irradiance = atmosphere_transmittance(
        global.light_direction.y, 
        planet_radius
    ) * (ap.celestial.angle < 0.5 ? sun_irradiance : moon_irradiance);

    // zero histogram buffer 
    for (uint i = 0; i < HISTOGRAM_BINS; ++i) {
        histogram.bin[i] = 0;
    }
}
