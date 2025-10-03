import { GlArrayBuffer } from "../../webgl/glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../../webgl/glDescriptors/GlAttribute.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"

const jointsTexture = 'jointsTexture'
const weights = 'weights'
const joints = 'joints'
const skinMatrix = 'skinMatrix'

const declaration = `
in vec4 ${weights};
in uvec4 ${joints};

uniform sampler2D ${jointsTexture};

mat4 getBoneMatrix(uint jointNdx) {
    return mat4(
        texelFetch(${jointsTexture}, ivec2(0, jointNdx), 0),
        texelFetch(${jointsTexture}, ivec2(1, jointNdx), 0),
        texelFetch(${jointsTexture}, ivec2(2, jointNdx), 0),
        texelFetch(${jointsTexture}, ivec2(3, jointNdx), 0));
}

mat4 getSkinMatrix() {
    return getBoneMatrix(${joints}[0]) * ${weights}[0] +
        getBoneMatrix(${joints}[1]) * ${weights}[1] +
        getBoneMatrix(${joints}[2]) * ${weights}[2] +
        getBoneMatrix(${joints}[3]) * ${weights}[3];
}

`

const computeSkinMatrix = `
mat4 ${skinMatrix} = getSkinMatrix();
`

function createUniforms(
    /** @type {GlTexture} */ _jointsTexture
) {
    return {
        [jointsTexture]: _jointsTexture
    }
}

function createAttributes(
    /** @type {Uint8Array} */ _joints,
    /** @type {Float32Array} */ _weights,
) {
    return [
        new GlAttribute({ glArrayBuffer: new GlArrayBuffer(_joints), name: GLSL_SKINNED.joints, size: 4, type: WebGL2RenderingContext.UNSIGNED_BYTE }),
        new GlAttribute({ glArrayBuffer: new GlArrayBuffer(_weights), name: GLSL_SKINNED.weights, size: 4, type: WebGL2RenderingContext.FLOAT }),
    ]
}

export const GLSL_SKINNED = Object.freeze({
    jointsTexture,
    weights,
    joints,
    skinMatrix,
    declaration,
    computeSkinMatrix,
    
    createUniforms,
    createAttributes
})
