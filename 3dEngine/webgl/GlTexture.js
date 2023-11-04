export class GlTexture {
    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {WebGLTexture} */ texture

    #target

    #needsMipmap

    #format

    #type

    #internalFormat

    #border

    #width

    #height

    /**
     * 
     * @param {{
     *  gl: WebGL2RenderingContext
     *  target?: WebGl.Texture.Target
     *  wrapS?: WebGl.Texture.Wrap | number
     *  wrapT?: WebGl.Texture.Wrap | number
     *  minFilter?: WebGl.Texture.MinFilter | number
     *  magFilter?: WebGl.Texture.MagFilter | number
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
        this.texture = gl.createTexture()

        this.#target = WebGL2RenderingContext[target]
        this.#internalFormat = WebGL2RenderingContext[internalformat]
        this.#border = border
        this.#format = WebGL2RenderingContext[format]
        this.#type = WebGL2RenderingContext[type]

        // @ts-ignore ts is bad for this kind of line
        this.#width = width ?? data.width ?? data.length
        // @ts-ignore ts is bad for this kind of line
        this.#height = height ?? data.height ?? 1

        gl.bindTexture(this.#target, this.texture)

        gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_WRAP_S, WebGL2RenderingContext[wrapS] ?? wrapS)
        gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_WRAP_T, WebGL2RenderingContext[wrapT] ?? wrapT)
        gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_MIN_FILTER, WebGL2RenderingContext[minFilter] ?? minFilter)
        gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_MAG_FILTER, WebGL2RenderingContext[magFilter] ?? magFilter)

        gl.texImage2D(
            this.#target,
            0, // level
            this.#internalFormat,
            this.#width,
            this.#height,
            this.#border,
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
     * @param {number?} unit texture unit
    */
    updateData(data, unit = undefined) {
        if (unit !== undefined) this.#gl.activeTexture(unit)
        this.#gl.bindTexture(this.#target, this.texture)

        this.#gl.texSubImage2D(
            this.#target,
            0,
            0,
            0,
            this.#width,
            this.#height,
            this.#format,
            this.#type,
            // @ts-ignore ts want ArrayBufferView but WebGl.Texture.Pixels is more precise
            data
        )

        if (this.#needsMipmap) this.#gl.generateMipmap(this.#target)
    }

    updateSize(width, height, data = null, border = 0) {
        this.#width = width
        this.#height = height
        this.#gl.bindTexture(this.#target, this.texture)

        this.#gl.texImage2D(
            this.#target,
            0, // level
            this.#internalFormat,
            this.#width,
            this.#height,
            this.#border,
            this.#format,
            this.#type,
            // @ts-ignore ts want ArrayBufferView but WebGl.Texture.Pixels is more precise
            data
        )
    }

    /**
     * 
     * @param {number} unit 
     */
    bindToUnit(unit) {
        this.#gl.activeTexture(unit)
        this.#gl.bindTexture(this.#target, this.texture)
    }

    dispose() {
        this.#gl.deleteTexture(this.texture)
    }
}
