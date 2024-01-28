import { GlFrameBufferData } from "../glDescriptors/GlFrameBufferData.js"
import { GlTextureData } from "../glDescriptors/GlTextureData.js"
import { GlContext } from "./GlContext.js"

export class GlFrameBuffer {
    #glFrameBufferData
    #glContext
    #gl
    glFrameBuffer

    /**
     * 
     * @param {GlContext} glContext 
     * @param {GlFrameBufferData} glFrameBufferData 
     */
    constructor(glContext, glFrameBufferData) {
        this.#glFrameBufferData = glFrameBufferData
        this.#glContext = glContext
        this.#gl = glContext.gl
        this.glFrameBuffer = this.#gl.createFramebuffer()
        this.#updateAttachments()
    }

    #framebufferTexture2D(attachment, glTextureData) {
        this.#gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.glFrameBuffer)
        const glTexture = this.#glContext.getGlTexture(glTextureData)
        glTexture.attachToBoundFrameBuffer(attachment)
    }

    #updateAttachments() {
        for (const attachment in this.#glFrameBufferData.attachments) {
            const glData = this.#glFrameBufferData.attachments[attachment]
            if (glData instanceof GlTextureData) {
                this.#framebufferTexture2D(parseInt(attachment), glData)
            }
        }
    }

    /**
     * 
     * @param {GlFrameBufferData | null} sourceGlFrameBufferData 
     * @param {GLuint} srcX1
     * @param {GLuint} srcY1
     * @param {GLenum} mask 
     * @param {GLenum} filter 
     */
    blit(
        sourceGlFrameBufferData,
        srcX1,
        srcY1,
        mask = WebGL2RenderingContext.DEPTH_BUFFER_BIT,
        filter = WebGL2RenderingContext.NEAREST,
        srcX0 = 0, srcY0 = 0, dstX0 = srcX0, dstY0 = srcY0, dstX1 = srcX1, dstY1 = srcY1
    ) {
        const source = sourceGlFrameBufferData ? this.#glContext.getGlFrameBuffer(sourceGlFrameBufferData).glFrameBuffer : null
        this.#gl.bindFramebuffer(WebGL2RenderingContext.READ_FRAMEBUFFER, source)
        this.#gl.bindFramebuffer(WebGL2RenderingContext.DRAW_FRAMEBUFFER, this.glFrameBuffer)
        this.#gl.blitFramebuffer(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter)
    }

    dispose() {
        this.#gl.deleteFramebuffer(this.glFrameBuffer)
    }
}
