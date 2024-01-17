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
}`

const computeSkinMatrix = `
mat4 ${skinMatrix} = getBoneMatrix(${joints}[0]) * ${weights}[0] +
                getBoneMatrix(${joints}[1]) * ${weights}[1] +
                getBoneMatrix(${joints}[2]) * ${weights}[2] +
                getBoneMatrix(${joints}[3]) * ${weights}[3];
`

export const GLSL_SKINNED = Object.freeze({
    jointsTexture,
    weights,
    joints,
    skinMatrix,
    declaration,
    computeSkinMatrix
})
