const positionAttribute = 'position'
const uvAttribute = 'uv'
const normalAttribute = 'normal'
const tangentAttribute = 'tangent'
const worldMatrix = 'worldMatrix'
const baseColor = 'baseColor'
const baseTexture = 'baseTexture'

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

export const GLSL_COMMON = Object.freeze({
    baseColor,
    baseTexture,
    positionAttribute,
    uvAttribute,
    normalAttribute,
    tangentAttribute,
    worldMatrix,
    vertexDeclaration,
    fragmentDeclaration
})
