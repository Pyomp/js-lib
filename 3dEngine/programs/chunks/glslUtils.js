const linearizeDepth = Object.freeze({
    declaration(cameraNear, cameraFar) {
        return `float linearizeDepth(float depth) 
{
    float ndc = depth * 2.0 - 1.0;
    return (2.0 * ${cameraNear} * ${cameraFar}) / (${cameraFar} + ${cameraNear} - ndc * (${cameraFar} - ${cameraNear}));	
}`},
    call(depth) { return `linearizeDepth(${depth})` }

})

export const GLSL_UTILS = Object.freeze({
    linearizeDepth
})
