import { GlArrayBuffer } from "./GlArrayBuffer.js"
import { GlArrayBufferData } from "../glDescriptors/GlArrayBufferData.js"
import { GlCapabilities } from "./GlCapabilities.js"
import { GlInfos } from "./GlInfos.js"
import { GlProgramData } from "../glDescriptors/GlProgramData.js"
import { GlProgram } from "./GlProgram.js"
import { GlTexture } from "./GlTexture.js"
import { GlTextureData } from "../glDescriptors/GlTextureData.js"
import { GlUbo } from "./GlUbo.js"
import { GlUboData } from "../glDescriptors/GlUboData.js"
import { GlObjectData } from "../glDescriptors/GlObjectData.js"

export class GlContext {
    #globalUbos
    /** @type {{[uniformName: string]: number}} */
    #globalUbosIndex = {}

    /**
    * @param {HTMLCanvasElement} canvas 
    * @param {WebGLContextAttributes} options
    * @param {{[uniformName: string]: GlUboData}} globalUbos
    */
    constructor(
        canvas = document.createElement('canvas'),
        options = {
            alpha: true,
            antialias: true,
            depth: true,
            // desynchronized?: boolean
            failIfMajorPerformanceCaveat: false,
            powerPreference: 'default',
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            stencil: false
        },
        globalUbos = {}
    ) {
        this.canvas = canvas
        this.gl = canvas.getContext("webgl2", options)

        this.glCapabilities = new GlCapabilities(this.gl)
        this.glInfos = new GlInfos(this.gl)

        this.#globalUbos = globalUbos
        this.#globalUbosIndex = {}

        let i = 0
        for (const uboUniformName in this.#globalUbos) {
            const glUboData = this.#globalUbos[uboUniformName]
            this.#globalUbosIndex[uboUniformName] = i
            this.getGlUbo(glUboData).bindToIndex(i)
            i++
        }

        this.#resizeObserver.observe(canvas)
    }

    /** @type {Map<GlArrayBufferData, GlArrayBuffer>} */ #arrayBuffers = new Map()
    getGlArrayBuffer(/** @type {GlArrayBufferData} */ glArrayBufferData) {
        if (!this.#arrayBuffers.has(glArrayBufferData)) {
            this.#arrayBuffers.set(glArrayBufferData, new GlArrayBuffer(this, glArrayBufferData))
        }
        return this.#arrayBuffers.get(glArrayBufferData)
    }
    freeGlArrayBuffer(/** @type {GlArrayBufferData} */ glArrayBufferData) {
        this.#arrayBuffers.get(glArrayBufferData)?.dispose()
        this.#arrayBuffers.delete(glArrayBufferData)
    }
    freeAllGlArrayBuffer() {
        for (const arrayBuffer of this.#arrayBuffers.values()) {
            arrayBuffer.dispose()
        }
        this.#arrayBuffers.clear()
    }

    /** @type {Map<GlProgramData, GlProgram>} */ #programs = new Map()
    getGlProgram(/** @type {GlProgramData} */ glProgramData) {
        if (!this.#programs.has(glProgramData)) {
            this.#programs.set(glProgramData, new GlProgram(this, glProgramData, this.#globalUbosIndex))
        }
        return this.#programs.get(glProgramData)
    }
    freeGlProgram(/** @type {GlProgramData} */ glProgramData) {
        this.#programs.get(glProgramData)?.dispose()
        this.#programs.delete(glProgramData)
    }
    freeAllGlProgram() {
        for (const program of this.#programs.values()) {
            program.dispose()
        }
        this.#programs.clear()
    }

    /** @type {Map<GlTextureData, GlTexture>} */ #textures = new Map()
    getGlTexture(/** @type {GlTextureData} */ glTextureData) {
        if (!this.#textures.has(glTextureData)) {
            this.#textures.set(glTextureData, new GlTexture(this, glTextureData))
        }
        return this.#textures.get(glTextureData)
    }
    freeGlTexture(/** @type {GlTextureData} */ glTextureData) {
        this.#textures.get(glTextureData)?.dispose()
        this.#textures.delete(glTextureData)
    }
    freeAllGlTexture() {
        for (const texture of this.#textures.values()) {
            texture.dispose()
        }
        this.#textures.clear()
    }

    /** @type {Map<GlUboData, GlUbo>} */ #ubos = new Map()
    getGlUbo(/** @type {GlUboData} */ glUboData) {
        if (!this.#ubos.has(glUboData)) {
            this.#ubos.set(glUboData, new GlUbo(this, glUboData))
        }
        return this.#ubos.get(glUboData)
    }
    freeGlUbo(/** @type {GlUboData} */ glUboData) {
        this.#ubos.get(glUboData)?.dispose()
        this.#ubos.delete(glUboData)
    }
    freeAllGlUbo() {
        for (const ubo of this.#ubos.values()) ubo.dispose()
        this.#ubos.clear()
    }

    /** @type {Set<(width: number, height: number) => void>} */
    resizeListeners = new Set()
    #resizeListener() {
        // @ts-ignore canvas should not be offscreen
        const width = this.gl.canvas.scrollWidth || 1
        // @ts-ignore canvas should not be offscreen
        const height = this.gl.canvas.scrollHeight || 1
        this.gl.canvas.width = width
        this.gl.canvas.height = height
        this.gl.viewport(0, 0, width, height)
        for (const cb of this.resizeListeners) cb(width, height)
    }

    #resizeObserver = new ResizeObserver(this.#resizeListener.bind(this))

    updateGlobalUbos() {
        for (const glUboData of Object.values(this.#globalUbos)) {
            this.getGlUbo(glUboData).update()
        }
    }

    #currentProgram
    #currentVao
    drawObject(/** @type {GlObjectData} */ glObjectData) {
        if (glObjectData.additiveBlending) this.glCapabilities.setAdditiveBlending()
        else if (glObjectData.normalBlending) this.glCapabilities.setNormalBlending()
        else this.glCapabilities.blending = false

        this.glCapabilities.depthTest = glObjectData.depthTest
        this.glCapabilities.depthWrite = glObjectData.depthWrite
        this.glCapabilities.cullFace = glObjectData.cullFace

        const glProgram = this.getGlProgram(glObjectData.glProgramData)

        if (this.#currentProgram !== glProgram) {
            this.#currentProgram = glProgram
            glProgram.useProgram()
        }

        for (const name in glObjectData.uniforms) {
            glProgram.uniformUpdate[name]?.(glObjectData.uniforms[name])
        }

        for (const name in glObjectData.glTexturesData) {
            if (glProgram.textureUnit[name] !== undefined) {
                const glTextureData = glObjectData.glTexturesData[name]
                this.getGlTexture(glTextureData).bindToUnit(glProgram.textureUnit[name])
            }
        }

        for (const name in glObjectData.glUbosData) {
            if (glProgram.uboIndex[name] !== undefined) {
                const glUboData = glObjectData.glUbosData[name]
                this.getGlUbo(glUboData).bindToIndex(glProgram.uboIndex[name])
            }
        }

        const glVao = glObjectData.glVaoData && glProgram.getGlVao(glObjectData.glVaoData)

        if (glVao) {
            if (this.#currentVao !== glVao) {
                this.#currentVao = glVao
                glVao.bind()
            }
            if (glVao.indicesType !== -1) this.gl.drawElements(glObjectData.drawMode, glObjectData.count, glVao.indicesType, glObjectData.offset)
            else this.gl.drawArrays(glObjectData.drawMode, glObjectData.offset, glObjectData.count)
        } else this.gl.drawArrays(glObjectData.drawMode, glObjectData.offset, glObjectData.count)
    }
}
