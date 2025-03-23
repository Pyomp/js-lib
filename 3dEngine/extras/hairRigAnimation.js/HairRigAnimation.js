import { Matrix4 } from "../../../math/Matrix4.js"
import { _up, Vector3 } from "../../../math/Vector3.js"

const _vector3 = new Vector3()

export class HairRigAnimation {
    #positions
    #elasticities
    #initialPositionOffset
    #worldMatrix
    #matrices

    constructor(/** @type {Matrix3} */ worldMatrix, /** @type {Vector3[]} */ positions, /** @type {number[]} */ elasticities) {
        this.#worldMatrix = worldMatrix
        this.#positions = positions
        this.#matrices = positions.map(position => new Matrix4())
        this.#elasticities = elasticities
        this.#initialPositionOffset = this.#computeInitialPositionOffset(positions)
    }

    #computeInitialPositionOffset(/** @type {Vector3[]} */ positions) {
        const initialPositionOffset = [new Vector3(0, 0, 0)]
        for (let i = 1; i < positions.length; i++) {
            initialPositionOffset.push(
                new Vector3().subVectors(positions[i], positions[i - 1])
            )
        }
    }

    #updatePhysics(
        /** @type {Vector3[]} */ velocities,
        /** @type {number} */ deltaTimeSecond
    ) {
        for (const velocity of velocities) {

            _vector3.copy(velocity).multiplyScalar(deltaTimeSecond)

            for (const position of this.#positions) {

                position.add(_vector3)
            }
        }
    }

    #updateElasticities(
        /** @type {number} */ deltaTimeSecond
    ) {
        for (let i = 1; i < this.#positions.length; i++) {
            const position = this.#positions[i]
            const parentPosition = this.#positions[i - 1]

            _vector3
                .subVectors(parentPosition, position)
                .multiplyScalar(this.#elasticities[i])
                .multiplyScalar(deltaTimeSecond)
            position.add(_vector3)
        }
    }

    #updateCollisions(
        /** @type {Sphere[]} */ spheres
    ) {
        for (const position of this.#positions) {
            
            for (const sphere of spheres) {

                _vector3.subVectors(sphere.center, position)
                const deltaLengthSq = _vector3.lengthSq()
                const sphereLenghtSq = sphere.radius * sphere.radius
                const isCollision = _vector3.lengthSq() < sphereLenghtSq
                if (isCollision) {
                    const deltaLength = Math.sqrt(deltaLengthSq)
                    _vector3.divideScalar(deltaLength).multiplyScalar(sphere.radius)
                    position.copy(sphere.center).add(_vector3)
                }
            }
        }
    }

    computeMatrices() {
        const lastIndex = this.#matrices.length - 1
        for (let i = 0; i < lastIndex; i++) {
            const matrix = this.#matrices[i]
            const { x, y, z } = this.#positions[i]
            matrix.setPosition(x, y, z)
            matrix.lookAt(this.#positions[i], this.#positions[i + 1], _up)
        }
    }

    update(
        /** @type {Vector3[]} */ physicsVelocities,
        /** @type {number} */ deltaTimeSecond,
        /** @type {Sphere[]} */ collisionSpheres,
    ) {
        // usual physics gravity, wind
        this.#updatePhysics(physicsVelocities, deltaTimeSecond)

        // physics with initial pose relative to parent
        // it will add elastic effect and keep good distance with parent
        this.#updateElasticities(deltaTimeSecond)

        // collisions object of the scene
        this.#updateCollisions(collisionSpheres)
    }
}
