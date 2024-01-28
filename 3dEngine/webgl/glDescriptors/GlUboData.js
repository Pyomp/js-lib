export class GlUboData {
    needsDelete = false

    version = 0

    /**
     * @param {number} byteLength
     * @param {WebGl.Attribute.usage | number} usage
     */
    constructor(byteLength, usage = WebGL2RenderingContext.DYNAMIC_DRAW) {
        this.usage = WebGL2RenderingContext[usage] ?? usage
        this.arrayBuffer = new ArrayBuffer(byteLength)
    }

    setNewByteLength(byteLength) {
        this.arrayBuffer = new ArrayBuffer(byteLength)
    }
}
