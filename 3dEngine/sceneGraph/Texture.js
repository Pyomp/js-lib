export class Texture {
    needsUpdate = false
      /**
      * @param {{
      *  target?: WebGl.Texture.Target
      *  wrapS?: WebGl.Texture.Wrap
      *  wrapT?: WebGl.Texture.Wrap
      *  minFilter?: WebGl.Texture.MinFilter
      *  magFilter?: WebGl.Texture.MagFilter
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
        this.wrapS = wrapS
        this.wrapT = wrapT
        this.minFilter = minFilter
        this.magFilter = magFilter
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
