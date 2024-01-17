export class GlProgramData {
    version = 0

    needsDelete = false

    /**
     * 
     * @param {()=>string} vertexShader 
     * @param {()=>string} fragmentShader 
     * @param {string[]} outVaryings 
     */
    constructor(
        vertexShader,
        fragmentShader,
        outVaryings = []
    ) {
        this.vertexShader = vertexShader
        this.fragmentShader = fragmentShader
        this.outVaryings = outVaryings
    }
}
