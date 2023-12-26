export class Texture {
    static getCubeTexture = getCubeTexture

    needsUpdate = false

    needsDelete = false

    /**
    * @param {{
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
    *  data?: WebGl.Texture.Pixels | null | WebGl.Texture.Pixels[]
    *  needsMipmap?: boolean
    * }} param0 
    */
    constructor({
        wrapS = 'CLAMP_TO_EDGE',
        wrapT = 'CLAMP_TO_EDGE',
        minFilter = 'LINEAR_MIPMAP_LINEAR',
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
        } else if (this.data instanceof Array) {
            for (const element of this.data) {
                if (element instanceof Image) {
                    element.onload = () => { this.needsUpdate = true }
                    this.width = element.width
                    this.height = element.height
                }
            }
        }

        this.needsMipmap = needsMipmap
    }
}
function getImage(url) {
    const image = new Image()
    return new Promise((resolve) => {
        image.onload = () => { resolve(image) }
        image.src = url
    })
}

async function getCubeTexture(
    /** @type {string} */ urlPositiveX,
    /** @type {string} */ urlNegativeX,
    /** @type {string} */ urlPositiveY,
    /** @type {string} */ urlNegativeY,
    /** @type {string} */ urlPositiveZ,
    /** @type {string} */ urlNegativeZ,
) {
    const images = await Promise.all([
        getImage(urlPositiveX),
        getImage(urlNegativeX),
        getImage(urlPositiveY),
        getImage(urlNegativeY),
        getImage(urlPositiveZ),
        getImage(urlNegativeZ),
    ])

    return [new Texture({ data: images })]
}
