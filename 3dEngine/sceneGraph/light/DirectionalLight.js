import { Color } from "../../../math/Color.js"
import { Vector3 } from "../../../math/Vector3.js"

/**
 * @implements {Light}
 */
export class DirectionalLight {

    needsUpdate = true

    position = new Vector3()
    intensity = 1
    direction = new Vector3()
    color = new Color()

    toArray(array = new Float32Array(12)) {
        this.position.toArray(array)

        array[3] = this.intensity

        this.direction.toArray(array, 4)

        this.color.toArray(array, 8)

        return array
    }
}
