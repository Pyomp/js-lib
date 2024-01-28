export class GlArrayBufferData {
    version = -1

    needsDelete = false

    /**
     * 
     * @param {WebGl.Attribute.data} arrayBuffer
     * @param {WebGl.Attribute.usage | number} usage
     */
    constructor(
        arrayBuffer,
        usage = 'STATIC_DRAW'
    ) {
        this.arrayBuffer = arrayBuffer
        this.usage = WebGL2RenderingContext[usage] ?? usage
    }
}
