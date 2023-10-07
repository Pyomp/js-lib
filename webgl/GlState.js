export class GlState {
    /** @type {WebGL2RenderingContext} */ #gl

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     */
    constructor(gl) {
        this.#gl = gl

        this.#gl.enable(this.#gl.CULL_FACE)
        this.setFrontFace()
        this.#gl.enable(this.#gl.DEPTH_TEST)
        this.#gl.depthMask(true)
        this.#gl.disable(this.#gl.BLEND)
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
                this.#gl.enable(this.#gl.CULL_FACE)
            } else {
                this.#gl.disable(this.#gl.CULL_FACE)
            }
        }
    }
    setFrontFace() {
        this.#gl.frontFace(this.#gl.CCW)
    }
    setBackFace() {
        this.#gl.frontFace(this.#gl.CW)
    }

    #blending = false
    get blending() { return this.#blending }
    set blending(value) {
        if (this.#blending !== value) {
            this.#blending = value
            if (value) {
                this.#gl.enable(this.#gl.BLEND)
            } else {
                this.#gl.disable(this.#gl.BLEND)
            }
        }
    }
    setNormalBlending() {
        this.#gl.blendFuncSeparate(this.#gl.SRC_ALPHA, this.#gl.ONE_MINUS_SRC_ALPHA, this.#gl.ONE, this.#gl.ONE_MINUS_SRC_ALPHA)
    }
    setAdditiveBlending() {
        this.#gl.blendFunc(this.#gl.SRC_ALPHA, this.#gl.ONE)
    }
    setMultiplyBlending() {
        this.#gl.blendFunc(this.#gl.ZERO, this.#gl.SRC_COLOR)
    }

    #depthTest = true
    get depthTest() { return this.#depthTest }
    set depthTest(value) {
        if (this.#depthTest !== value) {
            this.#depthTest = value
            if (value) {
                this.#gl.enable(this.#gl.DEPTH_TEST)
            } else {
                this.#gl.disable(this.#gl.DEPTH_TEST)
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
