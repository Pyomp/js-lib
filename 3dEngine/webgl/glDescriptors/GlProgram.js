import { GlTransformFeedback } from "./GlTransformFeedback.js"

export class GlProgram {
    version = 0

    needsDelete = false

    /**
     * @param {() => string} vertexShader 
     * @param {() => string} fragmentShader 
     * @param {GlTransformFeedback?} glTransformFeedback 
     */
    constructor(
        vertexShader,
        fragmentShader,
        glTransformFeedback = undefined
    ) {
        this.vertexShader = vertexShader
        this.fragmentShader = fragmentShader
        this.glTransformFeedback = glTransformFeedback
    }

    dispose(){
        this.needsDelete = true
    }
}
