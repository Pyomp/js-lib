import { _up, } from "../../../math/Vector3.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { HairRigAnimation } from "./HairRigAnimation.js"

export class GlHairRigAnimation {
    #hairRigAnimation

    jointTexture

    constructor() {
        const worldMatrix: Matrix3
        const positions: Vector3[]
        const elasticities: number[]
        this.#hairRigAnimation = new HairRigAnimation()

        const buffer = new Float32Array(16 * this.#bonesCount)

        this.jointTexture = new GlTexture({
            name: `joints for skin ${this.name}`,
            data: buffer,

            wrapS: 'CLAMP_TO_EDGE',
            wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST',
            magFilter: 'NEAREST',

            internalformat: 'RGBA32F',
            width: 4, // 16 element (matrix 4x4)
            height: this.#bonesCount,
            border: 0,
            format: 'RGBA',
            type: 'FLOAT',

            needsMipmap: false,
        })
    }

}
