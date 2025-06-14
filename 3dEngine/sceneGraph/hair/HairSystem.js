import { Line3 } from "../../../math/Line3.js"
import { Matrix4 } from "../../../math/Matrix4.js"
import { Quaternion } from "../../../math/Quaternion.js"
import { Sphere } from "../../../math/Sphere.js"
import { _up, Vector3 } from "../../../math/Vector3.js"
import { DeltaTimeUpdater } from "../../../utils/DeltaTimeUpdater.js"
import { loopRaf } from "../../../utils/loopRaf.js"

const _vector3 = new Vector3()

const _scale1 = new Vector3(1, 1, 1)

const _matrix4 = new Matrix4()

const PHYSICS_DT = 0.01

export class HairSystem {
    /** @type {Vector3[]} */
    #positions = []

    /** @type {Vector3[]} */
    #velocities = []

    /** @type {Vector3[]} */
    #solidPositions = []

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

    /**
     *  @type {number[]}
     */
    #rigidity = []

    /** @type {number} */ #length = 0

    #preMatrix = new Matrix4()

    constructor(
        /** @type {GltfBone} */ rootBone,
        /** @type {Float32Array} */ jointsBuffer,
        /** @type {Matrix4} */ parentMatrix,
        /** @type {Matrix4} */ parentBoneMatrix = new Matrix4().identity()
    ) {
        this.#parentMatrix = parentMatrix
        this.#parentBoneMatrix = parentBoneMatrix

        /** @type {GltfBone | undefined} */ let bone = rootBone

        const cumulMatrix = new Matrix4().identity()

        const up = _vector3.set(1, 0, 0)

        while (bone) {
            const initialLocalQuaternion = new Quaternion().fromArray(bone.rotation ?? [0, 0, 0, 1])
            const initialLocalPosition = new Vector3().fromArray(bone.translation ?? [0, 0, 0])
            const initialLocalMatrix = new Matrix4()

            this.#elasticities.push((bone.extras?.elasticity ?? 0.1) / PHYSICS_DT)
            this.#rigidity.push((bone.extras?.rigidity ?? (1 / (this.#length + 1)) ** 3) / PHYSICS_DT)

            const initialLocalLengthSq = initialLocalPosition.lengthSq()
            this.#initialLengthSqs.push(initialLocalLengthSq)
            this.#initialLengths.push(Math.sqrt(initialLocalLengthSq))

            initialLocalMatrix.compose(initialLocalPosition, initialLocalQuaternion, _scale1)
            cumulMatrix.multiply(initialLocalMatrix)
            const initialPosition = new Vector3()
                .setFromMatrixPosition(cumulMatrix)

            this.#initialPositions.push(initialPosition)
            this.#positions.push(new Vector3().copy(initialPosition))
            this.#solidPositions.push(new Vector3().copy(initialPosition))
            this.#velocities.push(new Vector3())

            const inverseBindMatrices = new Matrix4().identity()
            this.#inverseBindMatrices.push(inverseBindMatrices)

            const matrix4 = new Matrix4()
            const jointOffset = bone.id * 16
            matrix4.elements = jointsBuffer.subarray(jointOffset, jointOffset + 16)
            matrix4.identity()
            this.matrices.push(matrix4)

            bone = bone?.children?.[0]
            this.#length += 1
        }

        const lastIndex = this.#length - 1

        for (let i = 0; i < lastIndex; i++) {
            const position = this.#positions[i]
            const target = this.#positions[i + 1]
            this.matrices[i]
                .setPosition(position)
                .lookAt(position, target, up)
        }

        this.matrices[lastIndex].copy(this.matrices[lastIndex - 1])

        for (let i = 0; i < this.#length; i++) {
            this.#inverseBindMatrices[i].copy(this.matrices[i]).invert()
        }
    }

    #updateMatrices() {
        const lastIndex = this.#length - 1

        const up = _vector3.set(1, 0, 0).applyMatrix4Rotation(this.#parentMatrix).applyMatrix4Rotation(this.#parentBoneMatrix)

        for (let i = 0; i < lastIndex; i++) {
            const position = this.#positions[i]
            const target = this.#positions[i + 1]
            this.matrices[i]
                .setPosition(position)
                .lookAt(position, target, up)
                .multiply(this.#inverseBindMatrices[i])
        }

        this.matrices[lastIndex].copy(this.matrices[lastIndex - 1])
    }

    #updateCollision(
        /** @type {Vector3} */ position,
        /** @type {Vector3} */ velocity,
    ) {
        const sphere = new Sphere(new Vector3(0, 0.75, 0), 0.10)
        sphere.center.applyMatrix4(this.#preMatrix)

        _vector3.subVectors(position, sphere.center)
        const deltaLengthSq = _vector3.lengthSq()

        if (deltaLengthSq < (sphere.radius * sphere.radius)) {
            const length = Math.sqrt(deltaLengthSq)
            position
                .copy(_vector3.divideScalar(length))
                .multiplyScalar(sphere.radius)
                .add(sphere.center)
        }
    }

    #updatePositions() {
        this.#positions[0].copy(
            _vector3.copy(this.#initialPositions[0]).applyMatrix4(this.#preMatrix)
        )

        for (let i = 1; i < this.#length; i++) {
            const position = this.#positions[i]
            const velocity = this.#velocities[i]

            position.add(_vector3.copy(velocity).multiplyScalar(PHYSICS_DT))

            // rigidity
            const rigidityAlpha = this.#rigidity[i - 1] * PHYSICS_DT
            position.lerp(this.#solidPositions[i], rigidityAlpha)

            // collision
            this.#updateCollision(position, velocity)

            // replace position to max length from parent point
            _vector3.subVectors(position, this.#positions[i - 1])
            const lengthSq = _vector3.lengthSq()
            if (lengthSq > this.#initialLengthSqs[i]) {
                const length = Math.sqrt(lengthSq)
                velocity.copy(_vector3)
                _vector3.multiplyScalar((length - this.#initialLengths[i]) / length)
                position.sub(_vector3)
            }
        }
    }

    #updateVelocities() {
        for (let i = 0; i < this.#length; i++) {
            const velocity = this.#velocities[i]

            // air resistance
            // velocity.multiplyScalar(0.9)

            // elasticity
            const elasticity = Math.min(1, this.#elasticities[i - 1] * PHYSICS_DT)
            const a = _vector3.subVectors(this.#solidPositions[i], this.#positions[i]).normalize()
            velocity.add(a.multiplyScalar(0.1))

            // gravity
            velocity.y -= 4
        }
    }

    #physicsPrepare() {
        this.#preMatrix.copy(this.#parentMatrix).multiply(this.#parentBoneMatrix)
        for (let i = 1; i < this.#length; i++) {
            this.#solidPositions[i].copy(this.#initialPositions[i]).applyMatrix4(this.#preMatrix)
        }
    }

    #physicsUpdate() {
        this.#updateVelocities()
        this.#updatePositions()
    }

    update() {
        this.#physicsPrepare()
        this.#physicsUpdate()
        // this.#updatePositions()
        this.#updateMatrices()
    }
}
