import { GLSL_CAMERA } from "./glslCamera.js"

const linearizeDepth = Object.freeze({
    declaration(cameraNear, cameraFar) {
        return `float linearizeDepth(float depth) 
{
    float ndc = depth * 2.0 - 1.0;
    return (2.0 * ${cameraNear} * ${cameraFar}) / (${cameraFar} + ${cameraNear} - ndc * (${cameraFar} - ${cameraNear}));	
}`},
    call(/** @type {string} */ depth) { return `linearizeDepth(${depth})` }
})

const linearDepthToGl = Object.freeze({
    declaration(
        /** @type {string} */ cameraNear = GLSL_CAMERA.near,
        /** @type {string} */ cameraFar = GLSL_CAMERA.far,
    ) {
        return `
float linearDepthToGl(float linearDepth) {
    float near = ${cameraNear};
    float far = ${cameraFar};
    return (far / (far - near)) - (far * near) / ((far - near) * linearDepth);
    

    // float nonLinearDepth = (${cameraFar} + ${cameraNear} - 2.0 * ${cameraNear} * ${cameraFar} / linearDepth) / (${cameraFar} - ${cameraNear});
    // nonLinearDepth = (nonLinearDepth + 1.0) / 2.0;
    // return nonLinearDepth;
}
`
    },
    call(/** @type {string} */ depth) { return `linearDepthToGl(${depth})` }
})


export const GLSL_UTILS = Object.freeze({
    linearizeDepth,
    linearDepthToGl
})
