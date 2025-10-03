import { GlTextureFloatRGB } from "./GlTextureFloatRGB.js"

const VertexElementCount = 3
const MorphCount = 4

export class GlTextureMorphPosition extends GlTextureFloatRGB {
    constructor(
        /** @type {number} */ vertexCount
    ) {
        super(
            new Float32Array(vertexCount * VertexElementCount * MorphCount),
            MorphCount
        )
    }
}
