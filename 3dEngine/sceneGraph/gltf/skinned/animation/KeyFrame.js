export class KeyFrame {
    constructor(
        /** @type {Float32Array} */ key,
         /** @type {Float32Array[]} */ frame,
         /** @type {boolean} */  isLinear
    ) {
        this.key = key
        this.frame = frame
        this.isLinear = isLinear
    }
}
