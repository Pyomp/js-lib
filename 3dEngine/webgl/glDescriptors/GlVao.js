import { Box3 } from "../../../math/Box3.js"
import { GlAttribute } from "./GlAttribute.js"

export class GlVao {
    needsDelete = false

    boundingBox = new Box3()

    /**
     * @param {GlAttribute[]} attributes
     * @param {Uint8Array | Uint16Array | Uint32Array} indicesUintArray
     */
    constructor(attributes, indicesUintArray = undefined) {
        this.attributes = attributes
        this.indicesUintArray = indicesUintArray
        this.computeBoundingBox()
    }

    computeBoundingBox() {
        for (const attributeName in this.attributes) {
            if (attributeName.toLowerCase().includes('position')) {
                const array = new Float32Array(this.attributes[attributeName].glArrayBuffer.arrayBuffer)
                this.boundingBox.setFromArray(array)
                return
            }
        }
    }
}
