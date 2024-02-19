import { GlFrameBuffer } from "../glDescriptors/GlFrameBuffer.js"
import { GlTexture } from "../glDescriptors/GlTexture.js"
import { GlContextRenderer } from "./GlContextRenderer.js"

export class GlFrameBufferRenderer {
    #glFrameBuffer
    #glContext
    #gl
    glFrameBuffer

    /**
     * 
     * @param {GlContextRenderer} glContext 
     * @param {GlFrameBuffer} glFrameBuffer 
     */
    constructor(glContext, glFrameBuffer) {
        this.#glFrameBuffer = glFrameBuffer
        this.#glContext = glContext
        this.#gl = glContext.gl
        this.glFrameBuffer = this.#gl.createFramebuffer()
        this.#updateAttachments()
    }

    #framebufferTexture2D(attachment, glTexture) {
        this.#gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.glFrameBuffer)
        const glTextureRenderer = this.#glContext.getGlTexture(glTexture)
        glTextureRenderer.attachToBoundFrameBuffer(attachment)
    }

    #updateAttachments() {
        for (const attachment in this.#glFrameBuffer.attachments) {
            const glData = this.#glFrameBuffer.attachments[attachment]
            if (glData instanceof GlTexture) {
                this.#framebufferTexture2D(parseInt(attachment), glData)
            }
        }
    }

    /**
     * 
     * @param {GlFrameBuffer | null} sourceGlFrameBuffer 
     * @param {GLuint} srcX1
     * @param {GLuint} srcY1
     * @param {GLenum} mask 
     * @param {GLenum} filter 
     */
    blit(
        sourceGlFrameBuffer,
        srcX1,
        srcY1,
        mask = WebGL2RenderingContext.DEPTH_BUFFER_BIT,
        filter = WebGL2RenderingContext.NEAREST,
        srcX0 = 0, srcY0 = 0, dstX0 = srcX0, dstY0 = srcY0, dstX1 = srcX1, dstY1 = srcY1
    ) {
        const source = sourceGlFrameBuffer ? this.#glContext.getGlFrameBuffer(sourceGlFrameBuffer).glFrameBuffer : null
        this.#gl.bindFramebuffer(WebGL2RenderingContext.READ_FRAMEBUFFER, source)
        this.#gl.bindFramebuffer(WebGL2RenderingContext.DRAW_FRAMEBUFFER, this.glFrameBuffer)
        this.#gl.blitFramebuffer(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter)
    }

    dispose() {
        this.#gl.deleteFramebuffer(this.glFrameBuffer)
    }
}
