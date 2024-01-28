import { Box3 } from "../../../math/Box3.js"
import { GlAttributeData } from "./GlAttributeData.js"

export class GlVaoData {
    needsDelete = false

    boundingBox = new Box3()

    /**
     * @param {GlAttributeData[]} attributesData
     * @param {Uint8Array | Uint16Array | Uint32Array} indicesUintArray
     */
    constructor(attributesData, indicesUintArray = undefined) {
        this.attributesData = attributesData
        this.indicesUintArray = indicesUintArray
        this.computeBoundingBox()
    }

    computeBoundingBox() {
        for (const attributeName in this.attributesData) {
            if (attributeName.toLowerCase().includes('position')) {
                const array = new Float32Array(this.attributesData[attributeName].glArrayBufferData.arrayBuffer)
                this.boundingBox.setFromArray(array)
                return
            }
        }
    }
}
