// 2nd July 2026

[14:24:05] [Render thread/WARN]: Built-in uniforms: struct GameData {
float brightness; // 0
vec2 screenSize; // 8
int mainHand; // 16
int offHand; // 20
bool guiHidden; // 24
};

struct WorldData {
vec3 skyColor; // 0
float rain; // 12
ivec3 internal_chunkDiameter; // 16
float thunder; // 28
float fogStart; // 32
float fogEnd; // 36
vec4 fogColor; // 48
int time; // 64
int day; // 68
};

struct CelestialData {
vec3 pos; // 0
float angle; // 12
vec3 sunPos; // 16
float bsl_shadowFade; // 28
vec3 upPos; // 32
float makeUp_lightMix; // 44
vec3 moonPos; // 48
int phase; // 60
mat4 view; // 64
mat4 viewInv; // 128
mat4[8] projection; // 192
mat4[8] projectionInv; // 704
};

struct CameraData {
vec3 pos; // 0
float near; // 12
vec3 fractPos; // 16
float far; // 28
ivec3 intPos; // 32
float renderDistance; // 44
ivec3 blockPos; // 48
int fluid; // 60
vec2 brightness; // 64
mat4 view; // 80
mat4 viewInv; // 144
mat4 projection; // 208
mat4 projectionInv; // 272
};

struct TemporalData {
vec3 pos; // 0
mat4 view; // 16
mat4 viewInv; // 80
mat4 projection; // 144
mat4 projectionInv; // 208
};

struct TimingData {
float delta; // 0
float elapsed; // 4
int frames; // 8
};

struct PointData {
vec4[64] pos; // 0
int[64] block; // 1024
mat4 projection; // 2048
};
