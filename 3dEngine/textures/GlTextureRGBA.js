import { getDefinedOrThrow } from "../../utils/utils.js"
import { GlTexture } from "../webgl/glDescriptors/GlTexture.js"

export class GlTextureRGBA extends GlTexture {
    static fromBaseColorGltfFirstPrimitive(
        /** @type {GltfNode} */ gltfNode
    ) {
        return new GlTextureRGBA(
            getDefinedOrThrow(gltfNode.mesh?.primitives[0].material?.pbrMetallicRoughness?.baseColorTexture?.source.htmlImageElement)
        )
    }

    constructor(
        /** @type {Image | HTMLImageElement | HTMLCanvasElement} */ data
    ) {
        super({
            name: 'GLTF Texture',
            wrapS: 'CLAMP_TO_EDGE',
            wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'LINEAR_MIPMAP_LINEAR',
            magFilter: 'LINEAR',
            internalformat: 'RGBA',
            width: undefined,
            height: undefined,
            border: 0,
            format: 'RGBA',
            type: 'UNSIGNED_BYTE',
            data,
            needsMipmap: true
        })
    }
}
