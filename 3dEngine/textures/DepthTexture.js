import { Texture } from "../sceneGraph/Texture.js"

export class DepthTexture extends Texture {
    constructor() {
        super({
            target: 'TEXTURE_2D',
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
