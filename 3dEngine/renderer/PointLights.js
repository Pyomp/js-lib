import { PointLight } from "../sceneGraph/light/PointLight.js"
import { GlUbo } from "../webgl/GlUbo.js"

export class PointLights {
    /** @type {Float32Array} */ #view

    /** @type {Set<PointLight>} */
    lights = new Set()

    /** @type {WebGL2RenderingContext} */ #gl

    needsUpdate = true

    constructor(gl) {
        this.initUbo(gl)
    }

    initUbo(gl) {
        this.#gl = gl
        this.#count = 0
        this.ubo?.dispose()
    }

    #count = 0
    update() {
        if (this.#count !== this.lights.size) {
            this.#count = this.lights.size
            this.ubo?.dispose()
            this.ubo = new GlUbo(this.#gl, this.lights.size * 4 * 8)
            this.#view = new Float32Array(this.ubo.data)
        }

        let offset = 0
        let uboNeedsUpdate = false
        for (const light of this.lights) {
            if (light.needsUpdate) {
                light.toArray(this.#view, offset)
                uboNeedsUpdate = true
            }
            offset += 8
        }

        if (uboNeedsUpdate) this.ubo.update()
    }
}
