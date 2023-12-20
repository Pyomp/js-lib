import { Node3D } from "../../Node3D.js"
import { Mixer } from "./animation/Mixer.js"
import { Animation } from "./animation/Animation.js"

export class SkinnedNode extends Node3D {
    /**
    * 
    * @param {Animation} animation
    */
    constructor(animation) {
        super()
        this.mixer = new Mixer(animation)
    }

    dispose() {
        super.dispose()
        this.mixer.dispose()
    }
}
