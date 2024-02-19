import { GlArrayBuffer } from "./GlArrayBuffer.js"

export class GlTransformFeedback {
    /**
     * @param {{[name: string]: GlArrayBuffer} | GlArrayBuffer} glArrayBuffer
     * @param {string[]} outVaryings
     */
    constructor(glArrayBuffer, outVaryings) {
        this.outVaryings = outVaryings
        this.glArrayBuffer = glArrayBuffer
        if (glArrayBuffer instanceof Array) {
            this.bufferMode = WebGL2RenderingContext.SEPARATE_ATTRIBS
        } else {
            this.bufferMode = WebGL2RenderingContext.INTERLEAVED_ATTRIBS
        }
    }
}
