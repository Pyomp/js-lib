import { GlTexture } from "../webgl/glDescriptors/GlTexture.js"

export class GlTextureDepthData extends GlTexture {
    constructor() {
        super({
            name: 'Renderer Depth Texture',
            wrapS: 'CLAMP_TO_EDGE',
            wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST',
            magFilter: 'NEAREST',
            internalformat: 'DEPTH24_STENCIL8',
            width: 1,
            height: 1,
            border: 0,
            format: 'DEPTH_STENCIL',
            type: 'UNSIGNED_INT_24_8',
            data: null,
            needsMipmap: false
        })
    }
}
