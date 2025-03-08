const linearizeDepth = Object.freeze({
    declaration(cameraNear, cameraFar) {
        return `float linearizeDepth(float depth) 
{
    float ndc = depth * 2.0 - 1.0;
    return (2.0 * ${cameraNear} * ${cameraFar}) / (${cameraFar} + ${cameraNear} - ndc * (${cameraFar} - ${cameraNear}));	
}`},
    call(depth) { return `linearizeDepth(${depth})` }
})

const linearDepthToGl = Object.freeze({
    declaration(cameraNear, cameraFar) {
        return `float linearDepthToGl(float linearDepth) 
{
    float nonLinearDepth = (${cameraFar} + ${cameraNear} - 2.0 * ${cameraNear} * ${cameraFar} / linearDepth) / (${cameraFar} - ${cameraNear});
    nonLinearDepth = (nonLinearDepth + 1.0) / 2.0;
    return nonLinearDepth;
}`
    },
    call(depth) { return `linearDepthToGl(${depth})` }
})


export const GLSL_UTILS = Object.freeze({
    linearizeDepth,
    linearDepthToGl
})
