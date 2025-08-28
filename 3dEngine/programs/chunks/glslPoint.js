import { GLSL_CAMERA } from "./glslCamera.js"
import { GLSL_WINDOW } from "./glslWindow.js"

const vertexDeclaration = `
    float getPixelDiameter(float radius, float viewPositionZ, float height, float fovTanHalf) {
        return (radius *  height / 2.) / (-viewPositionZ * fovTanHalf);
    }
`

const fragmentDeclaration = `
    vec3 getDiscardAndGetSphereNormal() {
        // normalized coordinates inside the point sprite [-1, 1]
        vec2 ndcUV = 2.0 * gl_PointCoord - 1.0;
        float r2 = dot(ndcUV, ndcUV);
        if (r2 > 1.0) discard;

        // Sphere equation: x^2 + y^2 + z^2 = r^2
        return vec3(ndcUV, sqrt(1.0 - r2));
    }

    void computeFragDepth(float viewPositionZ, mat4 projectionMatrix){
        float zScale = projectionMatrix[2][2];
        float zOffset = projectionMatrix[3][2];
        float ndcDepth = (zScale * viewPositionZ + zOffset) / -viewPositionZ;
        gl_FragDepth = ndcDepth * 0.5 + 0.5;
    }

    float getDeltaDepth(float sceneDepth, float viewPositionZ, float radius, float near, float far){
        float particleDepthLinear = (-viewPositionZ - near) / (far - near);
        float diameter = (radius * 2. - near) / (far - near);
        return (sceneDepth - particleDepthLinear) / diameter;
    }
`

function getPixelDiameter(
    /** @type {string} */ radius,
    /** @type {string} */ viewPositionZ,
    /** @type {string} */ height = `${GLSL_WINDOW.resolution}.y`,
    /** @type {string} */ fovTanHalf = GLSL_CAMERA.fovTanHalf,
) {
    return `getPixelDiameter(${radius}, ${viewPositionZ}, ${height}, ${fovTanHalf})`
}

function getDiscardAndGetSphereNormal() {
    return `getDiscardAndGetSphereNormal()`
}

function computeFragDepth(
    /** @type {string} */ viewPositionZ,
    /** @type {string} */ projectionMatrix = GLSL_CAMERA.projectionMatrix
) {
    return `computeFragDepth(${viewPositionZ}, ${projectionMatrix});`
}

function getScreenUV(
    /** @type {string} */ resolution = GLSL_WINDOW.resolution
) {
    return `gl_FragCoord.xy / ${resolution}`
}

function getDeltaDepth(
    /** @type {string} */ sceneDepth,
    /** @type {string} */ viewPositionZ,
    /** @type {string} */ radius,
    /** @type {string} */ near = GLSL_CAMERA.near,
    /** @type {string} */ far = GLSL_CAMERA.far,
) {
    return `getDeltaDepth(${sceneDepth}, ${viewPositionZ}, ${radius}, ${near}, ${far})`
}

function getSoftAlpha(
    /** @type {string} */ deltaDepth,
) {
    return `clamp(${deltaDepth} * 10., 0., 1.)`
}

export const GLSL_POINT = Object.freeze({
    vertexDeclaration,
    fragmentDeclaration,
    getPixelDiameter,
    getDiscardAndGetSphereNormal,
    computeFragDepth,
    getScreenUV,
    getDeltaDepth,
    getSoftAlpha
})
