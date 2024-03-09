import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { basicProgram } from "./BasicProgram.js"
import { GLSL_CAMERA } from "./chunks/glslCamera.js"
import { GLSL_COMMON } from "./chunks/glslCommon.js"
import { GLSL_SKINNED } from "./chunks/glslSkinnedChunk.js"

function vertexShader() {
    return `#version 300 es
${GLSL_COMMON.vertexDeclaration}
${GLSL_SKINNED.declaration}
${GLSL_CAMERA.declaration}

out vec2 v_uv;

void main() {
    ${GLSL_SKINNED.computeSkinMatrix}
    
    vec4 worldPosition = ${GLSL_COMMON.worldMatrix} * ${GLSL_SKINNED.skinMatrix} * vec4(${GLSL_COMMON.positionAttribute}, 1.0);
    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * worldPosition;
    v_uv = uv;
}`
}

export const basicSkinnedProgram = new GlProgram(vertexShader, basicProgram.fragmentShader)
