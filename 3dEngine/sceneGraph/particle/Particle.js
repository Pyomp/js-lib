import { Vector3 } from "../../../math/Vector3.js"
import { GlTextureData } from "../../webgl/glDescriptors/GlTextureData.js"
import { ParticleKeyframe } from "./ParticleKeyframe.js"

export class Particle {
    /**
     * @param {{
     *      position?: Vector3
     *      velocity?: Vector3
     *      keyframes: ParticleKeyframe[]
     *      texture: GlTextureData
     * }} param0 
     */
    constructor({
        position = new Vector3(),
        velocity = new Vector3(),
        keyframes,
        texture
    }) {
        this.position = position
        this.velocity = velocity
        this.keyframes = keyframes
        this.texture = texture
    }
}
