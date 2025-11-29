import { GlArrayBuffer } from "./GlArrayBuffer.js"
import { GlRenderBuffer } from "./GlRenderBuffer.js"
import { GlTexture } from "./GlTexture.js"

export class GlFrameBuffer {
    needsDelete = false

    /**
     * @param {{ [attachment: GLenum]: GlTexture | GlArrayBuffer | GlRenderBuffer}} attachments 
     */
    constructor(attachments) {
        this.attachments = attachments
    }
}
