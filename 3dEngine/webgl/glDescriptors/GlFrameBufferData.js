import { GlArrayBufferData } from "./GlArrayBufferData.js"
import { GlTextureData } from "./GlTextureData.js"

export class GlFrameBufferData {
    needsDelete = false

    /**
     * @param {{ [attachment: GLenum]: GlTextureData | GlArrayBufferData}} attachments 
     */
    constructor(attachments) {
        this.attachments = attachments
    }
}
