import { GLSL_COMMON } from "./glslCommon.js"

const positionPrefix = 'positionMorphTarget'
const normalPrefix = 'normalMorphTarget'
const influanceUniformPrefix = 'morphInfluance'

function declaration(/** @type {string[]} */ morphs) {
    let glsl = ''

    for (const name of morphs) {
        glsl += `in vec3 ${positionPrefix}${name};\n`
        glsl += `in vec3 ${normalPrefix}${name};\n`
        glsl += `uniform float ${influanceUniformPrefix}${name};\n`
    }
    
    {
        glsl += 'vec3 getMorphTargetPosition(){\n'

        glsl += `vec3 result = ${GLSL_COMMON.positionAttribute};\n`

        for (const name of morphs) {
            glsl += `result += ${positionPrefix}${name} * ${influanceUniformPrefix}${name};\n`
        }

        glsl += 'return result;}\n'
    }
    {
        glsl += 'vec3 getMorphTargetNormal(){\n'

        glsl += `vec3 result = ${GLSL_COMMON.normalAttribute};\n`

        for (const name of morphs) {
            glsl += `result += ${normalPrefix}${name} * ${influanceUniformPrefix}${name};\n`
        }

        glsl += 'return result;}\n'
    }
    return glsl
}

const getMorphTargetPosition = `getMorphTargetPosition()`
const getMorphTargetNormal = `getMorphTargetNormal()`

export const GLSL_MORPH_TARGET = Object.freeze({
    positionPrefix,
    normalPrefix,
    influanceUniformPrefix,
    declaration,
    getMorphTargetPosition,
    getMorphTargetNormal,
})
