import { GlTransformFeedbackData } from "../glDescriptors/GlTransformFeedbackData.js"
import { GlContext } from "./GlContext.js"

export class GlTransformFeedback {
    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {WebGLVertexArrayObject} */ transformFeedback

    /** @type {{[name: string]: WebGLBuffer}} */
    buffers = {}

    /**
     * 
     * @param {GlContext} glContext
     * @param {GlTransformFeedbackData} glTransformFeedbackData
     */
    constructor(glContext, glTransformFeedbackData) {
        this.#gl = glContext.gl

        const program = glContext.getGlProgram(glTransformFeedbackData.glProgramData)

        const transformFeedbackVaryingCount = this.#gl.getProgramParameter(program, WebGL2RenderingContext.TRANSFORM_FEEDBACK_VARYINGS)

        this.transformFeedback = this.#gl.createTransformFeedback()
        this.#gl.bindTransformFeedback(WebGL2RenderingContext.TRANSFORM_FEEDBACK, this.transformFeedback)

        for (let i = 0; i < transformFeedbackVaryingCount; i++) {
            const { name } = this.#gl.getTransformFeedbackVarying(program, i)
            const buffer = glContext.getGlArrayBuffer(glTransformFeedbackData.glArrayBufferDatas[name])
            this.#gl.bindBufferBase(this.#gl.TRANSFORM_FEEDBACK_BUFFER, i, buffer)
        }
    }

    bind() {
        this.#gl.bindTransformFeedback(WebGL2RenderingContext.TRANSFORM_FEEDBACK, this.transformFeedback)
    }

    dispose() {
        this.#gl.deleteTransformFeedback(this.transformFeedback)
        for (const buffer of Object.values(this.buffers)) {
            this.#gl.deleteBuffer(buffer)
        }
    }
}

function getSize(type) {
    if (type === WebGL2RenderingContext.FLOAT) return 1 * 4
    else if (type === WebGL2RenderingContext.FLOAT_VEC2) return 2 * 4
    else if (type === WebGL2RenderingContext.FLOAT_VEC3) return 3 * 4
    else if (type === WebGL2RenderingContext.FLOAT_VEC4) return 4 * 4
    else if (type === WebGL2RenderingContext.INT) return 1 * 4
    else if (type === WebGL2RenderingContext.INT_VEC2) return 2 * 4
    else if (type === WebGL2RenderingContext.INT_VEC3) return 3 * 4
    else if (type === WebGL2RenderingContext.INT_VEC4) return 4 * 4
    else if (type === WebGL2RenderingContext.FLOAT_MAT2) return 2 * 2 * 4
    else if (type === WebGL2RenderingContext.FLOAT_MAT3) return 3 * 3 * 4
    else if (type === WebGL2RenderingContext.FLOAT_MAT4) return 4 * 4 * 4
}
