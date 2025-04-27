import { Box3 } from "../../../math/Box3.js"
import { Vector3 } from "../../../math/Vector3.js"
import { GlAttribute } from "./GlAttribute.js"

const _vector3 = new Vector3()

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
        for (const attribute of this.attributes) {
            if (attribute.name.toLowerCase().includes('position')) {
                const array = attribute.glArrayBuffer.arrayBuffer
                const stride = attribute.stride > 0 ? attribute.stride / array.BYTES_PER_ELEMENT : 3
                const offset = attribute.offset / array.BYTES_PER_ELEMENT
                this.boundingBox.makeEmpty()
                for (let i = 0; i < array.length; i += stride) {
                    this.boundingBox.expandByPoint(
                        _vector3.fromArray(array, i + offset)
                    )
                }
                break
            }
        }
    }
}
