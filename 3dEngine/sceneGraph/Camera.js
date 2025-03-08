import { Frustum } from "../../math/Frustum.js"
import { DEG2RAD, addVector3Callback } from "../../math/MathUtils.js"
import { Matrix4 } from "../../math/Matrix4.js"
import { Vector3, _up } from "../../math/Vector3.js"

const _vec3 = new Vector3()
export class Camera {
    version = 0

    projectionMatrix = new Matrix4()
    projectionMatrixInverse = new Matrix4()
    worldCameraMatrix = new Matrix4()
    viewMatrix = new Matrix4()
    projectionViewMatrix = new Matrix4()
    projectionViewMatrixInverse = new Matrix4()
    #cameraHasMoved = true
    position = new Vector3(0, 0, -10)
    target = new Vector3(0, 0, 0)

    #projectionNeedsUpdate = true
    #aspect = 1
    set aspect(value) { this.#aspect = value; this.#projectionNeedsUpdate = true }
    get aspect() { return this.#aspect }
    #near
    set near(value) { this.#near = value; this.#projectionNeedsUpdate = true }
    get near() { return this.#near }
    #far
    set far(value) { this.#far = value; this.#projectionNeedsUpdate = true }
    get far() { return this.#far }
    #fov
    set fov(value) { this.#fov = value; this.#projectionNeedsUpdate = true }
    get fov() { return this.#fov }

    frustum = new Frustum()

    constructor({ near = 0.1, far = 200, fov = 50 }) {
        addVector3Callback(this.position, () => { this.#cameraHasMoved = true })
        addVector3Callback(this.target, () => { this.#cameraHasMoved = true })

        this.#near = near
        this.#far = far
        this.#fov = fov

        this.update()
    }

    update() {
        if (this.#cameraHasMoved) {
            this.#updateWorldCameraMatrixPosition()
            this.#lookAt(this.target)
            this.#updateViewMatrix()
        }

        if (this.#projectionNeedsUpdate) {
            this.#updateProjectionMatrix()
        }

        if (this.#projectionNeedsUpdate || this.#cameraHasMoved) {
            this.#updateProjectionViewMatrix()
            this.#updateFrustum()
            this.version++
        }

        this.#cameraHasMoved = false
        this.#projectionNeedsUpdate = false
    }

    #updateWorldCameraMatrixPosition() {
        this.worldCameraMatrix.elements[12] = this.position.x
        this.worldCameraMatrix.elements[13] = this.position.y
        this.worldCameraMatrix.elements[14] = this.position.z
    }

    #updateViewMatrix() {
        this.viewMatrix
            .copy(this.worldCameraMatrix)
            .invert()
    }

    #updateProjectionViewMatrix() {
        this.projectionViewMatrix.multiplyMatrices(this.projectionMatrix, this.viewMatrix)
        this.projectionViewMatrixInverse.copy(this.projectionViewMatrix).invert()
    }

    #updateFrustum() {
        this.frustum.setFromProjectionMatrix(this.projectionViewMatrix)
    }

    #lookAt(x, y, z) {
        if (x.constructor === Vector3) {
            this.worldCameraMatrix.lookAt(this.position, x, _up)
        } else {
            _vec3.set(x, y, z)
            this.worldCameraMatrix.lookAt(this.position, _vec3, _up)
        }
    }

    #updateProjectionMatrix() {
        const near = this.#near
        const top = near * Math.tan(DEG2RAD * 0.5 * this.#fov)
        const height = 2 * top
        const width = this.#aspect * height
        const left = - 0.5 * width

        this.projectionMatrix.makePerspective(left, left + width, top, top - height, near, this.#far)
        this.projectionMatrixInverse.copy(this.projectionMatrix).invert()
    }
}
