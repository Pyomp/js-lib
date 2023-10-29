import { Box3 } from "../../../math/Box3.js"

export class ParticleGeometry {
    constructor(count) {
        this.count = count
        this.boundingBox = new Box3()
        this.time = new Float32Array(count)
        this.velocity = new Float32Array(count * 3)
        this.position = new Float32Array(count * 3)
    }
}
