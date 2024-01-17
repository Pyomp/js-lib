import { GlTextureData } from "../webgl/glDescriptors/GlTextureData.js"

export class GlGradientTexture extends GlTextureData {
    /**
     * 
     * @param {Color[]} colors 
     */
    constructor(colors) {
        const data = new Uint8ClampedArray(colors.length * 4)
        for (let i = 0; i < colors.length; i++) {
            const color = colors[i]
            const offset4 = i * 4
            data[offset4] = color.r * 255
            data[offset4 + 1] = color.g * 255
            data[offset4 + 2] = color.b * 255
            data[offset4 + 3] = color.a * 255
        }
        super({ data, width: colors.length })
    }
}
