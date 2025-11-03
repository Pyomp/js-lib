import { GlTexture } from "../webgl/glDescriptors/GlTexture.js"

export class GlTextureFloatRGB extends GlTexture {
    constructor(
        /** @type {Float32Array} */ data,
        /** @type {number} */ width
    ) {
        super({
            name: `texture data float RGB`,
            data,

            wrapS: 'CLAMP_TO_EDGE',
            wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST',
            magFilter: 'NEAREST',

            internalformat: 'RGB32F',
            width: width, // 16 element (matrix 4x4)
            height: Math.ceil(data.length / (width * 3)),
            border: 0,
            format: 'RGB',
            type: 'FLOAT',

            needsMipmap: false,
        })
    }
}
