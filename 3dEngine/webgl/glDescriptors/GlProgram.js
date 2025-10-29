import { GlTransformFeedback } from "./GlTransformFeedback.js"

export class GlProgram {
    version = 0

    needsDelete = false

    isDeferred = false

    /**
     * @param {(renderingContext: WebGl.RenderingContext) => string} vertexShader 
     * @param {(renderingContext: WebGl.RenderingContext) => string} fragmentShader 
     * @param {GlTransformFeedback | undefined} glTransformFeedback 
     */
    constructor(
        vertexShader,
        fragmentShader,
        glTransformFeedback = undefined,
    ) {
        this.vertexShader = vertexShader
        this.fragmentShader = fragmentShader
        this.glTransformFeedback = glTransformFeedback
    }

    dispose() {
        this.needsDelete = true
    }
}
