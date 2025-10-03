import { KeyFrame } from "./KeyFrame.js"

export class MorphsAnimation {
    /** @type {KeyFrame<Float32Array[]>} */
    weights

    /** @type {number} */
    morphCount

    constructor(
        /** @type {GltfMorphsAnimation} */ gltfMorphsAnimation
    ) {
        const gltfKeyframe = gltfMorphsAnimation.weights

        /** @type {Float32Array[]} */
        const frame = []

        const keyLength = gltfKeyframe.key.buffer.length
        const frameLength = gltfKeyframe.frame.buffer.length
        this.morphCount = frameLength / keyLength

        for (let i = 0; i < frameLength; i += this.morphCount) {
            frame.push(gltfKeyframe.frame.buffer.subarray(i, i + this.morphCount))
        }

        this.weights = new KeyFrame(
            gltfKeyframe.key.buffer,
            frame,
            gltfKeyframe.interpolation === 'LINEAR'
        )
    }

    getMaxTime() {
        return Math.max(...this.weights.key)
    }
}
