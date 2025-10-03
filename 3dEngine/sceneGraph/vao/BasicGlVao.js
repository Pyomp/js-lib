import { getDefinedOrThrow } from "../../../utils/utils.js"
import { BasicGlProgram } from "../../programs/BasicGlProgram.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"

export class BasicGlVao extends GlVao {
    static fromGltfPrimitive(/** @type {GltfPrimitive} */ primitive) {
        return new BasicGlVao({
            indices: getDefinedOrThrow(primitive.indices?.buffer),
            position: getDefinedOrThrow(primitive.attributes.POSITION?.buffer),
            uv: getDefinedOrThrow(primitive.attributes.TEXCOORD_0?.buffer),
        })
    }

    static fromGltfNodeFirstPrimitive(
        /** @type {GltfNode} */ gltfNode
    ){
        return BasicGlVao.fromGltfPrimitive(getDefinedOrThrow(gltfNode.mesh?.primitives[0]))
    }

    /**
     * @param {{
     *      indices: Uint8Array | Uint16Array | Uint32Array
     *      position: Float32Array
     *      uv: Float32Array
     * }} args
    */
    constructor({ indices, position, uv }) {
        super([
            ...BasicGlProgram.createAttributes(position, uv)
        ], indices)
    }
}
