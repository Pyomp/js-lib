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
    *  data?: WebGl.Texture.Pixels | null
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
        width = undefined,
        height = undefined,
        border = 0,
        format = 'RGBA',
        type = 'UNSIGNED_BYTE',
        data = new Image(),
        needsMipmap = true
    }) {
        this.target = target

        this.wrapS = WebGL2RenderingContext[wrapS] ?? wrapS
        this.wrapT = WebGL2RenderingContext[wrapT] ?? wrapT
        this.minFilter = WebGL2RenderingContext[minFilter] ?? minFilter
        this.magFilter = WebGL2RenderingContext[magFilter] ?? magFilter

        this.internalformat = internalformat
        this.width = width ?? data?.width ?? 1
        this.height = height ?? data?.height ?? 1
        this.border = border
        this.format = format
        this.type = type
        this.data = data
        if (this.data instanceof Image) {
            this.data.onload = () => { this.needsUpdate = true }
            this.width = this.data.width
            this.height = this.data.height
        }
        this.needsMipmap = needsMipmap
    }
}
