import { GlTextureData } from "../glDescriptors/GlTextureData.js"
import { GlContext } from "./GlContext.js"

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

    /** @type {WebGLTexture} */ #glTexture

    /** @type {GlTextureData} */ #glTextureData

    #target

    #paramsVersion = -1

    #dataVersion = -1

    #isCubeMap = false

    /**
     * 
     * @param {GlContext} glContext 
     * @param {GlTextureData} glTextureData 
     */
    constructor(glContext, glTextureData) {
        this.#gl = glContext.gl
        this.#glTextureData = glTextureData
        this.#glTexture = this.#gl.createTexture()
        this.#isCubeMap = glTextureData.data instanceof Array
        this.#target = this.#isCubeMap ? WebGL2RenderingContext.TEXTURE_CUBE_MAP : WebGL2RenderingContext.TEXTURE_2D
    }

    #updateWrapAndFilter() {
        const glTextureData = this.#glTextureData

        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_WRAP_S, glTextureData.wrapS)
        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_WRAP_T, glTextureData.wrapT)
        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_MIN_FILTER, glTextureData.minFilter)
        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_MAG_FILTER, glTextureData.magFilter)
    }

    #texImage2D(target, data) {
        this.#gl.texImage2D(
            target,
            0, // level
            this.#glTextureData.internalformat,
            this.#glTextureData.width,
            this.#glTextureData.height,
            this.#glTextureData.border,
            this.#glTextureData.format,
            this.#glTextureData.type,
            data
        )
    }

    #updateData() {
        const data = this.#glTextureData.data

        if (data instanceof Array) {
            for (let i = 0; i < 6; i++) {
                this.#texSubImage2D(CUBE_MAP_TARGETS[i], data[i])
            }
        } else {
            this.#texSubImage2D(WebGL2RenderingContext.TEXTURE_2D, data)
        }

        if (this.#glTextureData.needsMipmap) this.#gl.generateMipmap(this.#target)
    }

    #texSubImage2D(target, data) {
        this.#gl.texSubImage2D(
            target,
            0,
            0,
            0,
            this.#glTextureData.width,
            this.#glTextureData.height,
            this.#glTextureData.format,
            this.#glTextureData.type,
            // @ts-ignore ts want ArrayBufferView but WebGl.Texture.Pixels is more precise
            data
        )
    }

    #updateParams() {
        const data = this.#glTextureData.data

        this.#updateWrapAndFilter()

        if (this.#isCubeMap) {
            for (let i = 0; i < 6; i++) {
                this.#texImage2D(CUBE_MAP_TARGETS[i], data[i])
            }
        } else {
            this.#texImage2D(WebGL2RenderingContext.TEXTURE_2D, data)
        }

        if (this.#glTextureData.needsMipmap) this.#gl.generateMipmap(this.#target)
    }

    /**
     * @param {number} unit 
     */
    bindToUnit(unit) {
        this.#gl.activeTexture(unit)
        this.#gl.bindTexture(this.#target, this.#glTexture)

        if (this.#glTextureData.paramsVersion !== this.#paramsVersion) {
            this.#glTextureData.dataVersion = this.#dataVersion
            this.#glTextureData.paramsVersion = this.#paramsVersion
            this.#updateParams()
        } else if (this.#glTextureData.dataVersion !== this.#dataVersion) {
            this.#glTextureData.dataVersion = this.#dataVersion
            this.#updateData()
        }
    }

    dispose() {
        this.#gl.deleteTexture(this.#glTexture)
    }
}