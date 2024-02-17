import { GlTextureData } from "../webgl/glDescriptors/GlTextureData.js"

export class GlDepthTextureData extends GlTextureData {
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
