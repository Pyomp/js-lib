import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GLSL_CAMERA } from "./glslCamera.js"
import { GLSL_WINDOW } from "./glslWindow.js"

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

uniform sampler2D deferredColorTexture;
uniform isampler2D deferredPositionDepthTexture;
uniform isampler2D deferredNormalTexture;

vec3 getDeferredColor(ivec2 texelCoord){
    return texelFetch(deferredColorTexture, texelCoord, 0).xyz;
}

vec4 getDeferredPositionDepth(ivec2 texelCoord){
    vec4 deferredPositionDepth = vec4(texelFetch(deferredPositionDepthTexture, texelCoord, 0));
    deferredPositionDepth.xyz /= 1000.;
    deferredPositionDepth.w = (float(deferredPositionDepth.w) / INT_RANGE) + 0.5;
    return deferredPositionDepth;
}

vec3 getDeferredNormal(ivec2 texelCoord){
    return normalize(vec3(texelFetch(deferredNormalTexture, texelCoord, 0).xyz));
}

void computeDeferredPixel(
    ivec2 texelCoord,
    out vec3 outColor,
    out vec3 outWorldPosition,
    out float outLinearDepth,
    out vec3 outNormal
){
    vec4 deferredPositionDepth = getDeferredPositionDepth(texelCoord);

    outColor = getDeferredColor(texelCoord);
    outWorldPosition = deferredPositionDepth.xyz;
    outLinearDepth = deferredPositionDepth.w;
    outNormal = getDeferredNormal(texelCoord);
}

ivec2 getTexelCoord(vec2 uv, vec2 resolution){
    return ivec2(uv * resolution);
}
`

function computeDeferredPixel(
    /** @type {string} */ texelCoord,
    /** @type {string} */ outColor,
    /** @type {string} */ outWorldPosition,
    /** @type {string} */ outLinearDepth,
    /** @type {string} */ outNormal,
) {
    return `computeDeferredPixel(${texelCoord}, ${outColor}, ${outWorldPosition}, ${outLinearDepth}, ${outNormal});`
}

function getDeferredColor(
    /** @type {string} */ texelCoord,
) {
    return `getDeferredColor(${texelCoord})`
}

function getDeferredPositionDepth(
    /** @type {string} */ texelCoord,
) {
    return `getDeferredPositionDepth(${texelCoord})`
}

function getDeferredNormal(
    /** @type {string} */ texelCoord,
) {
    return `getDeferredNormal(${texelCoord})`
}

/**
 * @param {{
 *      color: GlTexture,
 *      positionDepth: GlTexture,
 *      normal: GlTexture,
 * }} deferredTextures
*/
function createUserUniform({ color, positionDepth, normal, }) {
    return {
        deferredColorTexture: color,
        deferredPositionDepthTexture: positionDepth,
        deferredNormalTexture: normal
    }
}

function getTexelCoord(
    /** @type {string} */ uv,
    /** @type {string} */ resolution = GLSL_WINDOW.resolution,
){
    return `getTexelCoord(${uv}, ${resolution})`
}

export const GLSL_DEFERRED = Object.freeze({
    vertexDeferredDeclaration,
    setVertexDeferredOutputs,
    fragmentDeferredDeclaration,
    setFragmentDeferredOutputs,

    createUserUniform,

    fragmentUserDeclaration,
    getTexelCoord,
    computeDeferredPixel,
    getDeferredColor,
    getDeferredPositionDepth,
    getDeferredNormal,
})
