import { Line3 } from "../../../math/Line3.js"
import { Vector3 } from "../../../math/Vector3.js"

export class ParticleEmiter {
    #direction = new Vector3()
    #stepDistance
    #stepDistanceSq
    newEmiterPosition = new Vector3()
    previousEmiterPosition = new Vector3()
    #distanceRest = 0
    line = new Line3()

    constructor(stepDistance = 0.01) {
        this.#stepDistance = stepDistance
        this.#stepDistanceSq = this.#stepDistance ** 2
    }

    update(/** @type {Vector3} */ newPosition) {
        this.line.end.copy(newPosition)

        const lineDistance = this.line.distance()
        this.#direction.subVectors(this.line.end, this.line.start)
        this.#direction.divideScalar(lineDistance)

        this.#distanceRest += lineDistance

        while (this.#distanceRest >= this.#stepDistance) {
            // move line.start allong the line
            this.line.at(this.#stepDistance, this.line.start)

            this.#distanceRest -= this.#stepDistance
        }
    }
}
