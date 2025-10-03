import { BoneAnimation } from './BoneAnimation.js'
import { MorphsAnimation } from './MorphsAnimation.js'

export class Track {
    end = 0
    loop

    /** @type { {[boneName: string]: BoneAnimation} } */
    bones = {}

    /** @type { {[boneName: string]: MorphsAnimation} } */
    morphs = {}

    constructor(
        /** @type {GltfAnimation} */ gltfAnimation,
        /** @type {number} */ loop = 0
    ) {
        for (const targetName in gltfAnimation) {
            const gltfTargetAnimation = gltfAnimation[targetName]
            if ('weights' in gltfTargetAnimation) {
                this.#addBoneFromGltfMorph(targetName, gltfTargetAnimation)
            } else {
                this.#addBoneFromGltfBone(targetName, gltfTargetAnimation)
            }
            this.loop = loop
        }
    }

    #addBoneFromGltfMorph(
        /** @type {string} */ targetName,
        /** @type {GltfMorphsAnimation} */ gltfMorphsAnimation
    ) {
        const morphsAnimation = new MorphsAnimation(gltfMorphsAnimation)
        this.morphs[targetName] = morphsAnimation
        this.end = Math.max(this.end, morphsAnimation.getMaxTime())
    }

    #addBoneFromGltfBone(
        /** @type {string} */ targetName,
        /** @type {GltfBoneAnimation} */ gltfBone
    ) {
        const boneAnimation = new BoneAnimation(gltfBone)
        this.bones[targetName] = boneAnimation
        this.end = Math.max(this.end, boneAnimation.getMaxTime())
    }
}
