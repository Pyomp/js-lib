import { loopRaf } from "./loopRaf.js"


/**
 * class made for physics system
 * 
 * update callbacks are called at a given rate
 * to have a fixed deltatime
 * 
 * pre callback is called before all update callbacks
*/
export class DeltaTimeUpdater {
    #now = loopRaf.perfNowSecond

    #rest = 0

    /** @type {number} */
    #updateDeltaTimeS

    /** @type {()=>void} */
    #updateCallback

    /** @type {()=>void} */
    #preCallback

    constructor(
        /** @type {()=>void} */ updateCallback,
        /** @type {()=>void} */preCallback = () => { },
        updateDeltaTimeSecond = 0.01
    ) {
        this.#updateCallback = updateCallback
        this.#preCallback = preCallback
        this.#updateDeltaTimeS = updateDeltaTimeSecond
    }

    update() {
        const now = loopRaf.perfNowSecond
        const deltaTime = now - this.#now

        this.#now = now
        this.#rest += deltaTime
        this.#rest = Math.min(1, this.#rest)

        if (this.#rest > this.#updateDeltaTimeS) {
            this.#preCallback()

            while (this.#rest > this.#updateDeltaTimeS) {
                this.#rest -= this.#updateDeltaTimeS
                this.#updateCallback()
            }
        }
    }
}
