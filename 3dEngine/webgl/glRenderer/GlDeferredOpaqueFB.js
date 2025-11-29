import { GlTextureDepthData } from "../../textures/GlTextureDepthData.js"
import { GlContextRenderer } from "../glContext/GlContextRenderer.js"
import { GlFrameBuffer } from "../glDescriptors/GlFrameBuffer.js"
import { GlObject } from "../glDescriptors/GlObject.js"
import { GlTexture } from "../glDescriptors/GlTexture.js"

export class GlDeferredOpaqueFB {
    /** @type {GlContextRenderer} */ #glContext
    #width = 1
    #height = 1

    depthTexture = new GlTextureDepthData()

    deferredTextures = {
        color: new GlTexture({
            name: 'objectColorTexture',
            wrapS: 'CLAMP_TO_EDGE', wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST', magFilter: 'NEAREST',
            internalformat: 'RGB8',
            width: 1, height: 1, border: 0,
            format: 'RGB', type: 'UNSIGNED_BYTE',
            data: null,
            needsMipmap: false
        }),
        positionDepth: new GlTexture({
            name: 'objectPositionTexture',
            wrapS: 'CLAMP_TO_EDGE', wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST', magFilter: 'NEAREST',
            internalformat: 'RGBA32I',
            width: 1, height: 1, border: 0,
            format: 'RGBA_INTEGER', type: 'INT',
            data: null,
            needsMipmap: false
        }),
        normal: new GlTexture({
            name: 'objectNormalTexture',
            wrapS: 'CLAMP_TO_EDGE', wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST', magFilter: 'NEAREST',
            internalformat: 'RGBA32I',
            width: 1, height: 1, border: 0,
            format: 'RGBA_INTEGER', type: 'INT',
            data: null,
            needsMipmap: false
        })
    }

    #opaqueFrameBuffer = new GlFrameBuffer({
        [WebGL2RenderingContext.COLOR_ATTACHMENT0]: this.deferredTextures.color,
        [WebGL2RenderingContext.COLOR_ATTACHMENT1]: this.deferredTextures.positionDepth,
        [WebGL2RenderingContext.COLOR_ATTACHMENT2]: this.deferredTextures.normal,
        [WebGL2RenderingContext.DEPTH_ATTACHMENT]: this.depthTexture
    })

    initGl(
        /** @type {GlContextRenderer} */ glContext,
    ) {
        this.#glContext = glContext
        glContext.resizeListeners.add(this.onResize.bind(this))
    }

    onResize(
        /** @type {number} */ width,
        /** @type {number} */  height
    ) {
        this.depthTexture.resize(width, height)
        this.deferredTextures.color.resize(width, height)
        this.deferredTextures.positionDepth.resize(width, height)
        this.deferredTextures.normal.resize(width, height)
        this.#width = width
        this.#height = height
    }

    render(
        /** @type {GlObject[]} */ objects
    ) {
        const gl = this.#glContext.gl

        const glOpaqueFrameBuffer = this.#glContext.getGlFrameBuffer(this.#opaqueFrameBuffer)
        glOpaqueFrameBuffer.bind()

        gl.enable(WebGL2RenderingContext.CULL_FACE)
        this.#glContext.glCapabilities.setFrontFace()
        gl.enable(WebGL2RenderingContext.DEPTH_TEST)
        gl.depthMask(true)
        gl.disable(WebGL2RenderingContext.BLEND)
        this.#glContext.glCapabilities.setNormalBlending()

        gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0.0, 0.0, 0.0, 0.0]))
        gl.clearBufferiv(gl.COLOR, 1, new Int32Array([0, 0, 0, 2147483647]))
        gl.clearBufferiv(gl.COLOR, 2, new Int32Array([0, 0, 0, 0]))
        gl.clearBufferfi(gl.DEPTH_STENCIL, 0, 1.0, 0)

        for (const object of objects) this.#glContext.drawObject(object)
    }

    blitDepthBufferTo(
        /** @type {GlFrameBuffer | null} */ destGlFrameBuffer
    ) {
        const glOpaqueFrameBuffer = this.#glContext.getGlFrameBuffer(this.#opaqueFrameBuffer)

        glOpaqueFrameBuffer.blitTo(
            destGlFrameBuffer,
            this.#width,
            this.#height,
            WebGL2RenderingContext.DEPTH_BUFFER_BIT
        )
    }
}
