/**
 * @typedef {{
 *  time: number
 *  color: Color
 *  alpha: number
 *  size: number
 *  mass: number
 * }} ParticleAnimationFrame
 */

export class ParticleAnimation {
    /** @type {ParticleAnimationFrame[]} */ frames = []

    /**
     * 
     * @param {ParticleAnimationFrame} param0 
     */
    addFrame({
        time,
        color,
        alpha,
        size,
        mass,
    }) {
        this.frames.push({
            time,
            color,
            alpha,
            size,
            mass,
        })

        this.frames.sort((a, b) => a.time - b.time)
    }
}
