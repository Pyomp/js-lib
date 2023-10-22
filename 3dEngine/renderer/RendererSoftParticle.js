import { Renderer } from "./Renderer.js"
import { ParticlesRenderer } from './modules/ParticlesRenderer.js'

export class RendererSoftParticle extends Renderer {
    initGl() {
        super.initGl()
        if (!this.particles) this.particles = new ParticlesRenderer()
        this.particles.initGl(this.glContext.gl, this.uboIndex)
    }

    resetGlStates() {
        super.resetGlStates()
        this.particles.disposeGl()
        this.particles.initGl(this.glContext.gl, this.uboIndex)
    }

    updateParticles() {
        this.particles.update()
    }

    render() {
        this.updateParticles()

        super.render()

        this.particles.draw()
    }
}
