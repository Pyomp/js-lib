import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { GLSL_CAMERA } from "./chunks/glslCamera.js"
import { GLSL_COMMON } from "./chunks/glslCommon.js"
import { GLSL_DEFERRED } from "./chunks/glslDeferred.js"
import { GLSL_MORPH_TARGET } from "./chunks/glslMorphTarget.js"
import { GLSL_SKINNED } from "./chunks/glslSkinnedChunk.js"

function vertexShader(
    /** @type {boolean} */ isSkinned,
    /** @type {string[]} */ morphs = []
) {
    const isMorph = morphs.length > 0

    return `#version 300 es
precision highp float;
precision highp int;

${GLSL_COMMON.vertexDeclaration}
${isSkinned ? GLSL_SKINNED.declaration : ''}
${isMorph ? GLSL_MORPH_TARGET.declaration(morphs) : ''}
${GLSL_CAMERA.declaration}
${GLSL_DEFERRED.vertexDeferredDeclaration}

out vec2 v_uv;
out vec3 v_normal;

void main() {
    ${isSkinned ? GLSL_SKINNED.computeSkinMatrix : ''}

    vec4 worldPosition = ${GLSL_COMMON.getWorldPosition(
        isMorph ? GLSL_MORPH_TARGET.getMorphTargetPosition : GLSL_COMMON.positionAttribute,
        isSkinned ? GLSL_SKINNED.skinMatrix : ''
    )};

    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * worldPosition;

    v_normal = ${GLSL_COMMON.getWorldNormal(
        isMorph ? GLSL_MORPH_TARGET.getMorphTargetNormal : GLSL_COMMON.normalAttribute,
        isSkinned ? GLSL_SKINNED.skinMatrix : ''
    )};

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

export class CommonDeferredProgram extends GlProgram {
    constructor(
        /** @type {boolean} */ isSkinned = false,
        /** @type {string[]} */ morphs = [],
    ) {
        super(
            () => vertexShader(
                isSkinned,
                morphs
            ),
            () => fragmentShader()
        )
    }
}
