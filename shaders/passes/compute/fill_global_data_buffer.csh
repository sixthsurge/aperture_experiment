#version 430

#include "/include/prelude.glsl"
#include "/include/buffer/global.glsl"
#include "/include/atmosphere.glsl"

layout (local_size_x = 1, local_size_y = 1, local_size_z = 1) in;

layout (std140, binding = 0) buffer GlobalDataBuffer {
    GlobalData global_data;
};

void main() {
    global_data.light_direction = mat3(ap.camera.viewInv) * normalize(ap.celestial.pos);
    global_data.sun_direction   = mat3(ap.camera.viewInv) * normalize(ap.celestial.sunPos);
    global_data.moon_direction  = mat3(ap.camera.viewInv) * normalize(ap.celestial.moonPos);

    global_data.light_irradiance = atmosphere_transmittance(
        global_data.light_direction.y, 
        planet_radius
    ) * (ap.celestial.angle < 0.5 ? sun_irradiance : moon_irradiance);
}
