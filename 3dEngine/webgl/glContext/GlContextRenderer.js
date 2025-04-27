import { GlArrayBufferRenderer } from "./GlArrayBufferRenderer.js"
import { GlArrayBuffer } from "../glDescriptors/GlArrayBuffer.js"
import { GlCapabilitiesRenderer } from "./GlCapabilitiesRenderer.js"
import { GlInfosRenderer } from "./GlInfosRenderer.js"
import { GlProgram } from "../glDescriptors/GlProgram.js"
import { GlProgramRenderer } from "./GlProgramRenderer.js"
import { GlTextureRenderer } from "./GlTextureRenderer.js"
import { GlTexture } from "../glDescriptors/GlTexture.js"
import { GlUboRenderer } from "./GlUboRenderer.js"
import { GlUbo } from "../glDescriptors/GlUbo.js"
import { GlObject } from "../glDescriptors/GlObject.js"
import { GlFrameBuffer } from "../glDescriptors/GlFrameBuffer.js"
import { GlFrameBufferRenderer } from "./GlFrameBufferRenderer.js"
import { GlVaoRenderer } from "./GlVaoRenderer.js"

export class GlContextRenderer {
    #globalUbos
    /** @type {{[uniformName: string]: number}} */
    #globalUbosIndex = {}
    /** @type {WebGL2RenderingContext} */ gl

    /**
    * @param {HTMLCanvasElement} canvas 
    * @param {WebGLContextAttributes} options
    * @param {{[uniformName: string]: GlUbo}} globalUbos
    */
    constructor(
        canvas = document.createElement('canvas'),
        options = {
            alpha: true,
            antialias: true,
            depth: true,
            failIfMajorPerformanceCaveat: false,
            powerPreference: 'default',
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            stencil: false
        },
        globalUbos = {},
    ) {
        this.canvas = canvas
        // @ts-ignore no 3D no game
        this.gl = canvas.getContext("webgl2", options)

        this.glCapabilities = new GlCapabilitiesRenderer(this.gl)
        this.glInfos = new GlInfosRenderer(this.gl)

        this.#globalUbos = globalUbos
        this.#globalUbosIndex = {}

        let i = 0
        for (const uboUniformName in this.#globalUbos) {
            const glUbo = this.#globalUbos[uboUniformName]
            this.#globalUbosIndex[uboUniformName] = i
            this.getGlUbo(glUbo).bindToIndex(i)
            i++
        }

        this.#resizeObserver.observe(canvas)
    }

    /** @type {Map<GlArrayBuffer, GlArrayBufferRenderer>} */ #arrayBuffers = new Map()
    /** @returns {GlArrayBufferRenderer} */
    /** @returns {GlArrayBufferRenderer} */
    getGlArrayBuffer(/** @type {GlArrayBuffer} */ glArrayBuffer) {
        if (!this.#arrayBuffers.has(glArrayBuffer)) {
            this.#arrayBuffers.set(glArrayBuffer, new GlArrayBufferRenderer(this, glArrayBuffer))
        }
        // @ts-ignore
        return this.#arrayBuffers.get(glArrayBuffer)
    }
    freeGlArrayBuffer(/** @type {GlArrayBuffer} */ glArrayBuffer) {
        this.#arrayBuffers.get(glArrayBuffer)?.dispose()
        this.#arrayBuffers.delete(glArrayBuffer)
    }
    freeAllGlArrayBuffer() {
        for (const arrayBuffer of this.#arrayBuffers.values()) {
            arrayBuffer.dispose()
        }
        this.#arrayBuffers.clear()
    }

    /** @type {Map<GlProgram, GlProgramRenderer>} */ #programs = new Map()
    /** @returns {GlProgramRenderer} */
    getGlProgram(/** @type {GlProgram} */ glProgram) {
        if (!this.#programs.has(glProgram)) {
            this.#programs.set(glProgram, new GlProgramRenderer(this, glProgram, this.#globalUbosIndex))
        }
        // @ts-ignore
        return this.#programs.get(glProgram)
    }
    freeGlProgram(/** @type {GlProgram} */ glProgram) {
        this.#programs.get(glProgram)?.dispose()
        this.#programs.delete(glProgram)
    }
    freeAllGlProgram() {
        for (const program of this.#programs.values()) {
            program.dispose()
        }
        this.#programs.clear()
    }

    /** @type {Map<GlTexture, GlTextureRenderer>} */ #textures = new Map()
    /** @returns {GlTextureRenderer} */
    getGlTexture(/** @type {GlTexture} */ glTexture) {
        if (!this.#textures.has(glTexture)) {
            this.#textures.set(glTexture, new GlTextureRenderer(this, glTexture))
        }
        // @ts-ignore
        return this.#textures.get(glTexture)
    }
    freeGlTexture(/** @type {GlTexture} */ glTexture) {
        this.#textures.get(glTexture)?.dispose()
        this.#textures.delete(glTexture)
    }
    freeAllGlTexture() {
        for (const texture of this.#textures.values()) {
            texture.dispose()
        }
        this.#textures.clear()
    }

    /** @type {Map<GlUbo, GlUboRenderer>} */ #ubos = new Map()
    /** @returns {GlUboRenderer} */
    getGlUbo(/** @type {GlUbo} */ glUbo) {
        if (!this.#ubos.has(glUbo)) {
            this.#ubos.set(glUbo, new GlUboRenderer(this, glUbo))
        }

        // @ts-ignore
        return this.#ubos.get(glUbo)
    }
    freeGlUbo(/** @type {GlUbo} */ glUbo) {
        this.#ubos.get(glUbo)?.dispose()
        this.#ubos.delete(glUbo)
    }
    freeAllGlUbo() {
        for (const ubo of this.#ubos.values()) ubo.dispose()
        this.#ubos.clear()
    }

    /** @type {Map<GlFrameBuffer, GlFrameBufferRenderer>} */ #frameBuffers = new Map()


    /** @returns {GlFrameBufferRenderer} */
    getGlFrameBuffer(/** @type {GlFrameBuffer} */ glFrameBuffer) {
        if (!this.#frameBuffers.has(glFrameBuffer)) {
            this.#frameBuffers.set(glFrameBuffer, new GlFrameBufferRenderer(this, glFrameBuffer))
        }

        // @ts-ignore
        return this.#frameBuffers.get(glFrameBuffer)
    }

    freeGlFrameBuffer(/** @type {GlFrameBuffer} */ glFrameBuffer) {
        this.#frameBuffers.get(glFrameBuffer)?.dispose()
        this.#frameBuffers.delete(glFrameBuffer)
    }
    freeAllGlFrameBuffer() {
        for (const frameBuffer of this.#frameBuffers.values()) frameBuffer.dispose()
        this.#frameBuffers.clear()
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
        for (const glUbo of Object.values(this.#globalUbos)) {
            if (this.getGlUbo(glUbo).update()) {
                this.freeAllGlProgram()
            }
        }
    }

    updateCache() {
        for (const [arrayBuffer, glArrayBuffer] of this.#arrayBuffers) {
            if (arrayBuffer.needsDelete) {
                glArrayBuffer.dispose()
                this.#arrayBuffers.delete(arrayBuffer)
            }
        }

        for (const [program, glProgram] of this.#programs) {
            glProgram.updateVaoCache()
            if (program.needsDelete) {
                glProgram.dispose()
                this.#programs.delete(program)
            }
        }

        for (const [texture, glTexture] of this.#textures) {
            if (texture.needsDelete) {
                glTexture.dispose()
                this.#textures.delete(texture)
            }
        }

        for (const [ubo, glUbo] of this.#ubos) {
            if (ubo.needsDelete) {
                glUbo.dispose()
                this.#ubos.delete(ubo)
            }
        }
    }

    /** @type {GlProgramRenderer | undefined} */ #currentProgram
    /** @type {GlVaoRenderer | undefined} */ #currentVao
    drawObject(/** @type {GlObject} */ glObject) {
        if (glObject.additiveBlending) this.glCapabilities.setAdditiveBlending()
        else if (glObject.normalBlending) this.glCapabilities.setNormalBlending()
        else if (glObject.multiplyBlending) this.glCapabilities.setMultiplyBlending()
        else if (glObject.subtractiveBlending) this.glCapabilities.setMultiplyBlending()
        else this.glCapabilities.blending = false

        this.glCapabilities.depthTest = glObject.depthTest
        this.glCapabilities.depthWrite = glObject.depthWrite
        this.glCapabilities.depthFunc = glObject.depthFunc

        let isDoubleSide = glObject.frontCullFace && glObject.backCullFace

        if (isDoubleSide) {
            this.glCapabilities.cullFace = true
            this.glCapabilities.setBackFace()
        } else if (glObject.frontCullFace) {
            this.glCapabilities.cullFace = true
            this.glCapabilities.setFrontFace()
        } else if (glObject.backCullFace) {
            this.glCapabilities.cullFace = true
            this.glCapabilities.setBackFace()
        } else {
            this.glCapabilities.cullFace = false
        }

        const glProgram = this.getGlProgram(glObject.glProgram)

        if (this.#currentProgram !== glProgram) {
            this.#currentProgram = glProgram
            glProgram.useProgram()
        }

        for (const name in glObject.uniforms) {
            const uniform = glObject.uniforms[name]
            if (uniform instanceof GlTexture) {
                if (glProgram.textureUnit[name] !== undefined) {
                    this.getGlTexture(uniform).bindToUnit(glProgram.textureUnit[name])
                }
            } else {
                glProgram.uniformUpdate[name]?.(uniform)
            }
        }

        for (const name in glObject.glUbos) {
            if (glProgram.uboIndex[name] !== undefined) {
                const glUbo = glObject.glUbos[name]
                this.getGlUbo(glUbo).bindToIndex(glProgram.uboIndex[name])
            }
        }

        const glVao = glObject.glVao && glProgram.getGlVao(glObject.glVao)

        if (glVao) {
            glVao.updateBufferSubData()
            if (this.#currentVao !== glVao) {
                this.#currentVao = glVao
                glVao.bind()
            }
        }


        if (glObject.glProgram.glTransformFeedback) {
            glProgram.bindTransformFeedback()
            this.gl.beginTransformFeedback(WebGL2RenderingContext.POINTS)
            this.gl.drawArrays(WebGL2RenderingContext.POINTS, glObject.offset, glObject.count)
            this.gl.endTransformFeedback()
        } else if (glVao && glVao.indicesType !== -1) {
            this.gl.drawElements(glObject.drawMode, glObject.count, glVao.indicesType, glObject.offset)
            if (isDoubleSide) {
                this.glCapabilities.setFrontFace()
                this.gl.drawElements(glObject.drawMode, glObject.count, glVao.indicesType, glObject.offset)
            }
        } else {
            this.gl.drawArrays(glObject.drawMode, glObject.offset, glObject.count)
            if (isDoubleSide) {
                this.glCapabilities.setFrontFace()
                this.gl.drawArrays(glObject.drawMode, glObject.offset, glObject.count)
            }
        }
    }

    discardRasterizer() {
        this.gl.enable(WebGL2RenderingContext.RASTERIZER_DISCARD)
        this.gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, null)
        this.gl.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, null)
    }

    enableRasterizer() {
        this.gl.disable(WebGL2RenderingContext.RASTERIZER_DISCARD)
        this.gl.bindTransformFeedback(WebGL2RenderingContext.TRANSFORM_FEEDBACK, null)
    }

    copyBufferSubData(
        /** @type {GlArrayBuffer} */ glArrayBufferSource,
        /** @type {GlArrayBuffer} */ glArrayBufferTarget,
        /** @type {number | undefined} */ offsetSource = undefined,
        /** @type {number | undefined} */ offsetTarget = undefined,
        /** @type {number | undefined} */ size = undefined
    ) {
        const source = this.getGlArrayBuffer(glArrayBufferSource)
        const target = this.getGlArrayBuffer(glArrayBufferTarget)
        source.copyTo(target, offsetSource, offsetTarget, size)
    }
}
