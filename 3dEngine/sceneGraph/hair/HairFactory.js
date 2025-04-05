import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"

export class Hair {
    /** @type {Vector3[]} */ head

    _vector3.set(0, 0, this.#lengthInitialTailHead).applyMatrix4Rotation(this.#parentHairStep.worldMatrix)

    constructor(
        parentMatrix,
        initialMatrix,

    ) {

    }

    /** @type {GltfBone} */ #gltfRootBone
    /** @type {Float32Array} */ #inverseBindMatrices
    /** @type {number} */ #stepCount
    constructor(
        /** @type {GltfSkin} */ gltfSkin,
        /** @type {GltfBone} */ gltfBone,
        /** @type {Float32Array} */ jointMatricesF32a,
        /** @type {Float32Array} */ inverseBindMatricesF32a,
    ) {
        this.#gltfRootBone = gltfSkin.root
        this.#inverseBindMatrices = gltfSkin.inverseBindMatrices.buffer
        this.#stepCount = gltfSkin.bonesCount

        this.name = gltfBone.name
        this.#parent = parentBone

        this.#inverseBindMatrix.elements = inverseBindMatricesF32a.subarray(gltfBone.id * 16, gltfBone.id * 16 + 16)
        this.#localMatrix.elements = jointMatricesF32a.subarray(gltfBone.id * 16, gltfBone.id * 16 + 16)

        if (gltfBone.rotation) this.quaternion.fromArray(gltfBone.rotation)
        if (gltfBone.translation) this.position.fromArray(gltfBone.translation)
        if (gltfBone.scale) this.scale.fromArray(gltfBone.scale)

        if (gltfBone.children) {
            for (const childJoint of gltfBone.children) {
                this.#children.add(new Bone(childJoint, jointMatricesF32a, inverseBindMatricesF32a, this))
            }
        }
    }

    createArmature() {
        const buffer = new Float32Array(16 * this.#stepCount)

        const jointsTexture = new GlTexture({
            name: `joints for skin ${this.name}`,
            data: buffer,

            wrapS: 'CLAMP_TO_EDGE',
            wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST',
            magFilter: 'NEAREST',

            internalformat: 'RGBA32F',
            width: 4, // 16 element (matrix 4x4)
            height: this.#stepCount,
            border: 0,
            format: 'RGBA',
            type: 'FLOAT',

            needsMipmap: false,
        })

        return {
            rootBone: new Bone(this.#gltfSkinRootBone, buffer, this.#inverseBindMatrices),
            jointsTexture
        }
    }
}
