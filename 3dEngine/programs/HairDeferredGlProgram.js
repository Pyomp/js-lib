import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { GLSL_CAMERA } from "./chunks/glslCamera.js"
import { GLSL_COMMON } from "./chunks/glslCommon.js"
import { GLSL_DEFERRED } from "./chunks/glslDeferred.js"
import { GLSL_SKINNED } from "./chunks/glslSkinnedChunk.js"

function vertexShader() {
    return `#version 300 es
precision highp float;
precision highp int;

${GLSL_COMMON.vertexDeclaration}
${GLSL_SKINNED.declaration}
${GLSL_CAMERA.declaration}
${GLSL_DEFERRED.vertexDeferredDeclaration}

out vec2 v_uv;
out vec3 v_normal;


void main() {
    ${GLSL_SKINNED.computeSkinMatrix}

    // already multiplied by world matrix in JS
    vec4 worldPosition = ${GLSL_SKINNED.skinMatrix} * vec4(${GLSL_COMMON.positionAttribute}, 1.0);    

    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * worldPosition;

    v_normal = mat3(${GLSL_SKINNED.skinMatrix}) * ${GLSL_COMMON.normalAttribute};
    
    v_uv = uv;

    ${GLSL_DEFERRED.setVertexDeferredOutputs('worldPosition')}
}`
}

function fragmentShader() {
    return `#version 300 es
    precision highp float;
    precision highp int;
    
    in vec2 v_uv;
    in vec3 v_normal;
    
    ${GLSL_CAMERA.declaration}
    ${GLSL_COMMON.fragmentDeclaration}
    
    uniform vec3 specular;
    uniform float ${GLSL_COMMON.alphaTest};

    ${GLSL_DEFERRED.fragmentDeferredDeclaration}

    void main() {
        vec4 color = texture(${GLSL_COMMON.baseTexture}, v_uv);
        if(color.a < ${GLSL_COMMON.alphaTest}) discard;

        ${GLSL_DEFERRED.setFragmentDeferredOutputs('color', 'v_normal')}
    }`
}

export class HairDeferredGlProgram extends GlProgram {
    isDeferred = true

    constructor() {
        super(
            vertexShader,
            fragmentShader
        )
    }
}
