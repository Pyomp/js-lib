import { Vector4 } from "../../../../../math/Vector4.js"
import { GlTextureFloatRGB } from "../../../textures/GlTextureFloatRGB.js"

const MorphCount = 4

export class MorphController {
    indices = new Uint32Array(4).fill(99999)
    #weight = new Float32Array(4)
    weight = new Vector4()
    /** @readonly */ name

    /**
     * @readonly 
     * @type {{
     *      readonly position: Float32Array[]
     *      readonly normal: Float32Array[]
     * }} 
     */
    #morphs

    constructor(
        /** 
         * @type {{
         *      position: Float32Array[]
         *      normal: Float32Array[]
         * }} 
         */ morphs,
         /** @type {string} */ name
    ) {
        this.#morphs = morphs
        this.name = name

        this.positionGlTexture = new GlTextureFloatRGB(
            new Float32Array(morphs.position[0].length * MorphCount),
            morphs.position[0].length / 3
        )

        this.normalGlTexture = new GlTextureFloatRGB(
            new Float32Array(morphs.normal[0].length * MorphCount),
            morphs.normal[0].length / 3
        )
    }

    update(
        /** @type {number[]} */ indices,
        /** @type {number[]} */ values
    ) {
        const isSomeIndicesMissing = indices.some((index) => !this.indices.includes(index))

        if (isSomeIndicesMissing) {
            for (let i = 0; i < MorphCount; i++) {
                const index = indices[i]

                const position = this.#morphs.position[index]
                this.positionGlTexture.data.set(position, i * position.length)
                this.positionGlTexture.dataVersion++

                const normal = this.#morphs.normal[index]
                this.normalGlTexture.data.set(normal, i * normal.length)
                this.normalGlTexture.dataVersion++

                this.#weight[i] = values[i]
            }
        } else {
            for (let i = 0; i < MorphCount; i++) {
                const j = this.indices.indexOf(indices[i])
                this.#weight[j] = values[i]
            }
        }

        this.weight.fromArray(this.#weight)
    }

    dispose() {
        this.positionGlTexture.needsDelete = true
        this.normalGlTexture.needsDelete = true
    }
}
