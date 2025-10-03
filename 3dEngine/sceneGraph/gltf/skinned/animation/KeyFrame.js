/** @template {Array<any>} T */
export class KeyFrame {
    constructor(
        /** @type {Float32Array} */ key,
         /** @type {T} */ frame,
         /** @type {boolean} */  isLinear
    ) {
        this.key = key
        this.frame = frame
        this.isLinear = isLinear
    }
}
