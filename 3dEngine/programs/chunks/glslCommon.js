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
    /** @type {Float32Array | undefined} */ position = undefined,
    /** @type {Float32Array | undefined} */ uv = undefined,
    /** @type {Float32Array | undefined} */ normal = undefined,
    /** @type {Float32Array | undefined} */ tangent = undefined,
) => {
    /** @type {GlAttribute[]} */
    const attributes = []
    if (position)
        attributes.push(new GlAttribute({ glArrayBuffer: new GlArrayBuffer(position), name: positionAttribute, size: 3, type: WebGL2RenderingContext.FLOAT }))
    if (uv)
        attributes.push(new GlAttribute({ glArrayBuffer: new GlArrayBuffer(uv), name: uvAttribute, size: 2, type: WebGL2RenderingContext.FLOAT }))
    if (normal)
        attributes.push(new GlAttribute({ glArrayBuffer: new GlArrayBuffer(normal), name: normalAttribute, size: 3, type: WebGL2RenderingContext.FLOAT }))
    if (tangent)
        attributes.push(new GlAttribute({ glArrayBuffer: new GlArrayBuffer(tangent), name: tangentAttribute, size: 3, type: WebGL2RenderingContext.FLOAT }))

    return attributes
}
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
    vertexDeclaration,
    fragmentDeclaration,

    getWorldPosition,
    getWorldNormal,
    getTangent,
    getBiTangent,

    createAttributes,
    createUniforms,
})
