
const uboName = 'forceUbo'
const forces = 'forces'
const positions = 'positions'
const MAX_FORCE_COUNT = 100

const declaration = `
layout(std140) uniform ${uboName} {
    vec3 ${positions}[${MAX_FORCE_COUNT}];
    vec3 ${forces}[${MAX_FORCE_COUNT}];
};`

const uboOffset = {
    forces: 0
}

const uboByteLength = 72 * 4

export const GLSL_FORCE = Object.freeze({
    uboOffset,
    uboByteLength,
    uboName,
    declaration
})
