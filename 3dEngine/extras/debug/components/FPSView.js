const MAX_BUFFER_SIZE = 60

export class FPSView {
    htmlElement = document.createElement('span')

    #fps = [60]

    #last = performance.now() / 1000

    constructor() {
        this.htmlElement.style.position = 'fixed'
        this.htmlElement.style.bottom = '5px'
        this.htmlElement.style.left = '5px'
        this.htmlElement.style.userSelect = 'none'
        this.htmlElement.style.pointerEvents = 'none'
    }

    update() {
        const now_s = performance.now() / 1000
        const dt = now_s - this.#last
        this.#last = now_s
        this.#fps.unshift(1 / dt)

        if (this.#fps.length > MAX_BUFFER_SIZE) {
            this.htmlElement.innerHTML = (this.#fps.reduce((a, b) => a + b) / MAX_BUFFER_SIZE).toFixed()
            this.#fps.length = 0
        }
    }
}
