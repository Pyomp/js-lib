import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GLSL_CAMERA } from "./glslCamera.js"

const vertexDeferredDeclaration = `
#define INT_RANGE 2147483647.0

out vec3 v_deferred_world_position;
out float v_deferred_linear_depth;
`

function setVertexDeferredOutputs(
    /** @type {string} */ worldPosition,
    /** @type {string} */ far = GLSL_CAMERA.far,
    /** @type {string} */ near = GLSL_CAMERA.near,
) {
    return `
v_deferred_world_position = ${worldPosition}.xyz;

float depthRange = ${far} - ${near};
float depthRangeHalf = depthRange / 2.;
v_deferred_linear_depth = (gl_Position.z - depthRangeHalf) / (depthRange / INT_RANGE);
`
}


const fragmentDeferredDeclaration = `
#define INT_RANGE 2147483647.0

in vec3 v_deferred_world_position;
in float v_deferred_linear_depth;

layout(location = 0) out vec3 outColor;
layout(location = 1) out ivec4 outPosition;
layout(location = 2) out ivec4 outNormal;
layout(location = 3) out float outDepth; // not used
layout(location = 4) out int outStencil; // not used
`

function setFragmentDeferredOutputs(
    /** @type {string} */ color,
    /** @type {string} */ normal,
) {
    return `
outColor = ${color}.xyz;
outPosition = ivec4(v_deferred_world_position * 1000., v_deferred_linear_depth);
outNormal = ivec4(normalize(${normal}) * INT_RANGE, 1);
outDepth = gl_FragCoord.z;
outStencil = 0;
`
}


const fragmentUserDeclaration = `
#define INT_RANGE 2147483647.0

uniform sampler2D inDeferredColorTexture;
uniform isampler2D inDeferredPositionTexture;
uniform isampler2D inDeferredNormalTexture;

vec3 getDeferredColor(vec2 uv){
    return texture(inDeferredColorTexture, uv).xyz;
}

vec4 getDeferredPositionDepth(vec2 uv){
    vec4 deferredPositionDepth = vec4(texture(inDeferredPositionTexture, uv));
    deferredPositionDepth.xyz /= 1000.;
    deferredPositionDepth.w = (float(deferredPositionDepth.w) / INT_RANGE) + 0.5;
    return deferredPositionDepth;
}

vec3 getDeferredNormal(vec2 uv){
    return normalize(vec3(texture(inDeferredNormalTexture, uv).xyz) / INT_RANGE);
}

void computeDeferredPixel(
    in vec2 uv,
    out vec3 outColor,
    out vec3 outWorldPosition,
    out float outLinearDepth,
    out vec3 outNormal
){
    vec4 deferredPositionDepth = getDeferredPositionDepth(uv);

    outColor = getDeferredColor(uv);
    outWorldPosition = deferredPositionDepth.xyz;
    outLinearDepth = deferredPositionDepth.w;
    outNormal = getDeferredNormal(uv);
}
`

function computeDeferredPixel(
    /** @type {string} */ uv,
    /** @type {string} */ outColor,
    /** @type {string} */ outWorldPosition,
    /** @type {string} */ outLinearDepth,
    /** @type {string} */ outNormal,
) {
    return `computeDeferredPixel(${uv}, ${outColor}, ${outWorldPosition}, ${outLinearDepth}, ${outNormal});`
}

function getDeferredColor(
    /** @type {string} */ uv,
) {
    return `getDeferredColor(${uv})`
}

function getDeferredPositionDepth(
    /** @type {string} */ uv,
) {
    return `getDeferredPositionDepth(${uv})`
}

function getDeferredNormal(
    /** @type {string} */ uv,
) {
    return `getDeferredNormal(${uv})`
}

function createUserUniform(
    /** @type {GlTexture} */ inDeferredColorTexture,
    /** @type {GlTexture} */ inDeferredPositionTexture,
    /** @type {GlTexture} */ inDeferredNormalTexture,
) {
    return {
        inDeferredColorTexture,
        inDeferredPositionTexture,
        inDeferredNormalTexture
    }
}

export const GLSL_DEFERRED = Object.freeze({
    vertexDeferredDeclaration,
    setVertexDeferredOutputs,
    fragmentDeferredDeclaration,
    setFragmentDeferredOutputs,

    createUserUniform,
    fragmentUserDeclaration,
    computeDeferredPixel,
    getDeferredColor,
    getDeferredPositionDepth,
    getDeferredNormal,
})
