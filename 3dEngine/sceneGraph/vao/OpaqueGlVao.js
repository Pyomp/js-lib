import { getDefinedOrThrow } from "../../../utils/utils.js"
import { GLSL_COMMON } from "../../programs/chunks/glslCommon.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"

export class OpaqueGlVao extends GlVao {
    static fromGltfPrimitive(/** @type {GltfPrimitive} */ primitive) {
        return new OpaqueGlVao({
            indices: getDefinedOrThrow(primitive.indices?.buffer),
            position: getDefinedOrThrow(primitive.attributes.POSITION?.buffer),
            uv: getDefinedOrThrow(primitive.attributes.TEXCOORD_0?.buffer),
            normal: getDefinedOrThrow(primitive.attributes.NORMAL?.buffer),
        })
    }

    static fromGltfNodeFirstPrimitive(
        /** @type {GltfNode} */ gltfNode
    ){
        return OpaqueGlVao.fromGltfPrimitive(getDefinedOrThrow(gltfNode.mesh?.primitives[0]))
    }

    /**
     * @param {{
     *      indices: Uint8Array | Uint16Array | Uint32Array
     *      position: Float32Array
     *      uv: Float32Array
     *      normal: Float32Array
     * }} args
    */
    constructor({ indices, position, uv, normal }) {
        super([
            ...GLSL_COMMON.createAttributes(position, uv, normal)
        ], indices)
    }
}
