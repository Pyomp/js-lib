export class GlTexture {
    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {WebGLTexture} */ texture

    /**
     * @param {WebGL2RenderingContext} gl 
     */
    constructor(gl) {
        this.texture = gl.createTexture()
        this.#gl = gl
    }

    /**
     * @param {{
     *      target?: WebGl.Texture.Target
     *      wrapS?: WebGl.Texture.Wrap
     *      wrapT?: WebGl.Texture.Wrap
     *      minFilter?: WebGl.Texture.MinFilter
     *      magFilter?: WebGl.Texture.MagFilter
     * }} param0 
     */
    updateParameters({
        target = 'TEXTURE_2D',
        wrapS = 'CLAMP_TO_EDGE',
        wrapT = 'CLAMP_TO_EDGE',
        minFilter = 'LINEAR',
        magFilter = 'LINEAR',
    }) {
        this.#gl.bindTexture(this.#gl[target], this.texture)
        this.#gl.texParameteri(this.#gl[target], this.#gl.TEXTURE_WRAP_S, this.#gl[wrapS])
        this.#gl.texParameteri(this.#gl[target], this.#gl.TEXTURE_WRAP_T, this.#gl[wrapT])
        this.#gl.texParameteri(this.#gl[target], this.#gl.TEXTURE_MIN_FILTER, this.#gl[minFilter])
        this.#gl.texParameteri(this.#gl[target], this.#gl.TEXTURE_MAG_FILTER, this.#gl[magFilter])
    }

    /**
     * @param {{
     *      target?: WebGl.Texture.Target
     *      level?: GLint
     *      internalformat?: WebGl.Texture.InternalFormat
     *      width?: GLsizei
     *      height?: GLsizei
     *      border?: GLint
     *      format?: WebGl.Texture.Format
     *      type?: WebGl.Texture.Type
     *      data: any
     *      needsMipmap?: boolean
     * }} param0 
    */
    updateData({
        target = 'TEXTURE_2D',
        level = 0,
        internalformat = 'RGBA',
        width,
        height,
        border = 0,
        format = 'RGBA',
        type = 'UNSIGNED_BYTE',
        data,
        needsMipmap = false
    }) {
        this.#gl.bindTexture(this.#gl[target], this.texture)

        this.#gl.texImage2D(
            this.#gl[target],
            level,
            this.#gl[internalformat],
            width ?? data.width,
            height ?? data.height,
            border,
            this.#gl[format],
            this.#gl[type],
            data
        )

        if (needsMipmap) this.#gl.generateMipmap(this.#gl[target])
    }

    /**
     * @param {{
     *      unit: number
     *      target?: WebGl.Texture.Target
     * }} param0 
     */
    bindTexture({ unit, target = 'TEXTURE_2D' }) {
        this.#gl.activeTexture(unit)
        this.#gl.bindTexture(this.#gl[target], this.texture)
    }
}
