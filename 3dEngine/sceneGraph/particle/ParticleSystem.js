import { ParticleGeometry } from "./ParticleGeometry.js"
import { ParticleKeyframe } from "./ParticleKeyframe.js"

export class ParticleSystem {
    /**
     * 
     * @param {{
     *  particleKeyframes: ParticleKeyframe[]
     *  geometry: ParticleGeometry
     *  mass?: number
     *  loopTime?: number
     *  endTime?: number
     *  map: Texture
     * }} param0 
     */
    constructor({
        particleKeyframes = [],
        geometry,
        mass = 0,
        loopTime = 0,
        endTime = 0,
        map
    }) {
        this.particleKeyframes = particleKeyframes
        this.geometry = geometry
        this.mass = mass
        this.loopTime = loopTime
        this.endTime = endTime
        this.map = map
    }
}
