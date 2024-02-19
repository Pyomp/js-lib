import { GlArrayBuffer } from "../glDescriptors/GlArrayBuffer.js"
import { GlContextRenderer } from "./GlContextRenderer.js"

export class GlArrayBufferRenderer {
    #version = 0

    /** @type {WebGLBuffer} */ glBuffer

    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {GlArrayBuffer} */ #glArrayBuffer

    /**
     * 
     * @param {GlContextRenderer} glContext
     * @param {GlArrayBuffer} glArrayBuffer
     */
    constructor(glContext, glArrayBuffer) {
        this.#gl = glContext.gl
        this.#glArrayBuffer = glArrayBuffer

        this.glBuffer = glContext.gl.createBuffer()
        this.updateBufferData()
    }

    updateBufferSubData() {
        // TODO _optimization_ multiple range updates
        if (this.#glArrayBuffer.version !== this.#version) {

            this.#version = this.#glArrayBuffer.version
            this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.glBuffer)
            this.#gl.bufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, 0, this.#glArrayBuffer.arrayBuffer)
        }
    }

    updateBufferSubDataRange(offset, length) {
        this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.glBuffer)
        // this.#gl.bufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, 0, this.#glArrayBufferData.arrayBuffer)
        this.#gl.bufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, offset * this.#glArrayBuffer.arrayBuffer.BYTES_PER_ELEMENT, this.#glArrayBuffer.arrayBuffer, offset, length)
    }

    updateBufferData() {
        this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.glBuffer)
        this.#gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, this.#glArrayBuffer.arrayBuffer, this.#glArrayBuffer.usage)
    }

    bind() {
        this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.glBuffer)
    }

    /**
     * 
     * @param {GlArrayBufferRenderer} glArrayBufferTarget 
     * @param {number} readOffset 
     * @param {number} writeOffset 
     * @param {number} size 
     */
    copyTo(glArrayBufferTarget, readOffset = 0, writeOffset = readOffset, size = this.#glArrayBuffer.arrayBuffer.byteLength - readOffset) {
        this.#gl.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, this.glBuffer)
        this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, glArrayBufferTarget.glBuffer)
        this.#gl.copyBufferSubData(WebGL2RenderingContext.COPY_READ_BUFFER, WebGL2RenderingContext.ARRAY_BUFFER, readOffset, writeOffset, size)
    }

    dispose() {
        this.#gl.deleteBuffer(this.glBuffer)
    }
}
