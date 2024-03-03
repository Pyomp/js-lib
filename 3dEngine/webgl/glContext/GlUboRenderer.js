import { GlUbo } from "../glDescriptors/GlUbo.js"
import { GlContextRenderer } from "./GlContextRenderer.js"

export class GlUboRenderer {
    #version = -1

    #gl

    #glUbo

    #webGlUboBuffer

    #arrayBuffer

    /**
     * 
     * @param {GlContextRenderer} glContext
     * @param {GlUbo} glUbo
     */
    constructor(glContext, glUbo) {
        this.#gl = glContext.gl
        this.#glUbo = glUbo
        this.#webGlUboBuffer = this.#gl.createBuffer()
    }

    update() {
        if (this.#version !== this.#glUbo.version) {
            this.#version = this.#glUbo.version
            this.#gl.bindBuffer(WebGL2RenderingContext.UNIFORM_BUFFER, this.#webGlUboBuffer)
            if (this.#arrayBuffer !== this.#glUbo.arrayBuffer) {
                this.#arrayBuffer = this.#glUbo.arrayBuffer
                this.#gl.bufferData(WebGL2RenderingContext.UNIFORM_BUFFER, this.#arrayBuffer, this.#glUbo.usage)
                return true
            } else {
                this.#gl.bufferSubData(WebGL2RenderingContext.UNIFORM_BUFFER, 0, this.#arrayBuffer)
                return false
            }
        }
    }

    bindToIndex(index) {
        this.update()
        // question: should I bind buffer before ?
        // this.#gl.bindBuffer(WebGL2RenderingContext.UNIFORM_BUFFER, this.#webGlUboBuffer)
        this.#gl.bindBufferBase(WebGL2RenderingContext.UNIFORM_BUFFER, index, this.#webGlUboBuffer)
    }

    dispose() {
        this.#gl.deleteBuffer(this.#webGlUboBuffer)
    }
}
