import { GlArrayBufferData } from "../glDescriptors/GlArrayBufferData.js"
import { GlVaoData } from "../glDescriptors/GlVaoData.js"
import { GlContext } from "./GlContext.js"
import { GlProgram } from "./GlProgram.js"
import { typedArrayToType } from "./utils.js"

export class GlVao {
    /** @type {WebGL2RenderingContext} */ #gl
    #glContext
    /** @type {Set<GlArrayBufferData>} */ #glArrayBuffersData = new Set()

    /** @type {WebGLBuffer} */ #glIndicesBuffers

    /** @type {WebGLVertexArrayObject} */ glVao
    /** @type {number} */ indicesType = -1
    /**
     * 
     * @param {GlContext} glContext
     * @param {GlProgram} glProgram
     * @param {GlVaoData} glVaoData
     */
    constructor(glContext, glProgram, glVaoData) {
        this.#gl = glContext.gl
        this.#glContext = glContext

        this.glVao = this.#gl.createVertexArray()
        this.#gl.bindVertexArray(this.glVao)

        for (const attribute of glVaoData.attributesData) {
            const location = glProgram.getAttribLocation(attribute.name)

            if (location === -1) {
                console.info(`attribute "${attribute.name}" not in shader`)
            } else {
                this.#glArrayBuffersData.add(attribute.glArrayBufferData)
                const buffer = glContext.getGlArrayBuffer(attribute.glArrayBufferData)
                buffer.bind()
                this.#gl.enableVertexAttribArray(location)
                if (attribute.type === WebGL2RenderingContext.FLOAT) {
                    this.#gl.vertexAttribPointer(location, attribute.size, WebGL2RenderingContext.FLOAT, attribute.normalized, attribute.stride, attribute.offset)
                } else {
                    this.#gl.vertexAttribIPointer(location, attribute.size, attribute.type, attribute.stride, attribute.offset)
                }
            }
        }

        if (glVaoData.indicesUintArray) {
            this.indicesType = typedArrayToType.get(glVaoData.indicesUintArray.constructor)
            this.#glIndicesBuffers = this.#gl.createBuffer()
            this.#gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, this.#glIndicesBuffers)
            this.#gl.bufferData(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, glVaoData.indicesUintArray, WebGL2RenderingContext.STATIC_DRAW)
        }
    }

    bind() {
        this.#gl.bindVertexArray(this.glVao)
    }

    dispose() {
        this.#gl.deleteVertexArray(this.glVao)
        if (this.#glIndicesBuffers) this.#gl.deleteBuffer(this.#glIndicesBuffers)
        for (const glArrayBufferData of this.#glArrayBuffersData) {
            this.#glContext.freeGlArrayBuffer(glArrayBufferData)
        }
    }
}
