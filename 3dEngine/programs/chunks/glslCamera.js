const uboName = 'cameraUbo'
const viewMatrix = 'viewMatrix'
const projectionMatrix = 'projectionMatrix'
const projectionViewMatrix = 'projectionViewMatrix'
const projectionViewMatrixInverse = 'projectionViewMatrixInverse'
const position = 'cameraPosition'
const near = 'near'
const far = 'far'

const declaration = `
layout(std140) uniform ${uboName} {
    mat4 ${viewMatrix};
    mat4 ${projectionMatrix};
    mat4 ${projectionViewMatrix};
    mat4 ${projectionViewMatrixInverse};
    vec3 ${position};
    float ${near};
    float ${far};
};`

const uboOffset = {
    viewMatrix: 0,
    projectionMatrix: 16,
    projectionViewMatrix: 32,
    projectionViewMatrixInverse: 48,
    position: 64,
    near: 67,
    far: 68,
}

const uboByteLength = 69 * 4

export const GLSL_CAMERA = Object.freeze({
    uboOffset,
    uboByteLength,
    uboName,
    viewMatrix,
    projectionMatrix,
    projectionViewMatrix,
    projectionViewMatrixInverse,
    position,
    near,
    far,
    declaration
})
