import { GlArrayBufferData } from "../glDescriptors/GlArrayBufferData.js"
import { GlTransformFeedbackData } from "../glDescriptors/GlTransformFeedbackData.js"
import { GlContext } from "./GlContext.js"

export class GlTransformFeedback {
    #glContext
    /** @type {WebGL2RenderingContext} */ #gl
    #glArrayBuffersData = new Set()

    /** @type {WebGLVertexArrayObject} */ #glTransformFeedback

    /**
     * @param {GlContext} glContext
     * @param {WebGLProgram} glProgram
     * @param {GlTransformFeedbackData} glTransformFeedbackData
     */
    constructor(glContext, glProgram, glTransformFeedbackData) {
        this.#glContext = glContext
        this.#gl = glContext.gl

        const transformFeedbackVaryingCount = this.#gl.getProgramParameter(glProgram, WebGL2RenderingContext.TRANSFORM_FEEDBACK_VARYINGS)

        this.transformFeedback = this.#gl.createTransformFeedback()
        this.#gl.bindTransformFeedback(WebGL2RenderingContext.TRANSFORM_FEEDBACK, this.#glTransformFeedback)

        if (glTransformFeedbackData.glArrayBufferData instanceof GlArrayBufferData) {
            const glArrayBuffer = glContext.getGlArrayBuffer(glTransformFeedbackData.glArrayBufferData)
            glArrayBuffer.bind()
            this.#glArrayBuffersData.add(glArrayBuffer)
            this.#gl.bindBufferBase(WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, 0, glArrayBuffer.glBuffer)
        } else {
            for (let i = 0; i < transformFeedbackVaryingCount; i++) {
                const { name } = this.#gl.getTransformFeedbackVarying(glProgram, i)
                const glArrayBuffer = glContext.getGlArrayBuffer(glTransformFeedbackData.glArrayBufferData[name])
                glArrayBuffer.bind()
                this.#glArrayBuffersData.add(glArrayBuffer)
                this.#gl.bindBufferBase(WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, i, glArrayBuffer.glBuffer)
            }
        }
    }

    bind() {
        this.#gl.bindTransformFeedback(WebGL2RenderingContext.TRANSFORM_FEEDBACK, this.#glTransformFeedback)
    }

    dispose() {
        this.#gl.deleteTransformFeedback(this.#glTransformFeedback)

        for (const glArrayBufferData of this.#glArrayBuffersData) {
            this.#glContext.freeGlArrayBuffer(glArrayBufferData)
        }
    }
}
