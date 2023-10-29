export class GlTransformFeedback {
    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {WebGLVertexArrayObject} */ transformFeedback

    /** @type {{[name: string]: WebGLBuffer}} */
    buffers = {}

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {WebGLProgram} program
     * @param {number} count
     * @param {{[name: string]: WebGLBuffer}} buffers
     */
    constructor(gl, program, count, buffers = {}) {
        this.#gl = gl

        const transformFeedbackVaryingCount = gl.getProgramParameter(program, WebGL2RenderingContext.TRANSFORM_FEEDBACK_VARYINGS)

        this.transformFeedback = gl.createTransformFeedback()
        gl.bindTransformFeedback(WebGL2RenderingContext.TRANSFORM_FEEDBACK, this.transformFeedback)

        for (let i = 0; i < transformFeedbackVaryingCount; i++) {
            const { name, type } = gl.getTransformFeedbackVarying(program, i)

            const size = getSize(type)

            const buffer = buffers[name] || gl.createBuffer()

            if (!buffers[name]) {
                this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, buffer)
                this.#gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, count * size, WebGL2RenderingContext.DYNAMIC_COPY)
                this.buffers[name] = buffer
            }

            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, i, buffer)
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
