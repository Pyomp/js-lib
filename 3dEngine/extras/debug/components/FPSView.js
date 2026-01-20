const MAX_BUFFER_SIZE = 60

export class FPSView {
    htmlElement = document.createElement('span')

    #fps = [60]

    #last = performance.now() / 1000

    #requestAnimationFrameId = 0

    constructor() {
        this.htmlElement.style.position = 'absolute'
        this.htmlElement.style.bottom = '5px'
        this.htmlElement.style.right = '5px'
        this.htmlElement.style.userSelect = 'none'
        this.htmlElement.style.pointerEvents = 'none'

        this.#requestAnimationFrameId = requestAnimationFrame(this.#updateBound)
    }

    #updateBound = this.#update.bind(this)
    #update(/** @type {number} */ now_ms) {
        const now_s = now_ms / 1000
        const dt = now_s - this.#last
        this.#last = now_s
        this.#fps.unshift(1 / dt)

        if (this.#fps.length > MAX_BUFFER_SIZE) {
            this.htmlElement.innerHTML = (this.#fps.reduce((a, b) => a + b) / MAX_BUFFER_SIZE).toFixed()
            this.#fps.length = 0
        }

        this.#requestAnimationFrameId = requestAnimationFrame(this.#updateBound)
    }

    dispose() {
        this.htmlElement.remove()
        cancelAnimationFrame(this.#requestAnimationFrameId)
    }
}
