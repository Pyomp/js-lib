import { loopRaf } from "../../../../utils/loopRaf.js"
import { Particle } from "../../../sceneGraph/particle/Particle.js"
import { GlContextRenderer } from "../../glContext/GlContextRenderer.js"
import { copyBuffer, printBuffer } from "../../glContext/utils.js"
import { GlArrayBuffer } from "../../glDescriptors/GlArrayBuffer.js"
import { GlTexture } from "../../glDescriptors/GlTexture.js"
import { ParticlePhysicsGlObject } from "./ParticlePhysicsGlProgramData.js"
import { ParticleRenderGlObject } from "./ParticleRenderGlProgramData.js"

export class GlParticleRenderer {
    #glContext
    #maxParticleCount
    /** @type {GlArrayBuffer} */ #transformFeedbackBufferData
    #vaoBufferData

    /**
     *  
     * @param {{
     *  glContext: GlContextRenderer
     *  glDepthTextureData: GlTexture
     *  maxParticleCount?: number
     * }} param0 
     */
    constructor({
        glContext,
        glDepthTextureData,
        maxParticleCount = 100_000,
    }) {
        this.#maxParticleCount = maxParticleCount
        this.#glContext = glContext
        this.particlePhysicsGlObject = new ParticlePhysicsGlObject(maxParticleCount)
        this.#transformFeedbackBufferData = this.particlePhysicsGlObject.outArrayBufferData
        this.#vaoBufferData = this.particlePhysicsGlObject.glVao.attributes[0].glArrayBuffer
        this.particleRenderObject = new ParticleRenderGlObject(this.#vaoBufferData, glDepthTextureData, maxParticleCount)
    }

    #particleOffset = 0
    /**
     * @param {Particle} particle 
     */
    addParticle(particle) {
        this.particleRenderObject.addParticle(particle, this.#particleOffset)
        this.particlePhysicsGlObject.addParticle(particle, this.#particleOffset)
        this.#particleOffset = (this.#particleOffset + 1) % this.#maxParticleCount
    }

    update() {
        this.particlePhysicsGlObject.uniforms['deltaTime'] = loopRaf.deltatimeSecond

        const transformFeedbackBuffer = this.#glContext.getGlArrayBuffer(this.#transformFeedbackBufferData).glBuffer
        const vaoBuffer = this.#glContext.getGlArrayBuffer(this.#vaoBufferData)

        const gl = this.#glContext.gl

        gl.bindBuffer(WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, transformFeedbackBuffer)
        gl.bindBuffer(WebGL2RenderingContext.COPY_WRITE_BUFFER, vaoBuffer.glBuffer)
        gl.copyBufferSubData(WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, WebGL2RenderingContext.COPY_WRITE_BUFFER, 0, 0, this.#maxParticleCount)

        copyBuffer(this.#glContext.gl, transformFeedbackBuffer, vaoBuffer.glBuffer, this.#maxParticleCount * 4 * 7)

        vaoBuffer.updateBufferSubData()

        // printBuffer(gl, transformFeedbackBuffer, WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, 10)
    }
}
