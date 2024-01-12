export class GlCapabilities {
    #gl

    /**
     * @param {WebGL2RenderingContext} gl
     */
    constructor(
        gl
    ) {
        this.#gl = gl

        gl.clearColor(0, 0, 0, 0)

        gl.enable(WebGL2RenderingContext.CULL_FACE)
        this.setFrontFace()
        gl.enable(WebGL2RenderingContext.DEPTH_TEST)
        gl.depthMask(true)
        gl.disable(WebGL2RenderingContext.BLEND)
        this.setAdditiveBlending()
    }

    setClearColor(r, g, b, a) {
        this.#gl.clearColor(r, g, b, a)
    }

    clear() {
        this.#gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT)
    }

    #cullFace = true
    get cullFace() { return this.#cullFace }
    set cullFace(value) {
        if (this.#cullFace !== value) {
            this.#cullFace = value
            if (value) {
                this.#gl.enable(WebGL2RenderingContext.CULL_FACE)
            } else {
                this.#gl.disable(WebGL2RenderingContext.CULL_FACE)
            }
        }
    }
    setFrontFace() {
        this.#gl.frontFace(WebGL2RenderingContext.CCW)
    }
    setBackFace() {
        this.#gl.frontFace(WebGL2RenderingContext.CW)
    }

    #blending = false
    get blending() { return this.#blending }
    set blending(value) {
        if (this.#blending !== value) {
            this.#blending = value
            if (value) {
                this.#gl.enable(WebGL2RenderingContext.BLEND)
            } else {
                this.#gl.disable(WebGL2RenderingContext.BLEND)
            }
        }
    }
    setNormalBlending() {
        this.#gl.blendFuncSeparate(WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA, WebGL2RenderingContext.ONE, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA)
    }
    setAdditiveBlending() {
        this.#gl.blendFunc(WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE)
    }
    setMultiplyBlending() {
        this.#gl.blendFunc(WebGL2RenderingContext.ZERO, WebGL2RenderingContext.SRC_COLOR)
    }

    #depthTest = true
    get depthTest() { return this.#depthTest }
    set depthTest(value) {
        if (this.#depthTest !== value) {
            this.#depthTest = value
            if (value) {
                this.#gl.enable(WebGL2RenderingContext.DEPTH_TEST)
            } else {
                this.#gl.disable(WebGL2RenderingContext.DEPTH_TEST)
            }
        }
    }

    #depthWrite = true
    get depthWrite() { return this.#depthWrite }
    set depthWrite(value) {
        if (this.#depthWrite !== value) {
            this.#depthWrite = value
            this.#gl.depthMask(value)
        }
    }
}
