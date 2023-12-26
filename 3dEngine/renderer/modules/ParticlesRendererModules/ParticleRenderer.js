import { ParticleSystem } from "../../../sceneGraph/particle/ParticleSystem.js"
import { GlProgram } from "../../../webgl/GlProgram.js"
import { GlTexture } from "../../../webgl/GlTexture.js"
import { GlUbo } from "../../../webgl/GlUbo.js"
import { copyBuffer } from "../../../webgl/utils.js"
import { ParticlePhysicsGlProgram } from "./ParticlePhysicsGlProgram.js"
import { ParticleRenderGlProgram } from "./ParticleRenderGlProgram.js"
import { ParticleSystemState } from "./ParticleSystemState.js"

export const FRAME_COUNT = 10

export class ParticleRenderer {
    /** @type {Set<ParticleSystem>} */ particleSystems = new Set()

    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {GlProgram} */ #physicsProgram
    /** @type {number} */ #systemUboIndex
    /** @type {GlProgram} */ #renderProgram
    /** @type {GlTexture} */ #depthTexture
    /** @type {Renderer} */ #renderer

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {{[uboName: string]: number}} uboIndex 
     * @param {GlTexture} glDepthTexture 
     * @param {Renderer} renderer
     */
    initGl(gl, uboIndex, glDepthTexture, renderer) {
        this.#renderer = renderer
        this.#gl = gl
        this.#systemUboIndex = GlUbo.getIndex(gl)
        this.#physicsProgram = new ParticlePhysicsGlProgram(gl, { ...uboIndex, systemUBO: this.#systemUboIndex }, FRAME_COUNT)
        this.#renderProgram = new ParticleRenderGlProgram(gl, uboIndex)

        this.depthFrameBuffer = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer)

        this.#depthTexture = glDepthTexture

        gl.bindTexture(gl.TEXTURE_2D, this.#depthTexture.texture)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.#depthTexture.texture, 0)
    }

    disposeGl() {
        GlUbo.freeIndex(this.#gl, this.#systemUboIndex)
        this.#physicsProgram.dispose()
        this.#renderProgram.dispose()

        for (const [particleSystem, systemState] of this.#particleSystemMap) {
            systemState.dispose()

            if (particleSystem.stopRequest) {
                this.particleSystems.delete(particleSystem)
            }
        }

        this.#particleSystemMap.clear()
    }

    onContextLost() {
        this.#particleSystemMap.clear()
    }

    /** @type {Map<ParticleSystem, ParticleSystemState>} */
    #particleSystemMap = new Map()

    /**
     * @param {number} deltatimeSecond 
     */
    draw(deltatimeSecond) {
        const gl = this.#gl

        for (const particleSystem of this.particleSystems) {
            if (!this.#particleSystemMap.has(particleSystem)) {
                this.#particleSystemMap.set(particleSystem, new ParticleSystemState(particleSystem, this.#gl, this.#physicsProgram, this.#renderProgram))
            }
        }

        // transform feedback
        gl.enable(WebGL2RenderingContext.RASTERIZER_DISCARD)
        gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, null)
        gl.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, null)

        this.#physicsProgram.useProgram()

        this.#physicsProgram.uniformUpdate['deltatimeSecond'](deltatimeSecond)

        for (const particleSystem of this.particleSystems) {
            const systemState = this.#particleSystemMap.get(particleSystem)

            if (systemState.emitterTime < particleSystem.particleLifeTime) {
                systemState.emitterTime += deltatimeSecond
                systemState.count = (particleSystem.geometry.count / particleSystem.particleLifeTime) * systemState.emitterTime
                if (systemState.count > particleSystem.geometry.count) systemState.count = particleSystem.geometry.count
            }

            this.#physicsProgram.uniformUpdate['modelPosition'](particleSystem.position)
            this.#physicsProgram.uniformUpdate['modelRotation'](particleSystem.rotation)

            if (particleSystem.stopRequest && !systemState.stopRequest) {
                systemState.stopRequest = true

                setTimeout(() => {
                    systemState.dispose()
                    this.particleSystems.delete(particleSystem)
                    this.#particleSystemMap.delete(particleSystem)
                }, particleSystem.particleLifeTime * 1000)
            }

            this.#physicsProgram.uniformUpdate['stopRequest'](systemState.stopRequest ? 1 : 0)

            this.#gl.bindBufferBase(WebGL2RenderingContext.UNIFORM_BUFFER, this.#systemUboIndex, systemState.systemUboBuffer)

            systemState.vaoPhysics.bind()
            systemState.transformFeedback.bind()
            gl.beginTransformFeedback(WebGL2RenderingContext.POINTS)

            gl.drawArrays(WebGL2RenderingContext.POINTS, 0, systemState.count)

            gl.endTransformFeedback()
        }

        gl.disable(WebGL2RenderingContext.RASTERIZER_DISCARD)
        gl.bindTransformFeedback(WebGL2RenderingContext.TRANSFORM_FEEDBACK, null)

        // object
        this.#renderProgram.useProgram()
        this.#depthTexture.bindToUnit(this.#renderProgram.textureUnit['depthMap'])

        for (const particleSystem of this.particleSystems) {
            const systemState = this.#particleSystemMap.get(particleSystem)

            copyBuffer(gl, systemState.vaoRender.buffers['position'], systemState.vaoPhysics.buffers['position'], systemState.count * 4 * 4)
            copyBuffer(gl, systemState.transformFeedback.buffers['outVelocity'], systemState.vaoPhysics.buffers['velocity'], systemState.count * 4 * 4)

            systemState.vaoRender.bind()
            this.#renderer.getGlTexture(particleSystem.map).bindToUnit(this.#renderProgram.textureUnit['map'])
            gl.drawArrays(WebGL2RenderingContext.POINTS, 0, systemState.count)
        }
    }
}
