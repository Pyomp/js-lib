import { GlUbo } from "../../webgl/GlUbo.js"

export class WindowInfoRenderer {
    #ubo
    #uboArray

    #uboNeedsUpdate = true

    width = 1
    height = 1
    pointerX = -1
    pointerY = -1

    get uboIndex() { return this.#ubo?.index ?? 0 }

    /**
    * @param {WebGL2RenderingContext} gl 
    */
    constructor(gl) {
        this.initGl(gl)
        gl.canvas.addEventListener("mouseenter", (e) => {
            removeEventListener('pointermove', this.pointermove)
            addEventListener('pointermove', this.pointermove)
        })

        gl.canvas.addEventListener("mouseleave", (e) => {
            removeEventListener('pointermove', this.pointermove)
            this.pointerX = -1
            this.pointerY = -1
            this.#uboNeedsUpdate = true
        })
    }

    pointermove = (event) => {
        this.pointerX = event.x
        this.pointerY = event.y
        this.#uboNeedsUpdate = true
    }

    setSize(width, height) {
        this.width = width
        this.height = height
        this.#uboNeedsUpdate = true
    }

    initGl(gl) {
        this.#ubo?.dispose()
        this.#ubo = new GlUbo(gl, (2 + 2) * 4)
        this.#uboArray = new Float32Array(this.#ubo.data)
    }

    disposeGl() {
        this.#ubo.dispose()
    }

    update() {
        if (this.#uboNeedsUpdate) {
            this.#uboArray[0] = this.width
            this.#uboArray[1] = this.height
            this.#uboArray[2] = this.pointerX
            this.#uboArray[3] = this.pointerY
            this.#ubo.update()
            this.#uboNeedsUpdate = false
        }
    }
}
