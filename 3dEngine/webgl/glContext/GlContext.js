import { GlArrayBuffer } from "./GlArrayBuffer.js"
import { GlArrayBufferData } from "../glDescriptors/GlArrayBufferData.js"
import { GlCapabilities } from "./GlCapabilities.js"
import { GlInfos } from "./GlInfos.js"
import { GlProgramData } from "../glDescriptors/GlProgramData.js"
import { GlProgram } from "./GlProgram.js"
import { GlTexture } from "./GlTexture.js"
import { GlTextureData } from "../glDescriptors/GlTextureData.js"
import { GlUbo } from "./GlUbo.js"
import { GlVao } from "./GlVao.js"
import { GlVaoData } from "../glDescriptors/GlVaoData.js"

export class GlContext {
    /**
    * @param {HTMLCanvasElement} canvas 
    * @param {WebGLContextAttributes} options 
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
        }
    ) {
        this.canvas = canvas
        this.gl = canvas.getContext("webgl2", options)

        this.capabilities = new GlCapabilities(this.gl)
        this.infos = new GlInfos(this.gl)

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
    freeAllGlArrayBuffer(/** @type {GlArrayBufferData} */ glArrayBufferData) {
        for (const arrayBuffer of this.#arrayBuffers.values()) {
            arrayBuffer.dispose()
        }
        this.#arrayBuffers.clear()
    }

    /** @type {Map<GlProgramData, GlProgram>} */ #programs = new Map()
    getGlProgram(/** @type {GlProgramData} */ glProgramData) {
        if (!this.#programs.has(glProgramData)) {
            this.#programs.set(glProgramData, new GlProgram(this, glProgramData))
        }
        return this.#programs.get(glProgramData)
    }
    freeGlProgram(/** @type {GlProgramData} */ glProgramData) {
        this.#programs.get(glProgramData)?.dispose()
        this.#programs.delete(glProgramData)
    }
    freeAllGlProgram(/** @type {GlProgramData} */ glProgramData) {
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
    
    /** @type {Map<GlVaoData, GlVao>} */ #vaos = new Map()
    getGlVao(/** @type {GlVaoData} */ glVaoData) {
        if (!this.#vaos.has(glVaoData)) {
            this.#vaos.set(glVaoData, new GlVao(this, glVaoData))
        }
        return this.#vaos.get(glVaoData)
    }
    freeGlVao(/** @type {GlVaoData} */ glVaoData) {
        this.#vaos.get(glVaoData)?.dispose()
        this.#vaos.delete(glVaoData)
    }
    freeAllGlVao() {
        for (const ubo of this.#vaos.values()) ubo.dispose()
        this.#vaos.clear()
    }

    /** @type {Set<(width: number, height: number) => void>} */
    resizeListeners = new Set()

    #resizeListener() {
        const width = this.gl.canvas.scrollWidth || 1
        const height = this.gl.canvas.scrollHeight || 1
        this.gl.canvas.width = width
        this.gl.canvas.height = height
        this.gl.viewport(0, 0, width, height)
        for (const cb of this.resizeListeners) cb(width, height)
    }
    #resizeObserver = new ResizeObserver(this.#resizeListener.bind(this))
}
