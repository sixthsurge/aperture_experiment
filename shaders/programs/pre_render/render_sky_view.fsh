#version 430
#include "/include/prelude.glsl"
#include "/include/buffer/global.glsl"

layout(location = 0) out vec3 sky_view_out;

in vec2 uv;

layout(std140, binding = 0) uniform GlobalBuffer {
    GlobalData global;
};

uniform sampler3D atmosphere_scattering_lut;

#include "/include/atmosphere.glsl"
#include "/include/sky/projection.glsl"

void main() {
    vec3 ray_dir = unproject_sky(uv);

    sky_view_out = atmosphere_scattering(
        atmosphere_scattering_lut,
        ray_dir,
        sun_irradiance,
        global.sun_dir,
        moon_irradiance,
        global.moon_dir,
        true
    );
}
