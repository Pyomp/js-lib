import { GlTransformFeedbackData } from "./GlTransformFeedbackData.js"

export class GlProgramData {
    version = 0

    needsDelete = false

    /**
     * @param {() => string} vertexShader 
     * @param {() => string} fragmentShader 
     * @param {GlTransformFeedbackData?} glTransformFeedbackData 
     */
    constructor(
        vertexShader,
        fragmentShader,
        glTransformFeedbackData = undefined
    ) {
        this.vertexShader = vertexShader
        this.fragmentShader = fragmentShader
        this.glTransformFeedbackData = glTransformFeedbackData
    }
}
