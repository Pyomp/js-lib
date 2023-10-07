let index = 0
export class GlUbo {
    #gl
    #uboBuffer
    constructor(gl, name, shader) {
        this.#gl = gl

        this.shader = shader
        this.name = name
        this.index = index++

        this.#uboBuffer = gl.createBuffer()
    }

    update(data) {
        this.#gl.bindBuffer(WebGL2RenderingContext.UNIFORM_BUFFER, this.#uboBuffer)
        this.#gl.bufferData(WebGL2RenderingContext.UNIFORM_BUFFER, data, WebGL2RenderingContext.DYNAMIC_DRAW)
        this.#gl.bindBufferBase(WebGL2RenderingContext.UNIFORM_BUFFER, this.index, this.#uboBuffer)
    }
}

// uniform ${UboCameraName} {
//     mat4 u_projectionViewMatrix;
//     mat4 u_viewMatrix;
//     mat4 u_projectionMatrix;
//     vec3 u_cameraPosition;
// };
