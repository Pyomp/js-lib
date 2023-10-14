import { Attribute } from "./Attribute.js"

export class Geometry {
    /** @type {{[name: string]: Attribute}} */ attributes = {}

    /** @type {Uint16Array} */ indices = null

    offset = 0
    count

    /**
     * 
     * @param {{[name: string]: WebGl.Attribute.data}} attributes 
     * @param {number} count 
     * @param {Uint16Array} indices 
     */
    constructor(attributes, count, indices) {
        for (const name in attributes) {
            const attribute = attributes[name]
            this.attributes[name] = new Attribute(attribute)
        }

        this.indices = indices

        this.count = count
    }
}
