import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { GLSL_CAMERA } from "./chunks/glslCamera.js"
import { GLSL_COMMON } from "./chunks/glslCommon.js"
import { GLSL_DEFERRED } from "./chunks/glslDeferred.js"
import { GLSL_SPLATTING } from "./chunks/glslSplatting.js"

function vertexShader() {
    return `#version 300 es
in vec3 ${GLSL_COMMON.positionAttribute};
in vec2 ${GLSL_COMMON.uvAttribute};
in vec3 ${GLSL_COMMON.normalAttribute};
in vec4 ${GLSL_COMMON.tangentAttribute};

${GLSL_CAMERA.declaration}
${GLSL_DEFERRED.vertexDeferredDeclaration}

uniform mat4 ${GLSL_COMMON.worldMatrix};

out vec2 v_uv;
out vec3 v_normal;
out vec3 v_tangent;
out vec3 v_bitangent;

void main() {
    vec4 worldPosition = ${GLSL_COMMON.worldMatrix} * vec4(position, 1.0);

    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * worldPosition;

    v_uv = ${GLSL_COMMON.uvAttribute};

    v_normal = ${GLSL_COMMON.getWorldNormal(GLSL_COMMON.normalAttribute)};
    v_tangent = ${GLSL_COMMON.getTangent(GLSL_COMMON.worldMatrix, GLSL_CAMERA.viewMatrix, GLSL_COMMON.tangentAttribute)};
    v_bitangent = ${GLSL_COMMON.getBiTangent('v_normal', 'v_tangent', GLSL_COMMON.tangentAttribute)};
    
    ${GLSL_DEFERRED.setVertexDeferredOutputs('worldPosition')}
}`
}

function fragmentShader() {
    return `#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 v_uv;
in vec3 v_normal;
in vec3 v_tangent;
in vec3 v_bitangent;

${GLSL_SPLATTING.declaration}
${GLSL_DEFERRED.fragmentDeferredDeclaration}

void main() {
    vec4 splatting = ${GLSL_SPLATTING.getSplatting('v_uv')};

    vec3 color = ${GLSL_SPLATTING.getColor('v_uv', 'splatting')}.rgb;

    vec3 normal = ${GLSL_SPLATTING.getNormal('v_normal', 'v_tangent', 'v_bitangent', 'v_uv', 'splatting')};

    ${GLSL_DEFERRED.setFragmentDeferredOutputs('color', 'normal')}
}`
}

export class SplattingDeferredGlProgram extends GlProgram {
    static createUniforms(
        /** @type {Parameters<typeof GLSL_SPLATTING.createUniforms>} */ splattingData,
    ) {
        return GLSL_SPLATTING.createUniforms(...splattingData)
    }

    constructor() {
        super(
            () => vertexShader(),
            () => fragmentShader()
        )
    }
}
