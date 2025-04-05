import { Matrix4 } from "../../../math/Matrix4.js"
import { Quaternion } from "../../../math/Quaternion.js"
import { Vector3 } from "../../../math/Vector3.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { HairStep } from "./HairStep.js"

const _vector3 = new Vector3()
const _vector3_2 = new Vector3()
const _quaternion = new Quaternion()

export class HairSystem {
    /** @type {HairStep[]} */ #hairSteps = []

    worldMatrix = new Matrix4()

    constructor(/** @type {GltfSkin} */ gltfSkin) {
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

        this.addHairStep(buffer, gltfSkin.root)
    }

    addHairStep(
        /** @type {Float32Array} */ jointElements,
        /** @type {GltfBone} */ gltfBone,
        parentWorldMatrix = this.worldMatrix
    ) {
        const initialLocalMatrix = new Matrix4().compose(
            _vector3.fromArray(gltfBone.translation),
            _quaternion.fromArray(gltfBone.rotation),
            _vector3_2.fromArray(gltfBone.scale)
        )

        const m4Index = 16 * gltfBone.id
        const targetMatrix4Elements = jointElements.subarray(m4Index, m4Index + 16)

        const hairStep = new HairStep(
            parentWorldMatrix,
            initialLocalMatrix,
            targetMatrix4Elements,
        )

        this.#hairSteps.push(hairStep)

        for (const child of gltfBone.children ?? []) {
            this.addHairStep(jointElements, child, hairStep.worldMatrix)
        }
    }

    update(
         /** @type { {line: Line3, collisionDistanceSq: number}[] } */ lineColliders,
    ) {
        for (const hairStep of this.#hairSteps) {
            hairStep.update(lineColliders)
        }
    }
}
