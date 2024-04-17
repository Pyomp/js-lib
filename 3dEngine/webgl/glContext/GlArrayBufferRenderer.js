import { GlArrayBuffer } from "../glDescriptors/GlArrayBuffer.js"
import { GlContextRenderer } from "./GlContextRenderer.js"

export class GlArrayBufferRenderer {
    #version = 0
    #markUpdated() {
        this.#version = this.#glArrayBuffer.version
        this.#glArrayBuffer.startToUpdate = Infinity
        this.#glArrayBuffer.endToUpdate = 0
    }

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
        if (this.#glArrayBuffer.version !== this.#version) {
            this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.glBuffer)
            this.#gl.bufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, 0, this.#glArrayBuffer.arrayBuffer)
            this.#markUpdated()
        } else if (this.#glArrayBuffer.endToUpdate > this.#glArrayBuffer.startToUpdate) {
            const offset = this.#glArrayBuffer.startToUpdate
            const length = this.#glArrayBuffer.endToUpdate - offset
            
            this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.glBuffer)
            this.#gl.bufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, offset * this.#glArrayBuffer.arrayBuffer.BYTES_PER_ELEMENT, this.#glArrayBuffer.arrayBuffer, offset, length)
            this.#markUpdated()
        }
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
