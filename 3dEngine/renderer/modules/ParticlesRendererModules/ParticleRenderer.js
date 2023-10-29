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

const emptyFrame = new ParticleKeyframe({
    time: 0,
    color: new Color(0, 0, 0, 0),
    size: 0
})

const FRAME_COUNT = 10

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

    /**
     * @param {number} deltatimeSecond 
     */
    draw(deltatimeSecond) {
        const gl = this.#gl

        for (const particleSystem of this.particleSystems) {
            this.#initParticleSystemGl(particleSystem)
        }

        // transform feedback
        gl.enable(WebGL2RenderingContext.RASTERIZER_DISCARD)
        gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, null)
        gl.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, null)

        this.#physicsProgram.useProgram()

        this.#physicsProgram.uniformUpdate['deltatimeSecond'](deltatimeSecond)

        for (const particleSystem of this.particleSystems) {
            const particleSystemGl = this.#particleSystemGl.get(particleSystem)

            this.#gl.bindBufferBase(WebGL2RenderingContext.UNIFORM_BUFFER, this.#systemUboIndex, particleSystemGl.systemUboBuffer)

            particleSystemGl.vaoPhysics.bind()
            particleSystemGl.transformFeedback.bind()
            gl.beginTransformFeedback(WebGL2RenderingContext.POINTS)

            gl.drawArrays(WebGL2RenderingContext.POINTS, 0, particleSystem.geometry.count)

            gl.endTransformFeedback()
        }

        gl.disable(WebGL2RenderingContext.RASTERIZER_DISCARD)
        gl.bindTransformFeedback(WebGL2RenderingContext.TRANSFORM_FEEDBACK, null)


        // object
        this.#renderProgram.useProgram()

        for (const particleSystem of this.particleSystems) {
            const particleSystemGl = this.#particleSystemGl.get(particleSystem)
            const count = particleSystem.geometry.count

            copyBuffer(gl, particleSystemGl.vaoRender.buffers['position'], particleSystemGl.vaoPhysics.buffers['position'], count * 4 * 4)
            copyBuffer(gl, particleSystemGl.transformFeedback.buffers['outVelocity'], particleSystemGl.vaoPhysics.buffers['velocity'], count * 4 * 4)

            particleSystemGl.vaoRender.bind()

            this.#gl.drawArrays(WebGL2RenderingContext.POINTS, 0, particleSystem.geometry.count)
        }
    }

    /** @type {Map<ParticleSystem, ParticleSystemGl>} */
    #particleSystemGl = new Map()

    /**
     * @typedef {{
     *  vaoPhysics: GlVao
     *  vaoRender: GlVao
     *  transformFeedback: GlTransformFeedback
     *  systemUboBuffer: WebGLBuffer
     * }} ParticleSystemGl
     * @param {ParticleSystem} particleSystem 
     */
    #initParticleSystemGl(particleSystem) {
        if (!this.#particleSystemGl.has(particleSystem)) {
            const count = particleSystem.geometry.count

            const positionArray = new Float32Array(count * 4)
            const velocityArray = new Float32Array(count * 4)

            const elementCount = count * 4
            for (let i = 0; i < elementCount; i += 4) {
                positionArray[i] = (Math.random() - 0.5) * 10
                positionArray[i + 1] = (Math.random() - 0.5) * 10
                positionArray[i + 2] = (Math.random() - 0.5) * 10
                positionArray[i + 3] = 0 // size
                velocityArray[i] = Math.random() - 0.5
                velocityArray[i + 1] = Math.random() - 0.5
                velocityArray[i + 2] = Math.random() - 0.5
                velocityArray[i + 3] = 0 // time                
            }

            const vaoPhysics = this.#physicsProgram.createVao(
                {
                    position: new Attribute(positionArray),
                    velocity: new Attribute(velocityArray)
                }
            )

            const vaoRender = this.#renderProgram.createVao({
                position: new Attribute(new Float32Array(count * 4)),
                color: new Attribute(new Float32Array(count * 4))
            })

            const transformFeedback = this.#physicsProgram.createTransformFeedback(count, {
                outPosition: vaoRender.buffers['position'],
                outColor: vaoRender.buffers['color']
            })

            const systemUboArray = new Float32Array(8 * FRAME_COUNT)

            for (let i = 0; i < FRAME_COUNT; i++) {
                const offset = i * 8
                const frame = particleSystem.particleKeyframes[i] || emptyFrame

                systemUboArray[offset] = frame.time
                systemUboArray[offset + 1] = frame.size

                systemUboArray[offset + 4] = frame.color.r
                systemUboArray[offset + 5] = frame.color.g
                systemUboArray[offset + 6] = frame.color.b
                systemUboArray[offset + 7] = frame.color.a
            }

            const systemUboBuffer = this.#gl.createBuffer()
            this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, systemUboBuffer)
            this.#gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, systemUboArray, WebGL2RenderingContext.STATIC_DRAW)

            /** @type {ParticleSystemGl} */
            const particleSystemGl = {
                vaoPhysics,
                vaoRender,
                transformFeedback,
                systemUboBuffer
            }

            this.#particleSystemGl.set(particleSystem, particleSystemGl)
        }
    }
}
