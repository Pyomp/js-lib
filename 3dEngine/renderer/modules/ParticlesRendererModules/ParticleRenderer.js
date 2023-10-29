import { Color } from "../../../../math/Color.js"
import { Attribute } from "../../../sceneGraph/Attribute.js"
import { ParticleKeyframe } from "../../../sceneGraph/particle/ParticleKeyframe.js"
import { ParticleSystem } from "../../../sceneGraph/particle/ParticleSystem.js"
import { GlProgram } from "../../../webgl/GlProgram.js"
import { GlTransformFeedback } from "../../../webgl/GlTransformFeedback.js"
import { GlUbo } from "../../../webgl/GlUbo.js"
import { GlVao } from "../../../webgl/GlVao.js"
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

    initGl(gl, uboIndex) {
        this.#gl = gl
        this.#systemUboIndex = GlUbo.getIndex(gl)
        this.#physicsProgram = new ParticlePhysicsGlProgram(gl, { ...uboIndex, systemUBO: this.#systemUboIndex }, FRAME_COUNT)
        this.#renderProgram = new ParticleRenderGlProgram(gl, uboIndex)
    }

    disposeGl() {
        GlUbo.freeIndex(this.#gl, this.#systemUboIndex)
        this.#physicsProgram.dispose()
        this.#renderProgram.dispose()

        for (const particleSystemGl of Object.values(this.#particleSystemGl)) {
            particleSystemGl.vaoPhysics.dispose()
            particleSystemGl.vaoRender.dispose()
            particleSystemGl.transformFeedback.dispose()
            this.#gl.deleteBuffer(particleSystemGl.systemUboBuffer)
        }
        this.#particleSystemGl.clear()
    }

    onContextLost() {
        this.#particleSystemGl.clear()
    }

    /** @type {Map<ParticleSystem, ParticleSystemState>} */
    #particleSystemGl = new Map()

    /**
     * @param {number} deltatimeSecond 
     */
    draw(deltatimeSecond) {
        const gl = this.#gl

        for (const particleSystem of this.particleSystems) {
            if (!this.#particleSystemGl.has(particleSystem)) {
                this.#particleSystemGl.set(particleSystem, new ParticleSystemState(particleSystem, this.#gl, this.#physicsProgram, this.#renderProgram))
            }
        }

        // transform feedback
        gl.enable(WebGL2RenderingContext.RASTERIZER_DISCARD)
        gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, null)
        gl.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, null)

        this.#physicsProgram.useProgram()

        this.#physicsProgram.uniformUpdate['deltatimeSecond'](deltatimeSecond)

        for (const particleSystem of this.particleSystems) {
            const systemState = this.#particleSystemGl.get(particleSystem)

            if (systemState.emitterTime < particleSystem.particleLifeTime) {
                systemState.emitterTime += deltatimeSecond
                systemState.count = (particleSystem.geometry.count / particleSystem.particleLifeTime) * systemState.emitterTime
                if (systemState.count > particleSystem.geometry.count) systemState.count = particleSystem.geometry.count
            }

            this.#physicsProgram.uniformUpdate['modelPosition'](particleSystem.position)
            this.#physicsProgram.uniformUpdate['modelRotation'](particleSystem.rotation)

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

        for (const particleSystem of this.particleSystems) {
            const systemState = this.#particleSystemGl.get(particleSystem)
            const count = systemState.count

            copyBuffer(gl, systemState.vaoRender.buffers['position'], systemState.vaoPhysics.buffers['position'], count * 4 * 4)
            copyBuffer(gl, systemState.transformFeedback.buffers['outVelocity'], systemState.vaoPhysics.buffers['velocity'], count * 4 * 4)

            systemState.vaoRender.bind()

            this.#gl.drawArrays(WebGL2RenderingContext.POINTS, 0, count)
        }
    }
}
