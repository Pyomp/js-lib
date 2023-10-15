import { Color } from "../../../math/Color.js"
import { Vector3 } from "../../../math/Vector3.js"

/**
 * @implements {Light}
 */
export class PointLight {

    needsUpdate = true

    position = new Vector3()
    intensity = 1
    color = new Color()

    toArray(array = new Float32Array(8), offset = 0) {
        this.position.toArray(array, offset)

        array[offset + 3] = this.intensity

        this.color.toArray(array, offset + 4)

        return array
    }
}
