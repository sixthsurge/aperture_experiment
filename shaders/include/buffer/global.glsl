#if !defined SHADERS_INCLUDE_BUFFER_GLOBAL_DATA
#define SHADERS_INCLUDE_BUFFER_GLOBAL_DATA

struct GlobalData {
    vec3 light_direction;
    float pad0;

    vec3 sun_direction;
    float pad1;

    vec3 moon_direction;
    float pad2;

    vec3 light_irradiance;
    float pad3;
};

#endif
