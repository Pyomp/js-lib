import { Color } from "../../math/Color.js"
import { Vector3 } from "../../math/Vector3.js"

export class PointLight {
    version = 0

    position = new Vector3()

    constructor({
        intensity = 0,
        color = new Color(1, 1, 1),
        localPosition = new Vector3(),
        incidence = 100,
    }) {
        this.intensity = intensity
        this.color = color
        this.localPosition = localPosition
        this.incidence = incidence
    }

    /**
     * @param {Matrix4} parentMatrix 
     */
    updateWorldPosition(parentMatrix) {
        this.position.copy(this.localPosition).applyMatrix4(parentMatrix)
    }
}
