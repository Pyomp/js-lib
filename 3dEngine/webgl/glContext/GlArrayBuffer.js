import { GlArrayBufferData } from "../glDescriptors/GlArrayBufferData.js"
import { GlContext } from "./GlContext.js"

export class GlArrayBuffer {
    #version = 0

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

    updateBufferSubData() {
        // TODO _optimization_ multiple range updates
        if (this.#glArrayBufferData.version !== this.#version) {

            this.#version = this.#glArrayBufferData.version
            this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.glBuffer)
            this.#gl.bufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, 0, this.#glArrayBufferData.arrayBuffer)
        }
    }

    updateBufferSubDataRange(offset, length) {
        this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.glBuffer)
        // this.#gl.bufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, 0, this.#glArrayBufferData.arrayBuffer)
        this.#gl.bufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, offset * this.#glArrayBufferData.arrayBuffer.BYTES_PER_ELEMENT, this.#glArrayBufferData.arrayBuffer, offset, length)
    }

    updateBufferData() {
        this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.glBuffer)
        this.#gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, this.#glArrayBufferData.arrayBuffer, this.#glArrayBufferData.usage)
    }

    bind() {
        this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.glBuffer)
    }

    /**
     * 
     * @param {GlArrayBuffer} glArrayBufferTarget 
     * @param {number} readOffset 
     * @param {number} writeOffset 
     * @param {number} size 
     */
    copyTo(glArrayBufferTarget, readOffset = 0, writeOffset = readOffset, size = this.#glArrayBufferData.arrayBuffer.byteLength - readOffset) {
        this.#gl.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, this.glBuffer)
        this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, glArrayBufferTarget.glBuffer)
        this.#gl.copyBufferSubData(WebGL2RenderingContext.COPY_READ_BUFFER, WebGL2RenderingContext.ARRAY_BUFFER, readOffset, writeOffset, size)
    }

    dispose() {
        this.#gl.deleteBuffer(this.glBuffer)
    }
}
