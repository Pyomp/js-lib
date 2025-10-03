import { Matrix4 } from "../../../math/Matrix4.js"
import { GlArrayBuffer } from "../../webgl/glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../../webgl/glDescriptors/GlAttribute.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"

const positionAttribute = 'position'
const uvAttribute = 'uv'
const normalAttribute = 'normal'
const tangentAttribute = 'tangent'
const worldMatrix = 'worldMatrix'
const baseTexture = 'baseTexture'
const normalMatrix = 'normalMatrix'
const alphaTest = 'alphaTest'

const vertexDeclaration = `
in vec3 ${positionAttribute};
in vec2 ${uvAttribute};
in vec3 ${normalAttribute};

uniform mat4 ${worldMatrix};
`

const fragmentDeclaration = `
uniform sampler2D ${baseTexture};
`

const createAttributes = (
    /** @type {Float32Array} */ position,
    /** @type {Float32Array} */ uv,
    /** @type {Float32Array} */ normal
) => [
        new GlAttribute({ glArrayBuffer: new GlArrayBuffer(position), name: GLSL_COMMON.positionAttribute, size: 3, type: WebGL2RenderingContext.FLOAT }),
        new GlAttribute({ glArrayBuffer: new GlArrayBuffer(uv), name: GLSL_COMMON.uvAttribute, size: 2, type: WebGL2RenderingContext.FLOAT }),
        new GlAttribute({ glArrayBuffer: new GlArrayBuffer(normal), name: GLSL_COMMON.normalAttribute, size: 3, type: WebGL2RenderingContext.FLOAT }),
    ]

const createUniforms = (
    /** @type {Matrix4} */ _worldMatrix,
    /** @type {GlTexture} */ _baseTexture,
) => ({
    [worldMatrix]: _worldMatrix,
    [baseTexture]: _baseTexture
})

/**
 * @param {string} positionAttribute 
 * @param {string[]} matrixes 
 */
function getWorldPosition(positionAttribute, ...matrixes) {
    let matrixesString = ''
    for (const matrix of matrixes) {
        if (matrix) matrixesString += `${matrix} * `
    }

    return `${worldMatrix} * ${matrixesString} vec4(${positionAttribute}, 1.0)`
}

function getWorldNormal(
    /** @type {string} */ normalAttribute,
    /** @type {string[]} */ ...matrixes
) {
    return `mat3(${[worldMatrix, ...matrixes.filter(s => s)].join(' * ')}) * ${normalAttribute}`
}

function getTangent(
    /** @type {string} */ worldMatrix,
    /** @type {string} */ viewMatrix,
    /** @type {string} */ tangent
) {
    return `normalize( ( ${worldMatrix} * ${viewMatrix} * vec4( ${tangent}.xyz, 0.0 ) ).xyz )`
}

function getBiTangent(
    /** @type {string} */ viewNormal,
    /** @type {string} */ viewTangent,
    /** @type {string} */ tangent
) {
    return `normalize( cross( ${viewNormal}, ${viewTangent} ) * ${tangent}.w )`
}

export const GLSL_COMMON = Object.freeze({
    alphaTest,
    baseTexture,
    positionAttribute,
    uvAttribute,
    normalAttribute,
    tangentAttribute,
    worldMatrix,
    normalMatrix,
    vertexDeclaration,
    fragmentDeclaration,

    getWorldPosition,
    getWorldNormal,
    getTangent,
    getBiTangent,

    createAttributes,
    createUniforms,
})
