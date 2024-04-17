import { Color } from "../../math/Color.js"

export class AmbientLight {
    constructor(color = new Color(0.3, 0.3, 0.3)) {
        this.color = color
    }
}
