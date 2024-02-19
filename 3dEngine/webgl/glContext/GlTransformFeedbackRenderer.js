import { GlArrayBuffer } from "../glDescriptors/GlArrayBuffer.js"
import { GlTransformFeedback } from "../glDescriptors/GlTransformFeedback.js"
import { GlContextRenderer } from "./GlContextRenderer.js"

export class GlTransformFeedbackRenderer {
    #glContext
    /** @type {WebGL2RenderingContext} */ #gl
    #glArrayBuffers = new Set()

    /** @type {WebGLVertexArrayObject} */ #glTransformFeedback

    /**
     * @param {GlContextRenderer} glContext
     * @param {WebGLProgram} glProgram
     * @param {GlTransformFeedback} glTransformFeedback
     */
    constructor(glContext, glProgram, glTransformFeedback) {
        this.#glContext = glContext
        this.#gl = glContext.gl

        const transformFeedbackVaryingCount = this.#gl.getProgramParameter(glProgram, WebGL2RenderingContext.TRANSFORM_FEEDBACK_VARYINGS)

        this.transformFeedback = this.#gl.createTransformFeedback()
        this.#gl.bindTransformFeedback(WebGL2RenderingContext.TRANSFORM_FEEDBACK, this.#glTransformFeedback)

        if (glTransformFeedback.glArrayBuffer instanceof GlArrayBuffer) {
            const glArrayBuffer = glContext.getGlArrayBuffer(glTransformFeedback.glArrayBuffer)
            glArrayBuffer.bind()
            this.#glArrayBuffers.add(glArrayBuffer)
            this.#gl.bindBufferBase(WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, 0, glArrayBuffer.glBuffer)
        } else {
            for (let i = 0; i < transformFeedbackVaryingCount; i++) {
                const { name } = this.#gl.getTransformFeedbackVarying(glProgram, i)
                const glArrayBuffer = glContext.getGlArrayBuffer(glTransformFeedback.glArrayBuffer[name])
                glArrayBuffer.bind()
                this.#glArrayBuffers.add(glArrayBuffer)
                this.#gl.bindBufferBase(WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, i, glArrayBuffer.glBuffer)
            }
        }
    }

    bind() {
        this.#gl.bindTransformFeedback(WebGL2RenderingContext.TRANSFORM_FEEDBACK, this.#glTransformFeedback)
    }

    dispose() {
        this.#gl.deleteTransformFeedback(this.#glTransformFeedback)

        for (const glArrayBuffer of this.#glArrayBuffers) {
            this.#glContext.freeGlArrayBuffer(glArrayBuffer)
        }
    }
}
