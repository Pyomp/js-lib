const positionAttribute = 'position'
const uvAttribute = 'uv'
const normalAttribute = 'normal'
const tangentAttribute = 'tangent'
const worldMatrix = 'worldMatrix'
const baseColor = 'baseColor'
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
uniform vec3 ${baseColor};
uniform sampler2D ${baseTexture};
`

/**
 * @param {string[]} matrixes 
 */
function getWorldPosition(...matrixes) {
    let matrixesString = ''
    for (const matrix of matrixes) {
        if (matrix) matrixesString += `${matrix} * `
    }

    return `${worldMatrix} * ${matrixesString} vec4(${positionAttribute}, 1.0)`
}

/**
 * @param {string[]} matrixes 
 */
function getWorldNormal(...matrixes) {
    return `mat3(${[worldMatrix, ...matrixes.filter(s => s)].join(' * ')}) * ${normalAttribute}`
}

function getTangent(worldMatrix, viewMatrix, tangent) {
    return `normalize( ( ${worldMatrix} * ${viewMatrix} * vec4( ${tangent}.xyz, 0.0 ) ).xyz )`
}

function getBiTangent(viewNormal, viewTangent, tangent) {
    return `normalize( cross( ${viewNormal}, ${viewTangent} ) * ${tangent}.w )`
}

export const GLSL_COMMON = Object.freeze({
    alphaTest,
    baseColor,
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
    getBiTangent
})
