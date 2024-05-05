import { Box3 } from "../../../math/Box3.js"
import { Vector3 } from "../../../math/Vector3.js"
import { GlAttribute } from "./GlAttribute.js"

export class GlVao {
    needsDelete = false

    boundingBox = new Box3(new Vector3(-Infinity, -Infinity, -Infinity), new Vector3(Infinity, Infinity, Infinity),)

    /**
     * @param {GlAttribute[]} attributes
     * @param {Uint8Array | Uint16Array | Uint32Array | undefined} indicesUintArray
     */
    constructor(attributes, indicesUintArray = undefined) {
        this.attributes = attributes
        this.indicesUintArray = indicesUintArray
        this.computeBoundingBox()
    }

    computeBoundingBox() {
        for (const attributeName in this.attributes) {
            if (attributeName.toLowerCase().includes('position')) {
                const array = this.attributes[attributeName].glArrayBuffer.arrayBuffer
                this.boundingBox.setFromArray(array)
                return
            }
        }
    }
}
