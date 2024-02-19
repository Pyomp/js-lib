import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { GLSL_CAMERA } from "./chunks/glslCamera.js"
import { GLSL_COMMON } from "./chunks/glslCommon.js"

function vertexShader() {
    return `#version 300 es
${GLSL_CAMERA.declaration}
${GLSL_COMMON.vertexDeclaration}

out vec2 v_uv;

void main() {
    vec4 worldPosition = ${GLSL_COMMON.worldMatrix} * vec4(${GLSL_COMMON.positionAttribute}, 1.0);
    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * worldPosition;
    v_uv = uv;
}`
}

function fragmentShader() {
    return `#version 300 es
precision highp float;

in vec2 v_uv;

${GLSL_COMMON.fragmentDeclaration}

out vec4 outColor;

void main() {
    vec4 color = texture(${GLSL_COMMON.baseTexture}, v_uv);
    outColor = color;
    // outColor = vec4(1.,0.,0.,1.);
}`
}

export const basicProgram = new GlProgram(vertexShader, fragmentShader)
