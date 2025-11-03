import { GlTexture } from "../webgl/glDescriptors/GlTexture.js"


export class GlTextureNoise extends GlTexture {
    constructor() {
        const buffer = new Float32Array(1)
        super({
            name: `noise texture`,
            data: buffer,

            wrapS: 'CLAMP_TO_EDGE',
            wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST',
            magFilter: 'NEAREST',

            internalformat: 'RGBA32F',
            width: 1, // 16 element (matrix 4x4)
            height: 1,
            border: 0,
            format: 'RGBA',
            type: 'FLOAT',

            needsMipmap: false,
        })
    }

    #computeNoiseBuffer(length) {
        const buffer = new Float32Array(length)
        for (let i = 0; i < length; i++) { buffer[i] = Math.random() * 2.0 - 1.0 }
        return buffer
    }

    resize(width, height) {
        this.data = this.#computeNoiseBuffer(width * height * 4)
        this.dataVersion++
        super.resize(width, height)
    }
}
