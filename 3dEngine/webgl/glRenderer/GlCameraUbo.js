import { Camera } from "../../sceneGraph/Camera.js"
import { GlUbo } from "../glDescriptors/GlUbo.js"
import { GLSL_CAMERA } from '../../programs/chunks/glslCamera.js'
import { degToRad } from "../../../math/MathUtils.js"

export class GlCameraUbo {
    #version = 0

    #camera
    glUboData = new GlUbo(GLSL_CAMERA.uboByteLength)
    #uboF32a = new Float32Array(this.glUboData.arrayBuffer)

    /**
     * 
     * @param {Camera} camera 
     */
    constructor(camera) {
        this.#camera = camera
    }

    update() {
        if (this.#version !== this.#camera.version) {
            this.#version = this.#camera.version

            this.#camera.viewMatrix.toArray(this.#uboF32a, GLSL_CAMERA.uboOffset.viewMatrix)
            this.#camera.projectionMatrix.toArray(this.#uboF32a, GLSL_CAMERA.uboOffset.projectionMatrix)
            this.#camera.projectionViewMatrix.toArray(this.#uboF32a, GLSL_CAMERA.uboOffset.projectionViewMatrix)
            this.#camera.projectionViewMatrixInverse.toArray(this.#uboF32a, GLSL_CAMERA.uboOffset.projectionViewMatrixInverse)
            this.#camera.position.toArray(this.#uboF32a, GLSL_CAMERA.uboOffset.position)
            this.#uboF32a[GLSL_CAMERA.uboOffset.near] = this.#camera.near
            this.#uboF32a[GLSL_CAMERA.uboOffset.far] = this.#camera.far
            this.#uboF32a[GLSL_CAMERA.uboOffset.fovTanHalf] = Math.tan(degToRad(this.#camera.fov * 0.5))

            this.glUboData.version++
        }
    }
}
