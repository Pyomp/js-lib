import { waitForImageComplete } from "../../../utils/utils.js"
import { GlTexture } from "../glDescriptors/GlTexture.js"
import { GlContextRenderer } from "./GlContextRenderer.js"

const CUBE_MAP_TARGETS = [
    WebGL2RenderingContext.TEXTURE_CUBE_MAP_POSITIVE_X,
    WebGL2RenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_X,
    WebGL2RenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Y,
    WebGL2RenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    WebGL2RenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Z,
    WebGL2RenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Z,
]

export class GlTextureRenderer {
    #glContext

    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {WebGLTexture} */ #webGlTexture

    /** @type {GlTexture} */ #glTexture

    #target

    #paramsVersion = -1
    #dataVersion = -1

    #isCubeMap = false

    /**
     * 
     * @param {GlContextRenderer} glContext 
     * @param {GlTexture} glTexture 
     */
    constructor(glContext, glTexture) {
        this.#glContext = glContext
        this.#gl = glContext.gl
        this.#glTexture = glTexture
        this.#webGlTexture = this.#gl.createTexture()
        this.#isCubeMap = glTexture.data instanceof Array
        this.#target = this.#isCubeMap ? WebGL2RenderingContext.TEXTURE_CUBE_MAP : WebGL2RenderingContext.TEXTURE_2D
    }

    #updateWrapAndFilter() {
        const glTexture = this.#glTexture

        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_WRAP_S, glTexture.wrapS)
        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_WRAP_T, glTexture.wrapT)
        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_MIN_FILTER, glTexture.minFilter)
        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_MAG_FILTER, glTexture.magFilter)
    }

    #texImage2D(target, data) {
        this.#gl.texImage2D(
            target,
            0, // level
            this.#glTexture.internalformat,
            this.#glTexture.width,
            this.#glTexture.height,
            this.#glTexture.border,
            this.#glTexture.format,
            this.#glTexture.type,
            data
        )
        if (this.#glTexture.needsMipmap) this.#gl.generateMipmap(this.#target)
    }

    #updateData() {
        const data = this.#glTexture.data

        if (data instanceof Array) {
            for (let i = 0; i < 6; i++) {
                this.#texSubImage2D(CUBE_MAP_TARGETS[i], data[i])
            }
        } else {
            this.#texSubImage2D(WebGL2RenderingContext.TEXTURE_2D, data)
        }

        if (this.#glTexture.needsMipmap) this.#gl.generateMipmap(this.#target)
    }

    #texSubImage2D(target, data) {
        this.#gl.texSubImage2D(
            target,
            0,
            0,
            0,
            this.#glTexture.width,
            this.#glTexture.height,
            this.#glTexture.format,
            this.#glTexture.type,
            // @ts-ignore ts want ArrayBufferView but WebGl.Texture.Pixels is more precise
            data
        )
    }

    #texImage2DUrl(target, url) {
        const image = new Image()

        image.addEventListener('load', () => {
            this.#glTexture.width = image.width
            this.#glTexture.height = image.height
            this.#gl.bindTexture(this.#target, this.#webGlTexture)
            this.#texImage2D(target, image)
        }, { once: true })

        image.src = url.href
    }

    async #updateParams() {
        const data = this.#glTexture.data

        this.#updateWrapAndFilter()

        if (this.#isCubeMap) {
            for (let i = 0; i < 6; i++) {
                if (data[i] instanceof URL) {
                    this.#texImage2DUrl(CUBE_MAP_TARGETS[i], data[i])
                } else {
                    this.#texImage2D(CUBE_MAP_TARGETS[i], data[i])
                }
            }
        } else if (data instanceof URL) {
            this.#texImage2DUrl(WebGL2RenderingContext.TEXTURE_2D, data)
        } else if (data instanceof Image) {
            if (data.width > 0) {
                this.#texImage2D(WebGL2RenderingContext.TEXTURE_2D, data)
            }
        } else {
            this.#texImage2D(WebGL2RenderingContext.TEXTURE_2D, data)
        }
    }

    #bind() {
        this.#gl.bindTexture(this.#target, this.#webGlTexture)
    }

    #update() {
        if (this.#glTexture.paramsVersion !== this.#paramsVersion) {
            this.#dataVersion = this.#glTexture.dataVersion
            this.#paramsVersion = this.#glTexture.paramsVersion
            this.#updateParams()
        } else if (this.#glTexture.dataVersion !== this.#dataVersion) {
            this.#dataVersion = this.#glTexture.dataVersion
            this.#updateData()
        }
    }

    /**
     * @param {number} unit 
     */
    bindToUnit(unit) {
        this.#gl.activeTexture(unit)
        this.#gl.bindTexture(this.#target, this.#webGlTexture)
        this.#update()
    }

    attachToBoundFrameBuffer(attachment) {
        this.#gl.bindTexture(this.#target, this.#webGlTexture)
        this.#update()
        this.#gl.framebufferTexture2D(WebGL2RenderingContext.FRAMEBUFFER, attachment, this.#target, this.#webGlTexture, 0)
    }

    dispose() {
        this.#gl.deleteTexture(this.#webGlTexture)
    }
}
