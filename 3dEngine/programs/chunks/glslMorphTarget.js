import { Vector4 } from "../../../math/Vector4.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GLSL_COMMON } from "./glslCommon.js"

const positionPrefix = 'positionMorphTarget'
const normalPrefix = 'normalMorphTarget'

function declaration() {
    return `
        uniform highp sampler2D morphPositionTex;
        uniform highp sampler2D morphNormalTex;
        uniform vec4 morphWeights;

        vec3 fetchPositionMorph(int morphIndex) {
            ivec2 texCoord = ivec2(gl_VertexID, morphIndex);
            return texelFetch(morphPositionTex, texCoord, 0).xyz;
        }

        vec3 fetchNormalMorph(int morphIndex) {
            ivec2 texCoord = ivec2(gl_VertexID, morphIndex);
            return texelFetch(morphNormalTex, texCoord, 0).xyz;
        }

        vec3 getMorphedPosition(){
            return ${GLSL_COMMON.positionAttribute}
                + fetchPositionMorph(0) * morphWeights[0]
                + fetchPositionMorph(1) * morphWeights[1]
                + fetchPositionMorph(2) * morphWeights[2]
                + fetchPositionMorph(3) * morphWeights[3];
        }

        vec3 getMorphedNormal(){
            return ${GLSL_COMMON.normalAttribute}
                + fetchNormalMorph(0) * morphWeights[0]
                + fetchNormalMorph(1) * morphWeights[1]
                + fetchNormalMorph(2) * morphWeights[2]
                + fetchNormalMorph(3) * morphWeights[3];
        }
    `
}

function createUniforms(
    /** @type {GlTexture} */ morphPositionTexture,
    /** @type {GlTexture} */ morphNormalTexture,
    /** @type {Vector4} */ weight
) {
    return {
        morphPositionTex: morphPositionTexture,
        morphNormalTex: morphNormalTexture,
        morphWeights: weight,
    }
}

const getMorphTargetPosition = `getMorphedPosition()`
const getMorphTargetNormal = `getMorphedNormal()`

export const GLSL_MORPH_TARGET = Object.freeze({
    positionPrefix,
    normalPrefix,
    declaration,
    getMorphTargetPosition,
    getMorphTargetNormal,

    createUniforms,
})
