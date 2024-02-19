import { GlArrayBuffer } from "../glDescriptors/GlArrayBuffer.js"
import { GlVao } from "../glDescriptors/GlVao.js"
import { GlContextRenderer } from "./GlContextRenderer.js"
import { GlProgramRenderer } from "./GlProgramRenderer.js"
import { typedArrayToType } from "./utils.js"

export class GlVaoRenderer {
    /** @type {WebGL2RenderingContext} */ #gl
    #glContext
    /** @type {Set<GlArrayBuffer>} */ #glArrayBuffers = new Set()

    /** @type {WebGLBuffer} */ #glIndicesBuffers

    /** @type {WebGLVertexArrayObject} */ #webGlVao
    /** @type {number} */ indicesType = -1
    /**
     * 
     * @param {GlContextRenderer} glContext
     * @param {GlProgramRenderer} glProgram
     * @param {GlVao} glVao
     */
    constructor(glContext, glProgram, glVao) {
        this.#gl = glContext.gl
        this.#glContext = glContext

        this.#webGlVao = this.#gl.createVertexArray()
        this.#gl.bindVertexArray(this.#webGlVao)

        for (const attribute of glVao.attributes) {
            const location = glProgram.getAttribLocation(attribute.name)

            if (location === -1) {
                console.info(`attribute "${attribute.name}" not in shader`)
            } else {
                this.#glArrayBuffers.add(attribute.glArrayBuffer)
                const buffer = glContext.getGlArrayBuffer(attribute.glArrayBuffer)
                buffer.bind()
                this.#gl.enableVertexAttribArray(location)
                if (attribute.type === WebGL2RenderingContext.FLOAT) {
                    this.#gl.vertexAttribPointer(location, attribute.size, WebGL2RenderingContext.FLOAT, attribute.normalized, attribute.stride, attribute.offset)
                } else {
                    this.#gl.vertexAttribIPointer(location, attribute.size, attribute.type, attribute.stride, attribute.offset)
                }
            }
        }

        if (glVao.indicesUintArray) {
            this.indicesType = typedArrayToType.get(glVao.indicesUintArray.constructor)
            this.#glIndicesBuffers = this.#gl.createBuffer()
            this.#gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, this.#glIndicesBuffers)
            this.#gl.bufferData(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, glVao.indicesUintArray, WebGL2RenderingContext.STATIC_DRAW)
        }
    }

    updateBufferSubData() {
        for (const glArrayBufferData of this.#glArrayBuffers) {
            this.#glContext.getGlArrayBuffer(glArrayBufferData).updateBufferSubData()
        }
    }

    bind() {
        this.#gl.bindVertexArray(this.#webGlVao)
    }

    dispose() {
        this.#gl.deleteVertexArray(this.#webGlVao)
        if (this.#glIndicesBuffers) this.#gl.deleteBuffer(this.#glIndicesBuffers)
        for (const glArrayBufferData of this.#glArrayBuffers) {
            this.#glContext.freeGlArrayBuffer(glArrayBufferData)
        }
    }
}
