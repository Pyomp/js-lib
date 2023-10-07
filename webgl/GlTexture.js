export class GlTexture {
    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {WebGLTexture} */ #texture

    #target

    #needsMipmap

    #format

    #type

    /**
     * 
     * @param {{
     *  gl: WebGL2RenderingContext
     *  target?: WebGl.Texture.Target
     *  wrapS?: WebGl.Texture.Wrap
     *  wrapT?: WebGl.Texture.Wrap
     *  minFilter?: WebGl.Texture.MinFilter
     *  magFilter?: WebGl.Texture.MagFilter
     *  level?: GLint
     *  internalformat?: WebGl.Texture.InternalFormat
     *  width?: GLsizei
     *  height?: GLsizei
     *  border?: GLint
     *  format?: WebGl.Texture.Format
     *  type?: WebGl.Texture.Type
     *  data: WebGl.Texture.Pixels
     *  needsMipmap?: boolean
     * }} param0 
     */
    constructor({
        gl,
        target = 'TEXTURE_2D',
        wrapS = 'CLAMP_TO_EDGE',
        wrapT = 'CLAMP_TO_EDGE',
        minFilter = 'LINEAR',
        magFilter = 'LINEAR',
        internalformat = 'RGBA',
        width,
        height,
        border = 0,
        format = 'RGBA',
        type = 'UNSIGNED_BYTE',
        data = null,
        needsMipmap = true
    }) {
        this.#texture = gl.createTexture()

        this.#target = WebGL2RenderingContext[target]
        this.#format = WebGL2RenderingContext[format]
        this.#type = WebGL2RenderingContext[type]

        gl.bindTexture(this.#target, this.#texture)

        gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_WRAP_S, WebGL2RenderingContext[wrapS])
        gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_WRAP_T, WebGL2RenderingContext[wrapT])
        gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_MIN_FILTER, WebGL2RenderingContext[minFilter])
        gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_MAG_FILTER, WebGL2RenderingContext[magFilter])

        gl.texImage2D(
            this.#target,
            0, // level
            WebGL2RenderingContext[internalformat],
            // @ts-ignore ts is bad for this kind of line
            width ?? data.width ?? data.length,
            // @ts-ignore ts is bad for this kind of line
            height ?? data.height ?? 1,
            border,
            this.#format,
            this.#type,
            // @ts-ignore ts want ArrayBufferView but WebGl.Texture.Pixels is more precise
            data
        )

        if (needsMipmap) gl.generateMipmap(this.#target)
        this.#needsMipmap = needsMipmap

        this.#gl = gl
    }

    /**
     * @param {WebGl.Texture.Pixels} data
    */
    updateData(data) {
        this.#gl.bindTexture(this.#target, this.#texture)

        this.#gl.texSubImage2D(
            this.#target,
            0,
            0,
            0,
            this.#format,
            this.#type,
            // @ts-ignore ts want ArrayBufferView but WebGl.Texture.Pixels is more precise
            data
        )

        if (this.#needsMipmap) this.#gl.generateMipmap(this.#target)
    }

    /**
     * 
     * @param {number} unit 
     */
    bindToUnit(unit) {
        this.#gl.activeTexture(unit)
        this.#gl.bindTexture(this.#target, this.#texture)
    }
}
