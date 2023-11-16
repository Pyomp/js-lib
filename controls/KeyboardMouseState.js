export class KeyboardMouseState {
    keys = new Set()
    buttons = new Set()

    alt = false
    ctrl = false
    meta = false
    shift = false

    /**
     * 
     * @param {HTMLElement} element 
     */
    constructor(element) {
        element.addEventListener("mousedown", (event) => {
            this.buttons.add(event.button)
            this.alt = event.altKey
            this.ctrl = event.ctrlKey
            this.meta = event.metaKey
            this.shift = event.shiftKey
        })

        element.addEventListener("mouseup", (event) => {
            this.buttons.delete(event.button)
            this.alt = event.altKey
            this.ctrl = event.ctrlKey
            this.meta = event.metaKey
            this.shift = event.shiftKey
        })

        element.addEventListener("keydown", (event) => {
            this.keys.add(event.code)
            this.alt = event.altKey
            this.ctrl = event.ctrlKey
            this.meta = event.metaKey
            this.shift = event.shiftKey
        })

        element.addEventListener("keyup", (event) => {
            this.keys.delete(event.code)
            this.alt = event.altKey
            this.ctrl = event.ctrlKey
            this.meta = event.metaKey
            this.shift = event.shiftKey
        })
    }
}

