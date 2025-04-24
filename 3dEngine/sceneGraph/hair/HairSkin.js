import { Matrix4 } from "../../../math/Matrix4.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { HairSystem } from "./HairSystem.js"

export class HairSkin {
    /** @type {HairSystem[]} */
    hairSystems = []

    /** @type {Float32Array} */
    #jointsBuffer

    /** @type {GlTexture} */
    jointsTexture

    constructor(
        /** @type {GltfSkin} */ gltfSkin,
        /** @type {Matrix4} */ parentMatrix,
        /** @type {Matrix4} */ parentBoneMatrix = new Matrix4().identity()
    ) {
        this.#jointsBuffer = new Float32Array(gltfSkin.bonesCount * 16)

        for (const rootBone of gltfSkin.rootBones) {
            const hairSystem = new HairSystem(rootBone, this.#jointsBuffer, parentMatrix, parentBoneMatrix)
            this.hairSystems.push(hairSystem)
        }


        this.jointsTexture = new GlTexture({
            name: `joints for hair system`,
            data: this.#jointsBuffer,

            wrapS: 'CLAMP_TO_EDGE',
            wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST',
            magFilter: 'NEAREST',

            internalformat: 'RGBA32F',
            width: 4, // 16 element (matrix 4x4)
            height: gltfSkin.bonesCount,
            border: 0,
            format: 'RGBA',
            type: 'FLOAT',

            needsMipmap: false,
        })

    }

    update() {
        for (const hairSystem of this.hairSystems) {
            hairSystem.update()
        }
        this.jointsTexture.dataVersion += 1
    }

    dispose() {
        this.jointsTexture.needsDelete = true
    }
}
