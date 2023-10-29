import { Color } from "../../../math/Color.js"

export class ParticleKeyframe {
    /**
     * @param {{
     *   time: number
     *   color: Color
     *   size: number
     * }} param0 
     */
    constructor({
        time,
        color = new Color(),
        size = 1
    }) {
        this.time = time
        this.color = color
        this.size = size
    }
}
