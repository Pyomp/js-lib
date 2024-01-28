import { GlUboData } from "../glDescriptors/GlUboData.js"
import { GLSL_POINT_LIGHT } from "../../programs/chunks/glslPointLight.js"
import { PointLight } from "../../sceneGraph/PointLight.js"

const UBO_F32A_LENGTH = GLSL_POINT_LIGHT.uboByteLength / Float32Array.BYTES_PER_ELEMENT

export class GlPointLightRenderer {
    glUboData = new GlUboData(GLSL_POINT_LIGHT.uboByteLength)
    #uboF32a = new Float32Array(this.glUboData.arrayBuffer)

    uboPointLightCount = 1

    /** 
     * @param {PointLight[]} pointLights
     */
    updateUbo(pointLights) {
        if (this.glUboData.arrayBuffer.byteLength < pointLights.length * GLSL_POINT_LIGHT.uboByteLength) {
            this.uboPointLightCount = pointLights.length
            this.glUboData.setNewByteLength(pointLights.length * GLSL_POINT_LIGHT.uboByteLength)
            this.#uboF32a = new Float32Array(this.glUboData.arrayBuffer)
        }

        const uboLength = this.glUboData.arrayBuffer.byteLength / GLSL_POINT_LIGHT.uboByteLength

        for (let i = 0; i < pointLights.length; i++) {
            const pointLight = pointLights[i]
            const offset = i * UBO_F32A_LENGTH
            this.#updateF32aUbo(pointLight, offset)
        }

        for (let i = pointLights.length; i < uboLength; i++) {
            this.#uboF32a[i * UBO_F32A_LENGTH + GLSL_POINT_LIGHT.uboOffset.intensity] = 0
        }

        this.glUboData.version++
    }

    /**
     * 
     * @param {PointLight} light 
     * @param {number} offset 
     */
    #updateF32aUbo(light, offset) {
        if (light.intensity > 0) {
            light.position.toArray(this.#uboF32a, offset + GLSL_POINT_LIGHT.uboOffset.position)
            light.color.toArray(this.#uboF32a, offset + GLSL_POINT_LIGHT.uboOffset.color)
            this.#uboF32a[offset + GLSL_POINT_LIGHT.uboOffset.intensity] = light.intensity
        } else {
            this.#uboF32a[offset + GLSL_POINT_LIGHT.uboOffset.intensity] = 0
        }
    }
}
