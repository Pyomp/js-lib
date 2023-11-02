import { TextureObject } from "../extras/TextureObject.js"
import { Texture } from "../sceneGraph/Texture.js"
import { Renderer } from "./Renderer.js"
import { ParticleRenderer } from "./modules/ParticlesRendererModules/ParticleRenderer.js"

export class RendererSoftParticle extends Renderer {
    initGl() {
        super.initGl()

        const gl = this.glContext.gl

        this.depthFrameBuffer = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer)

        const depthTexture = new Texture({
            target: 'TEXTURE_2D',
            wrapS: 'CLAMP_TO_EDGE',
            wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST',
            magFilter: 'NEAREST',
            internalformat: 'DEPTH24_STENCIL8',
            width: 1,
            height: 1,
            border: 0,
            format: 'DEPTH_STENCIL',
            type: 'UNSIGNED_INT_24_8',
            data: null,
            needsMipmap: false
        })

        this.allocTexture(depthTexture)
        this.depthTexture = this.getGlTexture(depthTexture)

        gl.bindTexture(gl.TEXTURE_2D, this.depthTexture.texture)

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture.texture, 0)

        if (!this.particles) this.particles = new ParticleRenderer()
        this.particles.initGl(this.glContext.gl, this.uboIndex, this.depthTexture)

        this.textureObject = new TextureObject(depthTexture)
    }

    onResize(width, height) {
        super.onResize(width, height)
        this.depthTexture.updateSize(width, height)
    }

    resetGlStates() {
        super.resetGlStates()
        this.particles.disposeGl()
        this.particles.initGl(this.glContext.gl, this.uboIndex, this.depthTexture)
    }

    onContextLost() {
        super.onContextLost()
        this.particles.onContextLost()
    }

    render(deltatimeSecond) {
        this.updateUbos()

        const [opaqueObjects, transparentObjects] = this.getObjectsToDraw()

        const gl = this.glContext.gl

        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, null)
        gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT)

        this.glContext.blending = false
        this.drawObjects(opaqueObjects)

        const canvasX = this.glContext.gl.canvas.clientWidth
        const canvasY = this.glContext.gl.canvas.clientHeight

        gl.bindFramebuffer(WebGL2RenderingContext.READ_FRAMEBUFFER, null)
        gl.bindFramebuffer(WebGL2RenderingContext.DRAW_FRAMEBUFFER, this.depthFrameBuffer)
        gl.blitFramebuffer(
            0, 0, canvasX, canvasY,
            0, 0, canvasX, canvasY,
            WebGL2RenderingContext.DEPTH_BUFFER_BIT, WebGL2RenderingContext.NEAREST)

        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, null)

        this.glContext.blending = true
        this.drawObjects(transparentObjects)

        this.particles.draw(deltatimeSecond)
        
        // gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT)
        // this.drawObjects([this.textureObject])
    }
}
