import { Matrix4 } from "../../../math/Matrix4.js"
import { Quaternion } from "../../../math/Quaternion.js"
import { Vector3 } from "../../../math/Vector3.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { HairStep } from "./HairStepOld.js"

const _vector3 = new Vector3()
const _vector3_2 = new Vector3()
const _quaternion = new Quaternion()

export class HairSystem {
    /** @type {HairStep[]} */ #hairSteps = []

    constructor(
        /** @type {GltfSkin} */ gltfSkin,
        /** @type {Matrix4} */ worldMatrix
    ) {
        const buffer = new Float32Array(16 * gltfSkin.bonesCount)

        this.jointsTexture = new GlTexture({
            name: `joints for skin ${gltfSkin.name}`,
            data: buffer,

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

        this.addHairStep(buffer, gltfSkin.root, gltfSkin.inverseBindMatrices.buffer, worldMatrix)
    }

    addHairStep(
        /** @type {Float32Array} */ jointElements,
        /** @type {GltfBone} */ gltfBone,
        /** @type {Float32Array} */ inverseBindMatrices,
        /** @type {Matrix4} */ parentWorldMatrix
    ) {
        const inverseBindMatrice = new Matrix4().fromArray(inverseBindMatrices.subarray(gltfBone.id * 16, gltfBone.id * 16 + 16))

        const initialLocalMatrix = new Matrix4().compose(
            gltfBone.translation ? _vector3.fromArray(gltfBone.translation) : _vector3_2.set(0, 0, 0),
            gltfBone.rotation ? _quaternion.fromArray(gltfBone.rotation) : _quaternion.identity(),
            gltfBone.scale ? _vector3_2.fromArray(gltfBone.scale) : _vector3_2.set(1, 1, 1)
        ).premultiply(parentWorldMatrix).multiply(inverseBindMatrice)

        const m4Index = 16 * gltfBone.id
        const targetMatrix4Elements = jointElements.subarray(m4Index, m4Index + 16)

        const hairStep = new HairStep(
            parentWorldMatrix,
            initialLocalMatrix,
            targetMatrix4Elements,
        )

        this.#hairSteps.push(hairStep)

        for (const child of gltfBone.children ?? []) {
            this.addHairStep(jointElements, child, inverseBindMatrices, hairStep.worldMatrix)
        }
    }

    update(
         /** @type { {line: Line3, collisionDistanceSq: number}[] } */ lineColliders,
    ) {
        for (const hairStep of this.#hairSteps) {
            hairStep.update(lineColliders)
        }
        this.jointsTexture.dataVersion += 1
    }
}
