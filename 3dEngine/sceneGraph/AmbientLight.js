import { Color } from "../../math/Color.js"

export class AmbientLight {
    constructor(color = new Color(0.2, 0.2, 0.2)) {
        this.color = color
    }
}
