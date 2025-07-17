#version 430

#include "/include/prelude.glsl"
#include "/include/atmosphere.glsl"

layout (local_size_x = 1, local_size_y = 1, local_size_z = 1) in;

layout (std140, binding = 0) buffer 
#include "/include/buffer/global.glsl"

void main() {
    global.light_dir = mat3(ap.camera.viewInv) * normalize(ap.celestial.pos);
    global.sun_dir   = mat3(ap.camera.viewInv) * normalize(ap.celestial.sunPos);
    global.moon_dir  = mat3(ap.camera.viewInv) * normalize(ap.celestial.moonPos);

    global.light_irradiance = atmosphere_transmittance(
        global.light_dir.y, 
        planet_radius
    ) * (ap.celestial.angle < 0.5 ? sun_irradiance : moon_irradiance);
}
