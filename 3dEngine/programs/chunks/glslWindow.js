const uboName = 'windowUbo'
const resolution = 'resolution'
const pointer = 'pointer'

const declaration = `
layout(std140) uniform ${uboName} {
    vec2 ${resolution};
    vec2 ${pointer};
};`

const uboOffset = Object.freeze({
    resolution: 0,
    pointer: 2,
})

const uboByteLength = 4 * 4

export const GLSL_WINDOW = Object.freeze({
    uboOffset,
    uboByteLength,
    uboName,
    resolution,
    pointer,
    declaration
})
