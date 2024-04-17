export class GlArrayBuffer {
    version = -1
    startToUpdate = Infinity
    endToUpdate = 0

    setNeedsUpdate(start, end) {
        this.startToUpdate = Math.min(this.startToUpdate, start)
        this.endToUpdate = Math.max(this.endToUpdate, end)
    }

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
