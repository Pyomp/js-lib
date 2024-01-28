const uboName = 'ambientLightUbo'
const ambientLight = 'ambientLight'
const colorProperty = 'color'
const color = `${ambientLight}.${colorProperty}`

const fragmentDeclaration = `
struct AmbientLight {
    vec3 ${colorProperty};
};

layout(std140) uniform ${uboName} {
    AmbientLight ${ambientLight};
};
`

const uboOffset = Object.freeze({
    [colorProperty]: 0
})

const uboByteLength = 4 * 4

export const GLSL_AMBIENT_LIGHT = Object.freeze({
    uboName,
    uboOffset,
    uboByteLength,
    color,
    fragmentDeclaration
})
