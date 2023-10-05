export class GlVao {
    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {WebGLVertexArrayObject} */ vao

    attributes = {}

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {WebGLProgram} program
     * @param {number} count ex: point count
     * @param {boolean} indices
     */
    constructor(gl, program, count, indices = false) {
        this.#gl = gl

        const activeAttributeCount = gl.getProgramParameter(program, WebGL2RenderingContext.ACTIVE_ATTRIBUTES)

        this.vao = gl.createVertexArray()
        gl.bindVertexArray(this.vao)

        for (let i = 0; i < activeAttributeCount; i++) {
            const { type, name, size } = gl.getActiveAttrib(program, i)

            const location = gl.getAttribLocation(program, name)

            const buffer = gl.createBuffer()
            gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, buffer)
            gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, count * size, WebGL2RenderingContext.STATIC_DRAW)
            gl.enableVertexAttribArray(location)

            if (type === WebGL2RenderingContext.FLOAT) {
                gl.vertexAttribPointer(location, size, type, false, 0, 0,)
            } else {
                gl.vertexAttribIPointer(location, size, type, 0, 0)
            }


            this.attributes[name] = {
                update: (data, offset = 0) => {
                    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, buffer)
                    gl.bufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, offset, data)
                },
                dispose: () => { gl.deleteBuffer(buffer) }
            }
        }

        if (indices) {
            const buffer = gl.createBuffer()

            gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, buffer)
            gl.bufferData(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, count * 3, WebGL2RenderingContext.STATIC_DRAW)

            this.indices = {
                update: (data, offset = 0) => {
                    gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, buffer)
                    gl.bufferSubData(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, offset, data)
                },
                dispose: () => { gl.deleteBuffer(buffer) }
            }
        }
    }

    bind() {
        this.#gl.bindVertexArray(this.vao)
    }

    dispose() {
        this.#gl.deleteVertexArray(this.vao)

        for (const key in this.attributes) {
            this.attributes[key].dispose()
        }

        this.indices?.dispose()
    }
}
