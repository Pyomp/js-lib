import { Line3 } from "../../../math/Line3.js"
import { Matrix4 } from "../../../math/Matrix4.js"
import { _up, Vector3 } from "../../../math/Vector3.js"

const _vector3 = new Vector3()

export class HairStep {
    #parentWorldMatrix
    /** @type {Matrix4} */ #initialLocalMatrix
    /** @type {Matrix4} */ #inverseBindMatrix = new Matrix4()
    #velocity = new Vector3(0, 0, 0)
    #elasticity = 0.1
    #up = new Vector3(0, 1, 0)
    tail = new Vector3(0, 1, 0)
    worldMatrix = new Matrix4()

    constructor(
        /** @type {Matrix4} */ parentWorldMatrix,
        /** @type {Matrix4} */ initialLocalMatrix,
        /** @type {Float32Array} */ targetMatrix4Elements,
    ) {
        this.#parentWorldMatrix = parentWorldMatrix
        this.#initialLocalMatrix = initialLocalMatrix
        this.#inverseBindMatrix.copy(this.#initialLocalMatrix).invert()
        this.tail.set(0, 1, 0)
            // .applyMatrix4Rotation(this.#parentWorldMatrix)
            .applyMatrix4Rotation(this.#initialLocalMatrix)
        this.#up.setFromMatrixColumn(this.#initialLocalMatrix, 1)
        this.worldMatrix.elements = targetMatrix4Elements
        this.worldMatrix.copy(this.#initialLocalMatrix)
    }

    #updateElasticity() {
        _vector3.set(0, 1, 0)
            .applyMatrix4Rotation(this.#parentWorldMatrix)
            .applyMatrix4Rotation(this.#initialLocalMatrix)
        this.#velocity.add(
            _vector3.subVectors(_vector3, this.tail)
                .multiplyScalar(this.#elasticity)
        )
    }

    #updateInertia() {
        this.#velocity.multiplyScalar(1.1)
    }

    #updateCollision(
        /** @type { {line: Line3, collisionDistanceSq: number}[] } */ lineColliders
    ) {
        for (const lineCollider of lineColliders) {
            const line = lineCollider.line
            line.closestPointToPoint(this.tail, true, _vector3)
            _vector3.subVectors(this.tail, _vector3)
            const lengthSq = _vector3.lengthSq()
            if (lineCollider.collisionDistanceSq < lengthSq) {
                this.#velocity.projectOnVector(_vector3)
            }
        }
    }

    /**
     * update should be call in order from parent to children
    */
    update(
        /** @type { {line: Line3, collisionDistanceSq: number}[] } */ lineColliders,
    ) {
        // this.#updateInertia()
        // this.#updateElasticity()
        // this.#updateCollision(lineColliders)
        // _vector3.setFromMatrixPosition(this.worldMatrix)
        // this.worldMatrix
        //     .lookAt(_vector3, this.tail, this.#up)
        // .setPosition(this.tail)
    }
}
