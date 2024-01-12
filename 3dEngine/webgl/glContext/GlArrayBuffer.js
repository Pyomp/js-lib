import { GlArrayBufferData } from "../glDescriptors/GlArrayBufferData.js"
import { GlContext } from "./GlContext.js"

export class GlArrayBuffer {
    /** @type {WebGLBuffer} */ glBuffer

    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {GlArrayBufferData} */ #glArrayBufferData

    /**
     * 
     * @param {GlContext} glContext
     * @param {GlArrayBufferData} glArrayBufferData
     */
    constructor(glContext, glArrayBufferData) {
        this.#gl = glContext.gl
        this.#glArrayBufferData = glArrayBufferData

        this.glBuffer = glContext.gl.createBuffer()
        this.updateBufferData()
    }

    updateBufferData() {
        this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.glBuffer)
        this.#gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, this.#glArrayBufferData.arrayBuffer, this.#glArrayBufferData.usage)
    }

    bind() {
        this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.glBuffer)
    }

    dispose() {
        this.#gl.deleteBuffer(this.glBuffer)
    }
}
