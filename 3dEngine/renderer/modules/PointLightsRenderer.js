import { PointLight } from "../../sceneGraph/light/PointLight.js"
import { GlUbo } from "../../webgl/GlUbo.js"

export class PointLightsRenderer {
    /** @type {Float32Array} */ #uboArray

    #gl

    #count = 0

    #ubo

    get uboIndex() { return this.#ubo?.index ?? 0 }

    get count() { return this.#count }

    /**
     * @param {WebGL2RenderingContext} gl 
     */
    constructor(gl) {
        this.#gl = gl
        this.initGl(gl)
    }

    initGl(gl) {
        this.#gl = gl
        this.#count = 0
        this.#ubo?.dispose()
    }

    /** @param {Set<PointLight>} lights */
    updateUbo(lights) {
        let uboHasChanged = false

        if (this.#count !== lights.size) {
            this.#count = lights.size
            this.#ubo?.dispose()
            this.#ubo = new GlUbo(this.#gl, lights.size * 4 * 8)
            this.#uboArray = new Float32Array(this.#ubo.data)
            uboHasChanged = true
        }

        let offset = 0
        let uboNeedsUpdate = false
        for (const light of lights) {
            if (light.needsUpdate) {
                light.toArray(this.#uboArray, offset)
                uboNeedsUpdate = true
            }
            offset += 8
        }

        if (uboNeedsUpdate) this.#ubo.update()

        return uboHasChanged
    }
}
