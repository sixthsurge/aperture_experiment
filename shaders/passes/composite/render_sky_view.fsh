#version 430

layout (location = 0) out vec3 sky_view_out;

noperspective in vec2 uv;

layout (std140, binding = 0) uniform
#include "/include/buffer/global.glsl"

uniform sampler3D atmosphere_scattering_lut;

#include "/include/prelude.glsl"
#include "/include/atmosphere.glsl"
#include "/include/sky/projection.glsl"

void main() {
    vec3 direction_w = unproject_sky(uv);

    sky_view_out = atmosphere_scattering(
        atmosphere_scattering_lut,
        direction_w,
        sun_irradiance,
        global.sun_direction,
        moon_irradiance,
        global.moon_direction,
        true
    );
}
