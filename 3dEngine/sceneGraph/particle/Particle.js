import { Vector3 } from "../../../math/Vector3.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { ParticleKeyframe } from "./ParticleKeyframe.js"

export class Particle {
    /**
     * @param {{
     *      position?: Vector3
     *      velocity?: Vector3
     *      size?: Number,
     *      keyframes: ParticleKeyframe[]
     *      texture: GlTexture
     *      time?: number
     * }} param0 
     */
    constructor({
        position = new Vector3(),
        velocity = new Vector3(),
        size = 1,
        keyframes,
        texture,
        time = 0
    }) {
        this.position = position
        this.velocity = velocity
        this.size = size
        this.keyframes = keyframes
        this.texture = texture
        this.time = time
    }
}
