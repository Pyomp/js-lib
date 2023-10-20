const glIndexUsed = new WeakMap()
function getIndex(gl) {
    if (!glIndexUsed.has(gl)) glIndexUsed.set(gl, new Set())
    const indexUsed = glIndexUsed.get(gl)
    let index = 0
    while (indexUsed.has(index)) {
        index++
    }
    return index
}

export class GlUbo {
    #gl
    #uboBuffer

    /**
     * 
     * @param {WebGL2RenderingContext} gl
     * @param {number} byteLength
     */
    constructor(gl, byteLength) {
        this.#gl = gl

        this.index = getIndex(this.#gl)
        glIndexUsed.get(this.#gl).add(this.index)

        this.data = new ArrayBuffer(byteLength)

        this.#uboBuffer = gl.createBuffer()
        this.#gl.bindBuffer(WebGL2RenderingContext.UNIFORM_BUFFER, this.#uboBuffer)
        this.#gl.bufferData(WebGL2RenderingContext.UNIFORM_BUFFER, this.data, WebGL2RenderingContext.DYNAMIC_DRAW)
        this.#gl.bindBufferBase(WebGL2RenderingContext.UNIFORM_BUFFER, this.index, this.#uboBuffer)
    }

    update() {
        this.#gl.bindBuffer(WebGL2RenderingContext.UNIFORM_BUFFER, this.#uboBuffer)
        this.#gl.bufferSubData(WebGL2RenderingContext.UNIFORM_BUFFER, 0, this.data)
    }

    dispose() {
        glIndexUsed.get(this.#gl).delete(this.index)
        this.#gl.deleteBuffer(this.#uboBuffer)
    }
}
