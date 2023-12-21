import { Attribute } from "../sceneGraph/Attribute.js"
import { GlTransformFeedback } from "./GlTransformFeedback.js"
import { GlUbo } from "./GlUbo.js"
import { GlVao } from "./GlVao.js"

export class GlProgram {
    /** @type {{[uniformName: string]: ((data: number | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4 | Color) => void)}} */
    uniformUpdate = {}
    /** @type {{[textureName: string]: number}} */
    textureUnit = {}

    /** @type {WebGL2RenderingContext} */
    #gl
    /** @type {WebGLProgram} */
    program

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {string} vertexShader 
     * @param {string} fragmentShader 
     * @param {{
     *      uboIndex?: {[UboName: string]: number},
     *      outVaryings?: string[]
     * }} options
     */
    constructor(gl, vertexShader, fragmentShader, options = {
        uboIndex: {},
        outVaryings: [],
    }) {
        this.#gl = gl

        const glVertexShader = createShader(gl, WebGL2RenderingContext.VERTEX_SHADER, vertexShader)
        const glFragmentShader = createShader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, fragmentShader)

        const program = createProgram(gl, glVertexShader, glFragmentShader, options.outVaryings)

        this.program = program
        gl.detachShader(program, glVertexShader)
        gl.deleteShader(glVertexShader)
        gl.detachShader(program, glFragmentShader)
        gl.deleteShader(glFragmentShader)

        { // uniforms setup
            gl.useProgram(program)

            const activeUboCount = gl.getProgramParameter(program, WebGL2RenderingContext.ACTIVE_UNIFORM_BLOCKS)

            const uniformIndexFromUbo = []

            const uboIndex = options.uboIndex
            for (let i = 0; i < activeUboCount; i++) {
                const name = gl.getActiveUniformBlockName(program, i)
                if (uboIndex[name] !== undefined) {
                    gl.uniformBlockBinding(program, i, uboIndex[name])
                    uniformIndexFromUbo.push(...gl.getActiveUniformBlockParameter(program, i, WebGL2RenderingContext.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES))
                }
            }

            const activeUniformCount = gl.getProgramParameter(program, WebGL2RenderingContext.ACTIVE_UNIFORMS)

            let unit = 0

            for (let i = 0; i < activeUniformCount; i++) {
                if (uniformIndexFromUbo.includes(i)) continue

                const { type, name } = gl.getActiveUniform(program, i)

                if (type === WebGL2RenderingContext.SAMPLER_2D || type === WebGL2RenderingContext.SAMPLER_CUBE || type === WebGL2RenderingContext.UNSIGNED_INT_SAMPLER_2D) {
                    gl.uniform1i(gl.getUniformLocation(program, name), unit)
                    this.textureUnit[name] = WebGL2RenderingContext[`TEXTURE${unit}`]
                    unit++
                } else {
                    this.uniformUpdate[name] = createUniformUpdateFunction[type](gl, gl.getUniformLocation(program, name))
                }
            }
        }
    }

    /**
     * 
     * @param {{[attributeName: string]: Attribute}} attributes 
     * @param {Uint8Array | Uint16Array | Uint32Array} indices 
     * @returns 
     */
    createVao(attributes, indices = undefined) {
        return new GlVao(this.#gl, this.program, attributes, indices)
    }

    /**
     * 
     * @param {number} count 
     * @param {{[name: string]: WebGLBuffer}} buffers 
     * @returns 
     */
    createTransformFeedback(count, buffers) {
        return new GlTransformFeedback(this.#gl, this.program, count, buffers)
    }

    useProgram() {
        this.#gl.useProgram(this.program)
    }

    dispose() {
        this.#gl.deleteProgram(this.program)
    }
}

/////////////////////// Program /////////////////////////////

/**
 * @param {WebGL2RenderingContext} gl 
 * @param {WebGLShader} vertexShader 
 * @param {WebGLShader} fragmentShader 
 * @param {string[]} outVaryings 
 */
function createProgram(gl, vertexShader, fragmentShader, outVaryings = []) {
    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)

    if (outVaryings.length > 0) {
        gl.transformFeedbackVaryings(program, outVaryings, gl.SEPARATE_ATTRIBS)
    }

    gl.linkProgram(program)

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program
    } else {
        console.warn(gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
    }
}

/**
 * @param {WebGL2RenderingContext} gl 
 * @param {number} type 
 * @param {string} source 
 */
function createShader(gl, type, source) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader
    } else {
        console.warn(('\n' + source).split('\n').map((glslLine, lineNumber) => `${lineNumber} ${glslLine}`).join('\n'))
        const error = gl.getShaderInfoLog(shader)
        console.warn(error)
        gl.deleteShader(shader)
        throw error
    }
}

const createUniformUpdateFunction = {
    [WebGL2RenderingContext.FLOAT]: (gl, location) => {
        let lastData = 0
        return (/** @type {number} */ data) => { if (lastData != data) { lastData = data; gl.uniform1f(location, lastData) } }
    },
    [WebGL2RenderingContext.FLOAT_VEC2]: (gl, location) => {
        let lastData = new Float32Array(2)
        return (/** @type {Vector2} */ vector2) => {
            if (lastData[0] !== vector2.x || lastData[1] !== vector2.y) {
                lastData[0] = vector2.x; lastData[1] = vector2.y
                gl.uniform2fv(location, lastData)
            }
        }
    },
    [WebGL2RenderingContext.FLOAT_VEC3]: (gl, location) => {
        let lastData = new Float32Array(3)
        return (/** @type {Vector3} */ vector3) => {
            if (lastData[0] !== vector3.x || lastData[1] !== vector3.y || lastData[2] !== vector3.z) {
                lastData[0] = vector3.x; lastData[1] = vector3.y; lastData[2] = vector3.z
                gl.uniform3fv(location, lastData)
            }
        }
    },
    [WebGL2RenderingContext.FLOAT_VEC4]: (gl, location) => {
        let lastData = new Float32Array(4)
        return (/** @type {Vector4} */ vector4) => {
            if (lastData[0] !== vector4.x || lastData[1] !== vector4.y || lastData[2] !== vector4.z || lastData[3] !== vector4.w) {
                lastData[0] = vector4.x; lastData[1] = vector4.y; lastData[2] = vector4.z; lastData[3] = vector4.w
                gl.uniform4fv(location, lastData)
            }
        }
    },
    [WebGL2RenderingContext.INT]: (gl, location) => {
        let lastData = 0
        return (/** @type {number} */ data) => { if (lastData != data) { lastData = data; gl.uniform1i(location, lastData) } }
    },
    [WebGL2RenderingContext.INT_VEC2]: (gl, location) => {
        let lastData = new Int32Array(2)
        return (/** @type {Vector2} */ vector2) => {
            if (lastData[0] !== vector2.x || lastData[1] !== vector2.y) {
                lastData[0] = vector2.x; lastData[1] = vector2.y
                gl.uniform2iv(location, lastData)
            }
        }
    },
    [WebGL2RenderingContext.INT_VEC3]: (gl, location) => {
        let lastData = new Int32Array(3)
        return (/** @type {Vector3} */ vector3) => {
            if (lastData[0] !== vector3.x || lastData[1] !== vector3.y || lastData[2] !== vector3.z) {
                lastData[0] = vector3.x; lastData[1] = vector3.y; lastData[2] = vector3.z
                gl.uniform3iv(location, lastData)
            }
        }
    },
    [WebGL2RenderingContext.INT_VEC4]: (gl, location) => {
        let lastData = new Int32Array(4)
        return (/** @type {Vector4} */ vector4) => {
            if (lastData[0] !== vector4.x || lastData[1] !== vector4.y || lastData[2] !== vector4.z || lastData[3] !== vector4.w) {
                lastData[0] = vector4.x; lastData[1] = vector4.y; lastData[2] = vector4.z; lastData[3] = vector4.w
                gl.uniform4iv(location, lastData)
            }
        }
    },
    [WebGL2RenderingContext.BOOL]: (gl, location) => (data) => { gl.uniform1i(location, data) },
    [WebGL2RenderingContext.BOOL_VEC2]: (gl, location) => (data) => { gl.uniform2iv(location, data) },
    [WebGL2RenderingContext.BOOL_VEC3]: (gl, location) => (data) => { gl.uniform3iv(location, data) },
    [WebGL2RenderingContext.BOOL_VEC4]: (gl, location) => (data) => { gl.uniform4iv(location, data) },
    [WebGL2RenderingContext.FLOAT_MAT2]: (gl, location) => (data) => { gl.uniformMatrix2fv(location, false, data) },
    [WebGL2RenderingContext.FLOAT_MAT3]: (gl, location) => {
        let lastData = new Float32Array(9)

        return (/** @type {Matrix3} */ matrix3) => {
            const matrix3Array = matrix3.elements
            if (
                lastData[0] !== matrix3Array[0]
                || lastData[1] !== matrix3Array[1]
                || lastData[2] !== matrix3Array[2]
                || lastData[3] !== matrix3Array[3]
                || lastData[4] !== matrix3Array[4]
                || lastData[5] !== matrix3Array[5]
                || lastData[6] !== matrix3Array[6]
                || lastData[7] !== matrix3Array[7]
                || lastData[8] !== matrix3Array[8]
            ) {
                lastData.set(matrix3Array)
                gl.uniformMatrix3fv(location, false, lastData)
            }
        }
    },
    [WebGL2RenderingContext.FLOAT_MAT4]: (gl, location) => {
        let lastData = new Float32Array(16)

        return (/** @type {Matrix4} */ matrix4) => {
            const matrix4Array = matrix4.elements
            if (
                lastData[12] !== matrix4Array[12]
                || lastData[13] !== matrix4Array[13]
                || lastData[14] !== matrix4Array[14]
                || lastData[0] !== matrix4Array[0]
                || lastData[1] !== matrix4Array[1]
                || lastData[2] !== matrix4Array[2]
                || lastData[3] !== matrix4Array[3]
                || lastData[4] !== matrix4Array[4]
                || lastData[5] !== matrix4Array[5]
                || lastData[6] !== matrix4Array[6]
                || lastData[7] !== matrix4Array[7]
                || lastData[8] !== matrix4Array[8]
                || lastData[9] !== matrix4Array[9]
                || lastData[10] !== matrix4Array[10]
                || lastData[11] !== matrix4Array[11]
                || lastData[15] !== matrix4Array[15]
            ) {
                lastData.set(matrix4Array)
                gl.uniformMatrix4fv(location, false, lastData)
            }
        }
    },
}

/** I keep it there for information, it is when data is an array (not a vector3 from math lib)*/
const createUniformUpdateFunctionByArray = {
    [WebGL2RenderingContext.FLOAT]: (gl, location) => (data) => { gl.uniform1f(location, data) },
    [WebGL2RenderingContext.FLOAT_VEC2]: (gl, location) => (data) => { gl.uniform2fv(location, data) },
    [WebGL2RenderingContext.FLOAT_VEC3]: (gl, location) => (data) => { gl.uniform3fv(location, data) },
    [WebGL2RenderingContext.FLOAT_VEC4]: (gl, location) => (data) => { gl.uniform4fv(location, data) },
    [WebGL2RenderingContext.INT]: (gl, location) => (data) => { gl.uniform1i(location, data) },
    [WebGL2RenderingContext.INT_VEC2]: (gl, location) => (data) => { gl.uniform2iv(location, data) },
    [WebGL2RenderingContext.INT_VEC3]: (gl, location) => (data) => { gl.uniform3iv(location, data) },
    [WebGL2RenderingContext.INT_VEC4]: (gl, location) => (data) => { gl.uniform4iv(location, data) },
    [WebGL2RenderingContext.BOOL]: (gl, location) => (data) => { gl.uniform1i(location, data) },
    [WebGL2RenderingContext.BOOL_VEC2]: (gl, location) => (data) => { gl.uniform2iv(location, data) },
    [WebGL2RenderingContext.BOOL_VEC3]: (gl, location) => (data) => { gl.uniform3iv(location, data) },
    [WebGL2RenderingContext.BOOL_VEC4]: (gl, location) => (data) => { gl.uniform4iv(location, data) },
    [WebGL2RenderingContext.FLOAT_MAT2]: (gl, location) => (data) => { gl.uniformMatrix2fv(location, false, data) },
    [WebGL2RenderingContext.FLOAT_MAT3]: (gl, location) => (data) => { gl.uniformMatrix3fv(location, false, data) },
    [WebGL2RenderingContext.FLOAT_MAT4]: (gl, location) => (data) => { gl.uniformMatrix4fv(location, false, data) },
}
