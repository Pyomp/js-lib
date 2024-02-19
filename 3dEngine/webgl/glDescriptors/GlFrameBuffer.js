import { GlArrayBuffer } from "./GlArrayBuffer.js"
import { GlTexture } from "./GlTexture.js"

export class GlFrameBuffer {
    needsDelete = false

    /**
     * @param {{ [attachment: GLenum]: GlTexture | GlArrayBuffer}} attachments 
     */
    constructor(attachments) {
        this.attachments = attachments
    }
}
