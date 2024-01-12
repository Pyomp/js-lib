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

    /** @type {WebGLTexture} */ glTexture

    /** @type {GlTextureData} */ #texture

    #target

    /**
     * 
     * @param {GlContext} glContext 
     * @param {GlTextureData} glTextureData 
     */
    constructor(glContext, glTextureData) {
        this.#gl = glContext.gl
        this.#texture = glTextureData

        this.version = this.#texture.version

        this.glTexture = this.#gl.createTexture()

        this.#target = glTextureData.data instanceof Array ? WebGL2RenderingContext.TEXTURE_CUBE_MAP : WebGL2RenderingContext.TEXTURE_2D

        this.#updateWrapAndFilter()

        if (glTextureData.data instanceof Array) {
            for (let i = 0; i < 6; i++) {
                this.#texImage2D(CUBE_MAP_TARGETS[i], glTextureData.data[i])
            }
        } else {
            this.#texImage2D(WebGL2RenderingContext.TEXTURE_2D, glTextureData.data)
        }

        if (glTextureData.needsMipmap) this.#gl.generateMipmap(this.#target)
    }

    #updateWrapAndFilter() {
        const texture = this.#texture
        this.#gl.bindTexture(this.#target, this.glTexture)

        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_WRAP_S, texture.wrapS)
        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_WRAP_T, texture.wrapT)
        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_MIN_FILTER, texture.minFilter)
        this.#gl.texParameteri(this.#target, WebGL2RenderingContext.TEXTURE_MAG_FILTER, texture.magFilter)
    }

    #texImage2D(target, data) {
        this.#gl.texImage2D(
            target,
            0, // level
            this.#texture.internalformat,
            this.#texture.width,
            this.#texture.height,
            this.#texture.border,
            this.#texture.format,
            this.#texture.type,
            data
        )
    }

    /**
     * @param {WebGl.Texture.Pixels} data
     * @param {number?} unit texture unit
    */
    updateData(data, unit = undefined) {
        this.version = this.#texture.version

        if (unit !== undefined) this.#gl.activeTexture(unit)

        this.#gl.bindTexture(this.#target, this.glTexture)

        if (data instanceof Array) {
            for (let i = 0; i < 6; i++) {
                this.#texSubImage2D(CUBE_MAP_TARGETS[i], data[i])
            }
        } else {
            this.#texSubImage2D(WebGL2RenderingContext.TEXTURE_2D, data)
        }

        if (this.#texture.needsMipmap) this.#gl.generateMipmap(this.#target)
    }

    #texSubImage2D(target, data) {
        this.#gl.texSubImage2D(
            target,
            0,
            0,
            0,
            this.#texture.width,
            this.#texture.height,
            this.#texture.format,
            this.#texture.type,
            // @ts-ignore ts want ArrayBufferView but WebGl.Texture.Pixels is more precise
            data
        )
    }

    updateSize(width, height, data = null, border = 0) {
        this.#texture.width = width
        this.#texture.height = height
        this.#gl.bindTexture(this.#target, this.glTexture)

        if (data instanceof Array) {
            for (let i = 0; i < 6; i++) {
                this.#texImage2D(CUBE_MAP_TARGETS[i], data[i])
            }
        } else {
            this.#texImage2D(WebGL2RenderingContext.TEXTURE_2D, data)
        }

        if (this.#texture.needsMipmap) this.#gl.generateMipmap(this.#target)
    }

    /**
     * 
     * @param {number} unit 
     */
    bindToUnit(unit) {
        this.#gl.activeTexture(unit)
        this.#gl.bindTexture(this.#target, this.glTexture)
    }

    dispose() {
        this.#gl.deleteTexture(this.glTexture)
    }
}
