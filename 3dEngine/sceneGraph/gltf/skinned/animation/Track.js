import { BoneAnimation } from './BoneAnimation.js'

export class Track {
    end = 0
    loop

    /** @type { {[boneName: string]: BoneAnimation} } */
    bones = {}

    /**
     * @param {GltfAnimation} gltfAnimation 
     */
    constructor(gltfAnimation, loop = 0) {
        for (const boneName in gltfAnimation) {
            const gltfBone = gltfAnimation[boneName]
            this.#addBoneFromGltfBone(boneName, gltfBone)
            this.loop = loop
        }
    }

    #addBoneFromGltfBone(boneName, gltfBone) {
        const boneAnimation = new BoneAnimation(gltfBone)
        this.bones[boneName] = boneAnimation
        this.end = Math.max(this.end, boneAnimation.getMaxTime())
    }
}
