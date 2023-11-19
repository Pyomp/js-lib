import { KeyboardMouseState } from "./KeyboardMouseState.js"

export class KeyboardMouseControls {

    start = new Set()
    ongoing = new Set()
    end = new Set()

    /**
     * 
     * @param {HTMLElement} element 
     */
    constructor(element) {
        this.keyboardMouseState = new KeyboardMouseState(element)
    }

    update() {
        this.start.clear()
        this.end.clear()

        for (const key of this.ongoing) {
            if (!this.keyboardMouseState.buttons.has(key) && !this.keyboardMouseState.keys.has(key)) {
                this.ongoing.delete(key)
                this.end.add(key)
            }
        }

        for (const key of this.keyboardMouseState.buttons) {
            if (!this.ongoing.has(key)) {
                this.start.add(key)
                this.ongoing.add(key)
            }
        }
        for (const key of this.keyboardMouseState.keys) {
            if (!this.ongoing.has(key)) {
                this.start.add(key)
                this.ongoing.add(key)
            }
        }
    }
}
