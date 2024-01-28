import { Particle } from "../../../sceneGraph/particle/Particle.js"
import { GlContext } from "../../glContext/GlContext.js"
import { copyBuffer, printBuffer } from "../../glContext/utils.js"
import { GlArrayBufferData } from "../../glDescriptors/GlArrayBufferData.js"
import { GlTextureData } from "../../glDescriptors/GlTextureData.js"
import { ParticlePhysicsGlObject } from "./ParticlePhysicsGlProgramData.js"
import { ParticleRenderGlObject } from "./ParticleRenderGlProgramData.js"

export class GlParticleRenderer {
    #glContext
    #maxParticleCount
    /** @type {GlArrayBufferData} */ #transformFeedbackBufferData
    #vaoBufferData

    /**
     *  
     * @param {{
     *  glContext: GlContext
     *  glDepthTextureData: GlTextureData
     *  maxKeyframes?: number
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
        this.#vaoBufferData = this.particlePhysicsGlObject.glVaoData.attributesData[0].glArrayBufferData
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

    update(deltatimeSecond) {
        this.particlePhysicsGlObject.uniforms['deltaTime'] = deltatimeSecond

        const transformFeedbackBuffer = this.#glContext.getGlArrayBuffer(this.#transformFeedbackBufferData).glBuffer
        const vaoBuffer = this.#glContext.getGlArrayBuffer(this.#vaoBufferData)


        const gl = this.#glContext.gl

        gl.bindBuffer(WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, transformFeedbackBuffer)
        gl.bindBuffer(WebGL2RenderingContext.COPY_WRITE_BUFFER, vaoBuffer.glBuffer)
        gl.copyBufferSubData(WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, WebGL2RenderingContext.COPY_WRITE_BUFFER, 0, 0, this.#maxParticleCount)

        copyBuffer(this.#glContext.gl, transformFeedbackBuffer, vaoBuffer.glBuffer, this.#maxParticleCount * 4 * 4)

        const physicsRangeToUpdate = this.particlePhysicsGlObject.rangeToUpdate
        if (physicsRangeToUpdate[1] > 0) {
            vaoBuffer.updateBufferSubDataRange(physicsRangeToUpdate[0], physicsRangeToUpdate[1])
            physicsRangeToUpdate[0] = Infinity
            physicsRangeToUpdate[1] = 0
        }

        // printBuffer(gl, transformFeedbackBuffer, WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, 10)
    }
}
