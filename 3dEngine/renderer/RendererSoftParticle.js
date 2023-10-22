import { Renderer } from "./Renderer.js"

export class RendererSoftParticle extends Renderer {
    draw() {
        this.updateUbos()

        const [opaqueObjects, transparentObjects] = this.getObjectsToDraw()

        this.glContext.blending = false
        this.drawObjects(opaqueObjects)
        this.glContext.blending = true
        this.drawObjects(transparentObjects)
    }
}
