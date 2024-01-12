import { GlArrayBufferData } from "./GlArrayBufferData.js"
import { GlProgramData } from "./GlProgramData.js"

export class GlTransformFeedbackData {
    /**
     * @param {GlProgramData} glProgramData
     * @param {{[name: string]: GlArrayBufferData}} glArrayBufferDatas
     */
    constructor(glProgramData, glArrayBufferDatas) {
        this.glProgramData = glProgramData
        this.glArrayBufferDatas = glArrayBufferDatas
    }
}
