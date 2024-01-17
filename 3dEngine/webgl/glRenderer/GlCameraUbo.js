import { Camera } from "../../sceneGraph/Camera.js"
import { GlUboData } from "../glDescriptors/GlUboData.js"
import { GLSL_CAMERA } from '../../programs/chunks/glslCamera.js'

export class GlCameraUbo {
    #version = -1

    #camera
    glUboData = new GlUboData(GLSL_CAMERA.uboByteLength)
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

            this.glUboData.version++
        }
    }
}
