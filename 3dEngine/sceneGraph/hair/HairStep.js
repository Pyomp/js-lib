import { Line3 } from "../../../math/Line3.js"
import { Matrix4 } from "../../../math/Matrix4.js"
import { Quaternion } from "../../../math/Quaternion.js"
import { _up, Vector3 } from "../../../math/Vector3.js"

const _vector3 = new Vector3()

export class HairSystem {
    /**
     * current velocities
     *  @type {Vector3[]}
     */
    #velocities = []

    /**
     * current positions
     *  @type {Vector3[]}
     */
    #positions = []

    /**
     * current quaternions
     *  @type {Quaternion[]}
     */
    #quaternions = []

    /**
     * used for Elasticity 
     * it is the position if no hair system would be applied
     * @type {Vector3[]}
    */
    #solidPosition = []

    /**
     * used to retrieve solidPosition
     *  @type {Quaternion[]}
     */
    #initialQuaternions = []


    /**
     * still not sure
     *  @type {Vector3[]}
     */
    #initialPositions = []

    /** @type {number} */ #length

    constructor(
        /** @type {GltfBone[]} */ bones
    ) {

        this.#length = bones.length

        for (let i = 0; i < this.#length; i++) {
            this.#initialQuaternions.push(new Quaternion().fromArray(bones[i].rotation))
            this.#initialPositions.push(new Vector3().fromArray(bones[i].translation))

            this.#solidPosition.push(new Vector3())

            this.#positions.push(new Vector3())
            this.#velocities.push(new Vector3())
            this.#quaternions.push(new Quaternion())
        }

        // root position should never change
        this.#solidPosition[0].copy(this.#initialPositions[0])
        this.#positions[0].copy(this.#initialPositions[0])
    }

    #computeSolidPosition() {
        for (let i = 1; i < this.#length; i++) {
            const quaternion = this.#quaternions[i - 1]
            const solidPosition = this.#solidPosition[i]
            const initialPosition = this.#solidPosition[i]

            solidPosition.copy(initialPosition).applyQuaternion(quaternion)
        }
    }

    #updateVelocityInertia() {
        for (const velocity of this.#velocities) {
            velocity.multiplyScalar(1.1)
        }
    }

    #updateVelocityElasticity() {
        for (let i = 1; i < this.#length; i++) {
            const solidPosition = this.#solidPosition[i]
            const position = this.#positions[i]
            const velocity = this.#velocities[i]
            _vector3.subVectors(position, solidPosition)
            velocity.add(_vector3)
        }
    }

    #updateVelocityGravity() {
        for (const velocity of this.#velocities) {
            velocity.y -= 0.01
        }
    }

    #applyVelocity(
        /** @type {number} */ deltaTimeSecond
    ) {
        for (let i = 1; i < this.#length; i++) {
            const position = this.#positions[i]
            const velocity = this.#velocities[i]
            position.add(_vector3.copy(velocity).multiplyScalar(deltaTimeSecond))
        }
    }


    #updateCollision(
        // /** @type { {line: Line3, collisionDistanceSq: number}[] } */ lineColliders
    ) {
        // for (const lineCollider of lineColliders) {
        //     const line = lineCollider.line
        //     line.closestPointToPoint(this.tail, true, _vector3)
        //     _vector3.subVectors(this.tail, _vector3)
        //     const lengthSq = _vector3.lengthSq()
        //     if (lineCollider.collisionDistanceSq < lengthSq) {
        //         this.#velocity.projectOnVector(_vector3)
        //     }
        // }
    }

    #updateQuaternions() {
        for (let i = 1; i < this.#length; i++) {
            const head = this.#positions[i - 1]
            const tail = this.#positions[i]
            const quaternion = this.#quaternions[i - 1]
            quaternion.setFromUnitVectors(head, tail)
        }
    }

    update(
        /** @type {number} */ deltaTimeSecond
    ) {
        this.#computeSolidPosition()
        this.#updateVelocityInertia()
        this.#updateVelocityElasticity()
        this.#updateVelocityGravity()
        this.#applyVelocity(deltaTimeSecond)
        this.#updateCollision()
        this.#updateQuaternions()
    }


}
