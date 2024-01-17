import { GlUboData } from "../glDescriptors/GlUboData.js"
import { GlContext } from "./GlContext.js"

export class GlUbo {
    #version = -1

    #gl

    #glUboData

    #glUboBuffer

    #arrayBuffer

    /**
     * 
     * @param {GlContext} glContext
     * @param {GlUboData} glUboData
     */
    constructor(glContext, glUboData) {
        this.#gl = glContext.gl
        this.#glUboData = glUboData
        this.#glUboBuffer = this.#gl.createBuffer()
    }

    update() {
        if (this.#version !== this.#glUboData.version) {
            this.#version = this.#glUboData.version
            this.#gl.bindBuffer(WebGL2RenderingContext.UNIFORM_BUFFER, this.#glUboBuffer)
            if (this.#arrayBuffer !== this.#glUboData.arrayBuffer) {
                this.#arrayBuffer = this.#glUboData.arrayBuffer
                this.#gl.bufferData(WebGL2RenderingContext.UNIFORM_BUFFER, this.#arrayBuffer, this.#glUboData.usage)
            } else {
                this.#gl.bufferSubData(WebGL2RenderingContext.UNIFORM_BUFFER, 0, this.#arrayBuffer)
            }
        }
    }

    bindToIndex(index) {
        this.update()
        // question: should I bind buffer before ?
        this.#gl.bindBufferBase(WebGL2RenderingContext.UNIFORM_BUFFER, index, this.#glUboBuffer)
    }

    dispose() {
        this.#gl.deleteBuffer(this.#glUboBuffer)
    }
}
