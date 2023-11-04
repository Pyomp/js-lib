import { Attribute } from "../sceneGraph/Attribute.js"
import { typedArrayToType } from "./utils.js"

export class GlVao {
    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {WebGLVertexArrayObject} */ vao

    /** @type {{[attributeName: string]: (data, offset?: number) => void}} */
    attributeUpdate = {}
    indicesUpdate(data, offset = 0) { }

    // for draw
    count = 0
    hasIndices = false

    /** @type {{[name: string]: WebGLBuffer}} */
    buffers = {}

    indicesBuffers


    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {WebGLProgram} program
     * @param {{[attributeName: string]: Attribute}} attributes ex: point count
     * @param {Uint16Array?} indices
     */
    constructor(gl, program, attributes, indices = undefined) {
        this.#gl = gl

        const activeAttributeCount = gl.getProgramParameter(program, WebGL2RenderingContext.ACTIVE_ATTRIBUTES)

        this.vao = gl.createVertexArray()
        gl.bindVertexArray(this.vao)

        for (let i = 0; i < activeAttributeCount; i++) {
            const { type, name } = gl.getActiveAttrib(program, i)

            const size = getElementCount(type)

            const data = attributes[name].data

            this.count = data.length / size

            const location = gl.getAttribLocation(program, name)



            const buffer = gl.createBuffer()
            gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, buffer)
            gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, data, WebGL2RenderingContext[attributes[name].usage || 'STATIC_DRAW'])
            gl.enableVertexAttribArray(location)

            if (data instanceof Float32Array) {
                gl.vertexAttribPointer(location, size, WebGL2RenderingContext.FLOAT, false, 0, 0,)
            } else {
                gl.vertexAttribIPointer(location, size, typedArrayToType.get(data.constructor), 0, 0)
            }

            this.attributeUpdate[name] = (data, offset = 0) => {
                gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, buffer)
                gl.bufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, offset, data)
            }

            this.buffers[name] = buffer
        }

        if (indices) {
            this.hasIndices = true

            const buffer = gl.createBuffer()

            gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, buffer)
            gl.bufferData(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, indices, WebGL2RenderingContext.STATIC_DRAW)

            this.indices = (data, offset = 0) => {
                gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, buffer)
                gl.bufferSubData(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, offset, data)
            }

            this.count = indices.length

            this.indicesBuffers = buffer
        }
    }

    initGl() {

    }

    bind() {
        this.#gl.bindVertexArray(this.vao)
    }

    dispose() {
        this.#gl.deleteVertexArray(this.vao)
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
