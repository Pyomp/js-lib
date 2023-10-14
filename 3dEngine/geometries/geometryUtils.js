import { Matrix4 } from "../../math/Matrix4.js"
import { Vector3 } from "../../math/Vector3.js"

/**
 * @param {Vector3} scale 
 * @param {Float32Array} positionBuffer 
 */
export function scalePosition(scale, positionBuffer) {
    for (let i = 0; i < positionBuffer.length; i += 3) {
        positionBuffer[i] *= scale.x
        positionBuffer[i + 1] *= scale.y
        positionBuffer[i + 2] *= scale.z
    }
}

/**
 * @param {Vector3} translation
 * @param {Float32Array} positionBuffer 
 */
export function translatePosition(translation, positionBuffer) {
    for (let i = 0; i < positionBuffer.length; i += 3) {
        positionBuffer[i] += translation.x
        positionBuffer[i + 1] += translation.y
        positionBuffer[i + 2] += translation.z
    }
}

const _matrix4 = new Matrix4()
const _vector3 = new Vector3()

/**
 * @param {Euler} rotation
 * @param {Float32Array} positionBuffer 
 */
export function rotatePosition(rotation, positionBuffer) {
    _matrix4.makeRotationFromEuler(rotation)

    for (let i = 0; i < positionBuffer.length; i += 3) {
        _vector3.fromArray(positionBuffer, i)

        _vector3.applyMatrix4Rotation(_matrix4)

        _vector3.toArray(positionBuffer, i)
    }
}
