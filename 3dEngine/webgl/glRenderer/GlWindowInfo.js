import { GLSL_WINDOW } from "../../programs/chunks/glslWindow.js"
import { GlContext } from "../glContext/GlContext.js"
import { GlUboData } from "../glDescriptors/GlUboData.js"

export class GlWindowInfo {
    glUboData = new GlUboData(GLSL_WINDOW.uboByteLength)
    #uboF32a = new Float32Array(this.glUboData.arrayBuffer)

    width = 1
    height = 1
    pointerX = -1
    pointerY = -1

    /**
    * @param {GlContext} glContext 
    */
    initGl(glContext) {
        glContext.resizeListeners.add((width, height) => {
            this.width = width
            this.height = height
            this.#uboF32a[GLSL_WINDOW.uboOffset.resolution] = width
            this.#uboF32a[GLSL_WINDOW.uboOffset.resolution + 1] = height
            this.glUboData.version++
        })

        glContext.canvas.addEventListener("pointerenter", (e) => {
            removeEventListener('pointermove', this.pointermove)
            addEventListener('pointermove', this.pointermove)
        })

        glContext.canvas.addEventListener("pointerleave", (e) => {
            removeEventListener('pointermove', this.pointermove)
            this.#setPointerLocation(-1, -1)
        })
    }
    
    #setPointerLocation(x, y) {
        this.pointerX = x
        this.pointerY = y
        this.#uboF32a[GLSL_WINDOW.uboOffset.pointer] = x
        this.#uboF32a[GLSL_WINDOW.uboOffset.pointer + 1] = y
        this.glUboData.version++
    }

    pointermove = (event) => {
        this.#setPointerLocation(event.x, event.y)
    }
}
