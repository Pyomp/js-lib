import { GlUbo } from "../glDescriptors/GlUbo.js"
import { GLSL_AMBIENT_LIGHT } from "../../programs/chunks/glslAmbient.js"
import { AmbientLight } from "../../sceneGraph/AmbientLight.js"
import { Color } from "../../../math/Color.js"

const UBO_F32A_LENGTH = GLSL_AMBIENT_LIGHT.uboByteLength / Float32Array.BYTES_PER_ELEMENT

const _color = new Color()

export class GlAmbientLightRenderer {
    glUboData = new GlUbo(GLSL_AMBIENT_LIGHT.uboByteLength)
    #uboF32a = new Float32Array(this.glUboData.arrayBuffer)

    /** 
     * @param {AmbientLight[]} ambientLights
     */
    updateUbo(ambientLights) {
        _color.setRGB(0, 0, 0)
        for (const ambientLight of ambientLights) {
            _color.add(ambientLight.color)
        }

        _color.toArray(this.#uboF32a, GLSL_AMBIENT_LIGHT.uboOffset.color)

        this.glUboData.version++
    }
}
