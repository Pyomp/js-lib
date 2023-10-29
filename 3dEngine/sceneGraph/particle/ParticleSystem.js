import { Matrix3 } from "../../../math/Matrix3.js"
import { Vector3 } from "../../../math/Vector3.js"
import { ParticleGeometry } from "./ParticleGeometry.js"
import { ParticleKeyframe } from "./ParticleKeyframe.js"

export class ParticleSystem {
    position = new Vector3()
    rotation = new Matrix3()

    /**
     * 
     * @param {{
     *  particleKeyframes: ParticleKeyframe[]
     *  geometry: ParticleGeometry
     *  mass?: number
     *  map: Texture
     * }} param0 
     */
    constructor({
        particleKeyframes = [],
        geometry,
        mass = 0,
        map
    }) {
        this.particleKeyframes = particleKeyframes
        this.geometry = geometry
        this.mass = mass

        this.particleLifeTime = 0

        for (const frame of particleKeyframes) {
            if (frame.time > this.particleLifeTime) {
                this.particleLifeTime = frame.time
            }
        }

        this.map = map
    }

    stopRequest = false
    stop() { this.stopRequest = true }
}
