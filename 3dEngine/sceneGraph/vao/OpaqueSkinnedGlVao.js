import { getDefinedOrThrow } from "../../../utils/utils.js"
import { GLSL_COMMON } from "../../programs/chunks/glslCommon.js"
import { GLSL_SKINNED } from "../../programs/chunks/glslSkinnedChunk.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"

export class OpaqueSkinnedGlVao extends GlVao {
    static fromGltfPrimitive(/** @type {GltfPrimitive} */ primitive) {
        return new OpaqueSkinnedGlVao({
            indices: getDefinedOrThrow(primitive.indices?.buffer),
            position: getDefinedOrThrow(primitive.attributes.POSITION?.buffer),
            uv: getDefinedOrThrow(primitive.attributes.TEXCOORD_0?.buffer),
            normal: getDefinedOrThrow(primitive.attributes.NORMAL?.buffer),
            joints: getDefinedOrThrow(primitive.attributes.JOINTS_0?.buffer),
            weights: getDefinedOrThrow(primitive.attributes.WEIGHTS_0?.buffer)
        })
    }

    /**
     * @param {{
     *      indices: Uint8Array | Uint16Array | Uint32Array
     *      position: Float32Array
     *      uv: Float32Array
     *      normal: Float32Array
     *      joints: Uint8Array
     *      weights: Float32Array
     * }} args
    */
    constructor({ indices, position, uv, normal, joints, weights, }) {
        super([
            ...GLSL_COMMON.createAttributes(position, uv, normal),
            ...GLSL_SKINNED.createAttributes(joints, weights)
        ], indices)
    }
}
