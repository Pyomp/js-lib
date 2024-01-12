import { Attribute } from "../../sceneGraph/Attribute.js"
import { GlArrayBuffer } from "./GlArrayBuffer.js"
import { GlArrayBufferData } from "../glDescriptors/GlArrayBufferData.js"
import { GlVaoData } from "../glDescriptors/GlVaoData.js"
import { typedArrayToType } from "./utils.js"

export class GlVao {
    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {WebGLVertexArrayObject} */ glVao

    // for draw
    count = 0
    hasIndices = false

    /** @type {{[name: string]: WebGLBuffer}} */
    buffers = {}

    indicesBuffers

    /** @type {Map<GlArrayBufferData, GlArrayBuffer>} */ glArrayBuffers = new Map()

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {WebGLProgram} program
     * @param {GlVaoData} glVaoData
     */
    constructor(gl, program, glVaoData) {
        this.#gl = gl

        const activeAttributeCount = gl.getProgramParameter(program, WebGL2RenderingContext.ACTIVE_ATTRIBUTES)

        this.glVao = gl.createVertexArray()
        gl.bindVertexArray(this.glVao)

        for (const arrayBufferData of glVaoData.arrayBuffersData) {
            this.glArrayBuffers.set(arrayBufferData, new GlArrayBuffer(gl, arrayBufferData))
        }

        for (const attribute of glVaoData.attributesData) {
            const location = gl.getAttribLocation(program, attribute.name)
            this.glArrayBuffers.get(attribute.glArrayBufferData).bind()
            gl.enableVertexAttribArray(location)
            if (attribute.type === WebGL2RenderingContext.FLOAT) {
                gl.vertexAttribPointer(location, attribute.size, WebGL2RenderingContext.FLOAT, attribute.normalized, attribute.stride, attribute.offset)
            } else {
                gl.vertexAttribIPointer(location, attribute.size, attribute.type, attribute.stride, attribute.offset)
            }
        }

        if (glVaoData.indicesUintArray) {
            this.hasIndices = true

            const buffer = gl.createBuffer()

            gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, buffer)
            gl.bufferData(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, glVaoData.indicesUintArray, WebGL2RenderingContext.STATIC_DRAW)

            this.indicesBuffers = buffer
        }
    }

    initGl() {

    }

    bind() {
        this.#gl.bindVertexArray(this.glVao)
    }

    dispose() {
        this.#gl.deleteVertexArray(this.glVao)
        if (this.indicesBuffers) this.#gl.deleteBuffer(this.indicesBuffers)
        for (const buffer of Object.values(this.buffers)) {
            this.#gl.deleteBuffer(buffer)
        }
    }
}

function getElementCount(type) {
    if (type === WebGL2RenderingContext.FLOAT) return 1
    else if (type === WebGL2RenderingContext.FLOAT_VEC2) return 2
    else if (type === WebGL2RenderingContext.FLOAT_VEC3) return 3
    else if (type === WebGL2RenderingContext.FLOAT_VEC4) return 4
    else if (type === WebGL2RenderingContext.INT) return 1
    else if (type === WebGL2RenderingContext.INT_VEC2) return 2
    else if (type === WebGL2RenderingContext.INT_VEC3) return 3
    else if (type === WebGL2RenderingContext.INT_VEC4) return 4
    else if (type === WebGL2RenderingContext.UNSIGNED_INT) return 1
    else if (type === WebGL2RenderingContext.UNSIGNED_INT_VEC2) return 2
    else if (type === WebGL2RenderingContext.UNSIGNED_INT_VEC3) return 3
    else if (type === WebGL2RenderingContext.UNSIGNED_INT_VEC4) return 4
    else if (type === WebGL2RenderingContext.BOOL) return 1
    else if (type === WebGL2RenderingContext.BOOL_VEC2) return 2
    else if (type === WebGL2RenderingContext.BOOL_VEC3) return 3
    else if (type === WebGL2RenderingContext.BOOL_VEC4) return 4
    else if (type === WebGL2RenderingContext.FLOAT_MAT2) return 2 * 2
    else if (type === WebGL2RenderingContext.FLOAT_MAT3) return 3 * 3
    else if (type === WebGL2RenderingContext.FLOAT_MAT4) return 4 * 4
}
