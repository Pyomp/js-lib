import { GlContext } from "./GlContext.js"
import { GlProgramData } from "../glDescriptors/GlProgramData.js"
import { GlVaoData } from "../glDescriptors/GlVaoData.js"
import { GlVao } from "./GlVao.js"
import { GlTransformFeedback } from "./GlTransformFeedback.js"

export class GlProgram {
    #version = -1

    /** @type {{[uniformName: string]: ((data: number | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4 | Color) => void)}} */
    uniformUpdate = {}
    /** @type {{[textureName: string]: number}} */
    textureUnit = {}
    /** @type {{[uboName: string]: number}} */
    uboIndex = {}

    #glProgramData

    /** @type {WebGL2RenderingContext} */
    #gl
    #glContext
    #glProgram
    #globalUboIndex
    /** @type {GlTransformFeedback} */
    #glTransformFeedback

    /**
     * 
     * @param {GlContext} glContext
     * @param {GlProgramData} glProgramData 
     * @param {{[uboUniformName: string]: number }} globalUboIndex
     */
    constructor(glContext, glProgramData, globalUboIndex) {
        this.#glContext = glContext
        this.#gl = glContext.gl
        this.#glProgramData = glProgramData
        this.#glProgram = this.#gl.createProgram()
        this.#globalUboIndex = globalUboIndex
    }

    #linkProgram() {
        // console.log(this.#glProgramData.vertexShader())
        // console.log(this.#glProgramData.fragmentShader())
        const glVertexShader = createShader(this.#gl, WebGL2RenderingContext.VERTEX_SHADER, this.#glProgramData.vertexShader())
        const glFragmentShader = createShader(this.#gl, WebGL2RenderingContext.FRAGMENT_SHADER, this.#glProgramData.fragmentShader())

        this.#gl.attachShader(this.#glProgram, glVertexShader)
        this.#gl.attachShader(this.#glProgram, glFragmentShader)

        if (this.#glProgramData.glTransformFeedbackData) {
            this.#gl.transformFeedbackVaryings(
                this.#glProgram,
                this.#glProgramData.glTransformFeedbackData.outVaryings,
                this.#glProgramData.glTransformFeedbackData.bufferMode
            )

            this.#glTransformFeedback = new GlTransformFeedback(this.#glContext, this.#glProgram, this.#glProgramData.glTransformFeedbackData)
        }

        this.#gl.linkProgram(this.#glProgram)

        if (!this.#gl.getProgramParameter(this.#glProgram, WebGL2RenderingContext.LINK_STATUS)) {
            console.warn(this.#gl.getProgramInfoLog(this.#glProgram))
            this.#gl.deleteProgram(this.#glProgram)
        }

        this.#gl.detachShader(this.#glProgram, glVertexShader)
        this.#gl.deleteShader(glVertexShader)
        this.#gl.detachShader(this.#glProgram, glFragmentShader)
        this.#gl.deleteShader(glFragmentShader)
    }

    bindTransformFeedback() {
        this.#glTransformFeedback.bind()
    }

    #setupUniform() {
        this.#gl.useProgram(this.#glProgram)

        const activeUboCount = this.#gl.getProgramParameter(this.#glProgram, WebGL2RenderingContext.ACTIVE_UNIFORM_BLOCKS)

        const uniformIndexFromGlobalUbos = []

        let uboIndex = Object.keys(this.#globalUboIndex).length

        for (let i = 0; i < activeUboCount; i++) {
            const name = this.#gl.getActiveUniformBlockName(this.#glProgram, i)
            if (name in this.#globalUboIndex) {
                this.#gl.uniformBlockBinding(this.#glProgram, i, this.#globalUboIndex[name])
                uniformIndexFromGlobalUbos.push(...this.#gl.getActiveUniformBlockParameter(this.#glProgram, i, WebGL2RenderingContext.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES))
            } else {
                this.#gl.uniformBlockBinding(this.#glProgram, i, uboIndex)
                this.uboIndex[name] = uboIndex
                uboIndex++
            }
        }

        const activeUniformCount = this.#gl.getProgramParameter(this.#glProgram, WebGL2RenderingContext.ACTIVE_UNIFORMS)

        let unit = 0

        for (let i = 0; i < activeUniformCount; i++) {
            if (uniformIndexFromGlobalUbos.includes(i)) continue

            const { type, name } = this.#gl.getActiveUniform(this.#glProgram, i)

            if (type === WebGL2RenderingContext.SAMPLER_2D || type === WebGL2RenderingContext.SAMPLER_CUBE || type === WebGL2RenderingContext.UNSIGNED_INT_SAMPLER_2D) {
                this.#gl.uniform1i(this.#gl.getUniformLocation(this.#glProgram, name), unit)
                this.textureUnit[name] = WebGL2RenderingContext[`TEXTURE${unit}`]
                unit++
            } else {
                this.uniformUpdate[name] = createUniformUpdateFunction[type](this.#gl, this.#gl.getUniformLocation(this.#glProgram, name))
            }
        }
    }

    getActiveAttributes() {
        return this.#gl.getProgramParameter(this.#glProgram, WebGL2RenderingContext.ACTIVE_ATTRIBUTES)
    }

    getAttribLocation(attributeName) {
        return this.#gl.getAttribLocation(this.#glProgram, attributeName)
    }

    updateProgram() {
        this.#linkProgram()
        this.#setupUniform()
    }

    useProgram() {
        if (this.#version !== this.#glProgramData.version) {
            this.#version = this.#glProgramData.version
            this.updateProgram()
        } else {
            this.#gl.useProgram(this.#glProgram)
        }
    }

    /** @type {Map<GlVaoData, GlVao>} */ #vaos = new Map()
    getGlVao(/** @type {GlVaoData} */ glVaoData) {
        if (!this.#vaos.has(glVaoData)) {
            this.#vaos.set(glVaoData, new GlVao(this.#glContext, this, glVaoData))
        }
        return this.#vaos.get(glVaoData)
    }
    freeGlVao(/** @type {GlVaoData} */ glVaoData) {
        this.#vaos.get(glVaoData)?.dispose()
        this.#vaos.delete(glVaoData)
    }
    freeAllGlVao() {
        for (const vao of this.#vaos.values()) vao.dispose()
        this.#vaos.clear()
    }

    updateVaoCache() {
        for (const [vao, glVao] of this.#vaos) {
            if (vao.needsDelete) {
                glVao.dispose()
                this.#vaos.delete(vao)
            }
        }
    }

    dispose() {
        this.#gl.deleteProgram(this.#glProgram)
        this.freeAllGlVao()
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
    if (gl.getShaderParameter(shader, WebGL2RenderingContext.COMPILE_STATUS)) {
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
