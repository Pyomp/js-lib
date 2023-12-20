export class Texture {
    needsUpdate = false

    needsDelete = false

    /**
    * @param {{
    *  target?: WebGl.Texture.Target
    *  wrapS?: WebGl.Texture.Wrap | number
    *  wrapT?: WebGl.Texture.Wrap | number
    *  minFilter?: WebGl.Texture.MinFilter | number
    *  magFilter?: WebGl.Texture.MagFilter | number
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
        this.target = target

        this.wrapS = WebGL2RenderingContext[wrapS] ?? wrapS
        this.wrapT = WebGL2RenderingContext[wrapT] ?? wrapT
        this.minFilter = WebGL2RenderingContext[minFilter] ?? minFilter
        this.magFilter = WebGL2RenderingContext[magFilter] ?? magFilter

        this.internalformat = internalformat
        this.width = width
        this.height = height
        this.border = border
        this.format = format
        this.type = type
        this.data = data
        this.needsMipmap = needsMipmap
    }
}
