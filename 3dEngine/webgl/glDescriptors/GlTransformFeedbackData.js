import { GlArrayBufferData } from "./GlArrayBufferData.js"

export class GlTransformFeedbackData {
    /**
     * @param {{[name: string]: GlArrayBufferData} | GlArrayBufferData} glArrayBufferData
     * @param {string[]} outVaryings
     */
    constructor(glArrayBufferData, outVaryings) {
        this.outVaryings = outVaryings
        this.glArrayBufferData = glArrayBufferData
        if (glArrayBufferData instanceof Array) {
            this.bufferMode = WebGL2RenderingContext.SEPARATE_ATTRIBS
        } else {
            this.bufferMode = WebGL2RenderingContext.INTERLEAVED_ATTRIBS
        }
    }
}
