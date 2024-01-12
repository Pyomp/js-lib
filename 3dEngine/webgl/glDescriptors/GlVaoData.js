import { Box3 } from "../../../math/Box3.js"
import { Attribute } from "../../sceneGraph/Attribute.js"
import { GlArrayBufferData } from "./GlArrayBufferData.js"
import { GlAttributeData } from "./GlAttributeData.js"

export class GlVaoData {
    needsDelete = false

    /**
     * @param {GlArrayBufferData[]} arrayBuffersData
     * @param {GlAttributeData[]} attributesData
     * @param {Uint8Array | Uint16Array | Uint32Array} indicesUintArray
     */
    constructor(arrayBuffersData, attributesData, indicesUintArray = undefined) {
        this.arrayBuffersData = arrayBuffersData
        this.attributesData = attributesData
        this.indicesUintArray = indicesUintArray
    }
}
