import { Renderer } from "./Renderer.js"
import { ParticleRenderer } from "./modules/ParticlesRendererModules/ParticleRenderer.js"

export class RendererSoftParticle extends Renderer {
    initGl() {
        super.initGl()
        if (!this.particles) this.particles = new ParticleRenderer()
        this.particles.initGl(this.glContext.gl, this.uboIndex)
    }

    resetGlStates() {
        super.resetGlStates()
        this.particles.disposeGl()
        this.particles.initGl(this.glContext.gl, this.uboIndex)
    }   

    onContextLost(){
        super.onContextLost()
        this.particles.onContextLost()
    }

    render(deltatimeSecond) {
        super.render()

        this.particles.draw(deltatimeSecond)
    }
}
