const CUBE_MAP_TARGETS = [
    WebGL2RenderingContext.TEXTURE_CUBE_MAP_POSITIVE_X,
    WebGL2RenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_X,
    WebGL2RenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Y,
    WebGL2RenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    WebGL2RenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Z,
    WebGL2RenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Z,
]

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

    #data

    /**
     * 
     * @param {{
     *  gl: WebGL2RenderingContext
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
        this.#gl = gl
        this.texture = gl.createTexture()

        this.#internalFormat = WebGL2RenderingContext[internalformat]
        this.#border = border
        this.#format = WebGL2RenderingContext[format]
        this.#type = WebGL2RenderingContext[type]

        // @ts-ignore ts is bad for this kind of line
        this.#width = width ?? data.width ?? data[0]?.width ?? data.length
        // @ts-ignore ts is bad for this kind of line
        this.#height = height ?? data.height ?? data[0]?.height ?? 1
        this.#needsMipmap = needsMipmap

        this.#target = data instanceof Array ? WebGL2RenderingContext.TEXTURE_CUBE_MAP : WebGL2RenderingContext.TEXTURE_2D

        this.#gl.bindTexture(this.#target, this.texture)

        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_WRAP_S, WebGL2RenderingContext[wrapS] ?? wrapS)
        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_WRAP_T, WebGL2RenderingContext[wrapT] ?? wrapT)
        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_MIN_FILTER, WebGL2RenderingContext[minFilter] ?? minFilter)
        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_MAG_FILTER, WebGL2RenderingContext[magFilter] ?? magFilter)

        if (data instanceof Array) {
            for (let i = 0; i < 6; i++) {
                this.#texImage2D(CUBE_MAP_TARGETS[i], data[i])
            }
        } else {
            this.#texImage2D(WebGL2RenderingContext.TEXTURE_2D, data)
        }

        if (this.#needsMipmap) this.#gl.generateMipmap(this.#target)
    }

    #texImage2D(target, data) {
        this.#gl.texImage2D(
            target,
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
     * @param {WebGl.Texture.Pixels} data
     * @param {number?} unit texture unit
    */
    updateData(data, unit = undefined) {
        if (unit !== undefined) this.#gl.activeTexture(unit)

        this.#gl.bindTexture(this.#target, this.texture)

        if (data instanceof Array) {
            for (let i = 0; i < 6; i++) {
                this.#texSubImage2D(CUBE_MAP_TARGETS[i], data[i])
            }
        } else {
            this.#texSubImage2D(WebGL2RenderingContext.TEXTURE_2D, data)
        }

        if (this.#needsMipmap) this.#gl.generateMipmap(this.#target)
    }

    #texSubImage2D(target, data) {
        this.#gl.texSubImage2D(
            target,
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
    }

    updateSize(width, height, data = null, border = 0) {
        this.#width = width
        this.#height = height
        this.#gl.bindTexture(this.#target, this.texture)

        if (data instanceof Array) {
            for (let i = 0; i < 6; i++) {
                this.#texImage2D(CUBE_MAP_TARGETS[i], data[i])
            }
        } else {
            this.#texImage2D(WebGL2RenderingContext.TEXTURE_2D, data)
        }

        if (this.#needsMipmap) this.#gl.generateMipmap(this.#target)
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
