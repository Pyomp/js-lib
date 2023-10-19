import { Box3 } from "../../math/Box3.js"
import { Attribute } from "./Attribute.js"

export class Geometry {
    /** @type {{[name: string]: Attribute}} */ attributes

    /** @type {Uint16Array | undefined} */ indices

    offset = 0

    count

    boundingBox = new Box3()

    /**
     * 
     * @param {{[name: string]: WebGl.Attribute.data}?} attributes 
     * @param {number} count 
     * @param {Uint16Array?} indices 
     */
    constructor(count, attributes = undefined, indices = undefined) {
        if (attributes) {
            this.attributes = {}
            for (const name in attributes) {
                const attribute = attributes[name]
                this.attributes[name] = new Attribute(attribute)
            }
        }

        this.indices = indices

        this.count = count
    }
}
