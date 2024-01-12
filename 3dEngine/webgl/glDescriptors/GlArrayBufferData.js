export class GlArrayBufferData {
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
