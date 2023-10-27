/**
 * @typedef {{
 *  time: number
 *  color: Color
 *  alpha: number
 *  size: number
 * }} ParticleAnimationFrame
 */

export class ParticleAnimation {
    /** @type {ParticleAnimationFrame[]} */ #frames = []

    /**
     * 
     * @param {ParticleAnimationFrame} param0 
     */
    addFrame({
        time,
        color,
        alpha,
        size
    }) {
        this.#frames.push({
            time,
            color,
            alpha,
            size
        })

        this.#frames.sort((a, b) => a.time - b.time)
        console.log(this.#frames)
    }

    /**
     * 
     * @param {*} offset 
     * @param {*} stride 
     * @param {*} target 
     */
    toArray(offset, stride, target) {
        for (let i = 0; i < this.#frames.length; i++) {
            const frame = this.#frames[i]

            target.set([
                frame.time, 0, 0, 0,
                frame.color.r, frame.color.g, frame.color.b, frame.alpha,
                frame.size, 0, 0, 0
            ], offset + stride * i)
        }
    }
}
