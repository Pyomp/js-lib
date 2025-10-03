import { Frustum } from "../../math/Frustum.js"
import { Vector3 } from "../../math/Vector3.js"
import { Camera } from "../sceneGraph/Camera.js"

const _vector3 = new Vector3()

/** @returns {{isDisplayed: false} | {isDisplayed: true, x: number, y: number, z: number}} */
export function getScreenPosition(
    /** @type {Vector3} */ worldPosition,
    /** @type {Camera} */ camera,
    /** @type {HTMLCanvasElement} */ canvas,
    /** @type {Frustum} */ frustum,
) {
    const isDisplayed = frustum.containsPoint(worldPosition)
    if (isDisplayed) {
        _vector3.copy(worldPosition)
        _vector3.project(camera)

        const x = (_vector3.x * .5 + .5) * canvas.clientWidth
        const y = (_vector3.y * -.5 + .5) * canvas.clientHeight
        const z = (-_vector3.z * .5 + .5)

        return { isDisplayed, x, y, z }
    } else {
        return { isDisplayed }
    }
}
