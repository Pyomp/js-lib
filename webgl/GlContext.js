export class GlContext {
    canvas = document.createElement('canvas')

   /** @type {WebGL2RenderingContext} */ gl

    constructor(/** @type {WebGLContextAttributes} */ options = {
        alpha: false,
        antialias: false,
        depth: true,
        // desynchronized?: boolean
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'default',
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: true
    }) {
        this.gl = this.canvas.getContext("webgl2", options)

        this.canvas.style.top = '0'
        this.canvas.style.left = '0'
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'
        this.canvas.style.zIndex = '-1'
        this.canvas.style.position = 'fixed'

        this.gl.clearColor(0, 0, 0, 0)

        this.#resizeObserver.observe(this.canvas)
    }

    /** @type {Set<(width: number, height: number) => void>} */
    resizeListeners = new Set()

    #resizeListener() {
        const width = this.canvas.clientWidth || 1
        const height = this.canvas.clientHeight || 1
        this.canvas.width = width
        this.canvas.height = height
        this.gl.viewport(0, 0, width, height)
        for (const cb of this.resizeListeners) cb(width, height)
    }
    #resizeObserver = new ResizeObserver(this.#resizeListener.bind(this))
}
