import { Line3 } from "../../../math/Line3.js"
import { Matrix4 } from "../../../math/Matrix4.js"
import { Quaternion } from "../../../math/Quaternion.js"
import { _up, Vector3 } from "../../../math/Vector3.js"
import { DeltaTimeUpdater } from "../../../utils/DeltaTimeUpdater.js"
import { loopRaf } from "../../../utils/loopRaf.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"

const _vector3 = new Vector3()
const _vector3_2 = new Vector3()

const _scale1 = new Vector3(1, 1, 1)

const _matrix4 = new Matrix4()

export class HairSystem {
    /**
     * current positions
     *  @type {Vector3[]}
     */
    #positions = []

    /**
     * still not sure
     *  @type {Vector3[]}
     */
    #initialPositions = []

    /**
     * still not sure
     *  @type {number[]}
     */
    #initialLengths = []

    /**
     * still not sure
     *  @type {number[]}
     */
    #initialLengthSqs = []

    /** @type {Matrix4} */
    #parentMatrix

    /** @type {Matrix4} */
    #parentBoneMatrix

    /**
     *  @type {Matrix4[]}
     */
    matrices = []

    /**
     *  @type {Matrix4[]}
     */
    #inverseBindMatrices = []

    /**
     *  @type {number[]}
     */
    #elasticities = []

    /** @type {number} */ #length = 0

    constructor(
        /** @type {GltfBone} */ rootBone,
        /** @type {Matrix4} */ parentMatrix,
        /** @type {Matrix4} */ parentBoneMatrix = new Matrix4().identity()
    ) {
        this.#parentMatrix = parentMatrix
        this.#parentBoneMatrix = parentBoneMatrix

        /** @type {GltfBone | undefined} */ let bone = rootBone

        const cumulMatrix = new Matrix4().identity()

        while (bone) {
            const initialLocalQuaternion = new Quaternion().fromArray(bone.rotation)
            const initialLocalPosition = new Vector3().fromArray(bone.translation)
            const initialLocalMatrix = new Matrix4()

            this.#elasticities.push(bone.extras?.elasticity ?? 0.01)

            const initialLocalLengthSq = initialLocalPosition.lengthSq()
            this.#initialLengthSqs.push(initialLocalLengthSq)
            this.#initialLengths.push(Math.sqrt(initialLocalLengthSq))

            initialLocalMatrix.compose(initialLocalPosition, initialLocalQuaternion, _scale1)
            cumulMatrix.multiply(initialLocalMatrix)
            const initialPosition = new Vector3()
                .setFromMatrixPosition(cumulMatrix)

            this.#initialPositions.push(initialPosition)
            this.#positions.push(new Vector3().copy(initialPosition))

            const inverseBindMatrices = new Matrix4().identity()
            this.#inverseBindMatrices.push(inverseBindMatrices)

            bone = bone?.children?.[0]
            this.#length += 1
        }

        const buffer = new Float32Array(16 * (this.#length - 1))

        const up = _vector3.set(1, 0, 0)
        for (let i = 0; i < this.#length - 1; i++) {
            const matrix4 = new Matrix4()
            matrix4.elements = buffer.subarray(i * 16, i * 16 + 16)
            matrix4.identity()
            this.matrices.push(matrix4)

            const position = this.#positions[i]
            const target = this.#positions[i + 1]
            matrix4
                .setPosition(position)
                .lookAt(position, target, up)
        }

        this.jointsTexture = new GlTexture({
            name: `joints for hair system`,
            data: buffer,

            wrapS: 'CLAMP_TO_EDGE',
            wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST',
            magFilter: 'NEAREST',

            internalformat: 'RGBA32F',
            width: 4, // 16 element (matrix 4x4)
            height: this.#length - 1,
            border: 0,
            format: 'RGBA',
            type: 'FLOAT',

            needsMipmap: false,
        })

        for (let i = 0; i < this.#length - 1; i++) {
            this.#inverseBindMatrices[i].copy(this.matrices[i]).invert()
        }
    }

    #updateMatrices() {
        const up = _vector3.set(1, 0, 0).applyMatrix4Rotation(this.#parentMatrix).applyMatrix4Rotation(this.#parentBoneMatrix)

        for (let i = 0; i < this.#length - 1; i++) {
            const matrix4 = this.matrices[i]
            const position = this.#positions[i]
            const target = this.#positions[i + 1]
            matrix4.setPosition(position)
            matrix4.lookAt(position, target, up)
            matrix4.multiply(this.#inverseBindMatrices[i])
        }

        this.jointsTexture.dataVersion += 1
    }

    #updatePositions() {
        const i = new Matrix4().copy(this.#parentBoneMatrix)
        _matrix4.copy(this.#parentMatrix).multiply(i)
        this.#positions[0].copy(
            _vector3.copy(this.#initialPositions[0]).applyMatrix4(_matrix4)
        )

        for (let i = 1; i < this.#length; i++) {
            const initialPosition = this.#initialPositions[i]
            const solidPosition = _vector3.copy(initialPosition).applyMatrix4(_matrix4)
            const position = this.#positions[i]

            const alpha = Math.min(1, this.#elasticities[i - 1] * loopRaf.deltatimeSecond)

            position.lerp(solidPosition, alpha)

            _vector3.subVectors(position, this.#positions[i - 1])

            const lengthSq = _vector3.lengthSq()
            if (lengthSq > this.#initialLengthSqs[i] + 0.001) {
                const length = Math.sqrt(lengthSq)
                position.sub(_vector3.multiplyScalar((length - this.#initialLengths[i]) / length))
            }
        }
    }

    update() {
        this.#updatePositions()
        this.#updateMatrices()
    }
}
