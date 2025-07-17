#if !defined SHADERS_INCLUDE_BUFFER_STREAMED_SETTINGS
#define SHADERS_INCLUDE_BUFFER_STREAMED_SETTINGS

struct StreamedSettings {
    bool bloom_enabled;
    float bloom_intensity;
    bool auto_exposure_enabled;
    float manual_exposure_value;
};

#endif // SHADERS_INCLUDE_BUFFER_STREAMED_SETTINGS
