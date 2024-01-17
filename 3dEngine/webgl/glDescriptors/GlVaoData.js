import { GlAttributeData } from "./GlAttributeData.js"

export class GlVaoData {
    needsDelete = false

    /**
     * @param {GlAttributeData[]} attributesData
     * @param {Uint8Array | Uint16Array | Uint32Array} indicesUintArray
     */
    constructor(attributesData, indicesUintArray = undefined) {
        this.attributesData = attributesData
        this.indicesUintArray = indicesUintArray
    }
}
