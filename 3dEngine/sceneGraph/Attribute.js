export class Attribute {
    needsUpdate = false

    /**
     * 
     * @param {WebGl.Attribute.data} data 
     * @param {WebGl.Attribute.usage} usage
     */
    constructor(data, usage = 'STATIC_DRAW') {
        this.data = data
        this.usage = usage
    }
}
