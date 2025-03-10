export class GlTexture {
    static getCubeTexture = getCubeTexture

    paramsVersion = 0
    dataVersion = 0

    needsDelete = false

    /**
    * @param {{
    *  name?: string
    *  wrapS?: WebGl.Texture.Wrap | number
    *  wrapT?: WebGl.Texture.Wrap | number
    *  minFilter?: WebGl.Texture.MinFilter | number
    *  magFilter?: WebGl.Texture.MagFilter | number
    *  internalformat?: WebGl.Texture.InternalFormat | number
    *  width?: GLsizei
    *  height?: GLsizei
    *  border?: GLint
    *  format?: WebGl.Texture.Format | number
    *  type?: WebGl.Texture.Type | number
    *  data?: WebGl.Texture.Pixels | null | (WebGl.Texture.Pixels | URL)[] | URL | Image
    *  needsMipmap?: boolean
    * }} param0 
    */
    constructor({
        name = '',
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
        this.name = name
        this.wrapS = WebGL2RenderingContext[wrapS] ?? wrapS
        this.wrapT = WebGL2RenderingContext[wrapT] ?? wrapT
        this.minFilter = WebGL2RenderingContext[minFilter] ?? minFilter
        this.magFilter = WebGL2RenderingContext[magFilter] ?? magFilter

        this.internalformat = WebGL2RenderingContext[internalformat] ?? internalformat
        this.width = width ?? data?.width ?? 1
        this.height = height ?? data?.height ?? 1
        this.border = border
        this.format = WebGL2RenderingContext[format] ?? format
        this.type = WebGL2RenderingContext[type] ?? type
        this.data = data

        if (data instanceof Image || data instanceof HTMLImageElement) {
            data.addEventListener('load', () => {
                this.width = data.width
                this.height = data.height
                this.dataVersion++
                this.paramsVersion++
            })
        } else if (data instanceof Array) {
            for (const element of data) {
                if (element instanceof Image) {
                    element.addEventListener('load', () => {
                        this.width = element.width
                        this.height = element.height
                        this.dataVersion++
                        this.paramsVersion++
                    })
                }
            }
        }

        this.needsMipmap = needsMipmap
    }

    resize(width, height) {
        this.width = width
        this.height = height
        this.paramsVersion++
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

    return [new GlTexture({ data: images })]
}
