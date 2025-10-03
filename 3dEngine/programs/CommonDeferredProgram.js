import { Matrix4 } from "../../math/Matrix4.js"
import { Vector4 } from "../../math/Vector4.js"
import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { GlTexture } from "../webgl/glDescriptors/GlTexture.js"
import { GLSL_CAMERA } from "./chunks/glslCamera.js"
import { GLSL_COMMON } from "./chunks/glslCommon.js"
import { GLSL_DEFERRED } from "./chunks/glslDeferred.js"
import { GLSL_MORPH_TARGET } from "./chunks/glslMorphTarget.js"
import { GLSL_SKINNED } from "./chunks/glslSkinnedChunk.js"

function vertexShader(
    /** @type {boolean} */ isSkinned,
    /** @type {boolean} */ isMorph
) {
    return `#version 300 es
precision highp float;
precision highp int;

${GLSL_COMMON.vertexDeclaration}
${isSkinned ? GLSL_SKINNED.declaration : ''}
${isMorph ? GLSL_MORPH_TARGET.declaration() : ''}
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
    ${GLSL_DEFERRED.fragmentDeferredDeclaration}
    
    void main() {
        vec4 color = texture(${GLSL_COMMON.baseTexture}, v_uv);
        ${GLSL_DEFERRED.setFragmentDeferredOutputs('color', 'v_normal')}
    }`
}

function createAttributes(
    /** @type {Float32Array} */ position,
    /** @type {Float32Array} */ uv,
    /** @type {Float32Array} */ normal,
    /** @type {Uint8Array | undefined} */ joints,
     /** @type {Float32Array | undefined } */ weights,
) {
    const isSkinned = joints && weights

    const skinnedAttributes = isSkinned ? GLSL_SKINNED.createAttributes(joints, weights) : []

    return [
        ...GLSL_COMMON.createAttributes(position, uv, normal),
        ...skinnedAttributes
    ]
}

/**
 * @returns {{
 *      morphPositionTex?: GlTexture;
 *      morphNormalTex?: GlTexture;
 *      activeMorphs?: Vector4;
 *      morphWeights?: Vector4;
 *      jointsTexture?: GlTexture;
 *      worldMatrix: Matrix4;
 *      baseTexture: GlTexture;
 * }}
*/
function createUniforms(
    /** 
     * @type {{
     *      worldMatrix: Matrix4,
     *      baseTexture: GlTexture
     *      jointsTexture?: GlTexture
     *      morphPositionTexture?: GlTexture
     *      morphNormalTexture?: GlTexture
     *      weight?: Vector4
     * }}
     */
    args
) {
    return {
        ...GLSL_COMMON.createUniforms(args.worldMatrix, args.baseTexture),
        ...(args.jointsTexture ? GLSL_SKINNED.createUniforms(args.jointsTexture) : {}),
        ...((args.morphPositionTexture && args.morphNormalTexture && args.weight) ? GLSL_MORPH_TARGET.createUniforms(args.morphPositionTexture, args.morphNormalTexture, args.weight) : {})
    }
}

export class OpaqueStaticDeferredGlProgram extends GlProgram {
    static createAttributes(
    /** @type {Float32Array} */ position,
    /** @type {Float32Array} */ uv,
    /** @type {Float32Array} */ normal,
    ) {
        return createAttributes(position, uv, normal, undefined, undefined)
    }

    static createUniforms(
        /** @type {Matrix4} */ worldMatrix,
        /** @type {GlTexture} */ baseTexture,
    ) {
        return createUniforms({ worldMatrix, baseTexture })
    }

    constructor() {
        super(
            () => vertexShader(false, false),
            () => fragmentShader()
        )
    }
}


export class OpaqueSkinnedDeferredGlProgram extends GlProgram {
    static createAttributes(
        /** @type {Float32Array} */ position,
        /** @type {Float32Array} */ uv,
        /** @type {Float32Array} */ normal,
        /** @type {Uint8Array } */ joints,
        /** @type {Float32Array  } */ weights,
    ) {
        return createAttributes(position, uv, normal, joints, weights)
    }

    static createUniforms(
        /** @type {Matrix4} */ worldMatrix,
        /** @type {GlTexture} */ baseTexture,
        /** @type {GlTexture} */ jointsTexture
    ) {
        return createUniforms({ worldMatrix, baseTexture, jointsTexture })
    }

    constructor() {
        super(
            () => vertexShader(true, false),
            () => fragmentShader()
        )
    }
}

export class OpaqueMorphedDeferredGlProgram extends GlProgram {
    static createAttributes(
        /** @type {Float32Array} */ position,
        /** @type {Float32Array} */ uv,
        /** @type {Float32Array} */ normal,
    ) {
        return createAttributes(position, uv, normal, undefined, undefined)
    }

    static createUniforms(
        /** @type {Matrix4} */ worldMatrix,
        /** @type {GlTexture} */ baseTexture,
        /** @type {GlTexture} */ morphPositionTexture,
        /** @type {GlTexture} */ morphNormalTexture,
        /** @type {Vector4} */ weight,
    ) {
        return createUniforms({ worldMatrix, baseTexture, morphPositionTexture, morphNormalTexture, weight })
    }

    constructor() {
        super(
            () => vertexShader(false, true),
            () => fragmentShader()
        )
    }
}

export class OpaqueSkinnedMorphedDeferredGlProgram extends GlProgram {
    static createAttributes(
        /** @type {Float32Array} */ position,
        /** @type {Float32Array} */ uv,
        /** @type {Float32Array} */ normal,
        /** @type {Uint8Array } */ joints,
        /** @type {Float32Array  } */ weights,
    ) {
        return createAttributes(position, uv, normal, joints, weights)
    }

    static createUniforms(
        /** @type {Matrix4} */ worldMatrix,
        /** @type {GlTexture} */ baseTexture,
        /** @type {GlTexture} */ jointsTexture,
        /** @type {GlTexture} */ morphPositionTexture,
        /** @type {GlTexture} */ morphNormalTexture,
        /** @type {Vector4} */ weight,
    ) {
        return createUniforms({ worldMatrix, baseTexture, jointsTexture, morphPositionTexture, morphNormalTexture, weight })
    }

    constructor() {
        super(
            () => vertexShader(true, true),
            () => fragmentShader()
        )
    }
}
