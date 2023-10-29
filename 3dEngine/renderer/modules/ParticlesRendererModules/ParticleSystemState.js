import { Color } from "../../../../math/Color.js"
import { Attribute } from "../../../sceneGraph/Attribute.js"
import { ParticleKeyframe } from "../../../sceneGraph/particle/ParticleKeyframe.js"
import { ParticleSystem } from "../../../sceneGraph/particle/ParticleSystem.js"
import { FRAME_COUNT } from "./ParticleRenderer.js"

const emptyFrame = new ParticleKeyframe({
    time: 0,
    color: new Color(0, 0, 0, 0),
    size: 0
})

export class ParticleSystemState {
    count = 0

    emitterTime = 0

    stopRequest = false

    #gl

    /**
     * 
     * @param {ParticleSystem} particleSystem 
     */
    constructor(particleSystem, gl, physicsProgram, renderProgram) {
        this.#gl = gl
        const count = particleSystem.geometry.count

        const positionArray = new Float32Array(count * 4)
        const velocityArray = new Float32Array(count * 4)

        for (let i = 0; i < count; i++) {
            const offset4 = i * 4

            positionArray[offset4 + 3] = 0 // size
            velocityArray[offset4 + 3] = particleSystem.particleLifeTime // time
        }

        this.vaoPhysics = physicsProgram.createVao(
            {
                initVelocity: new Attribute(particleSystem.geometry.velocity),
                initPosition: new Attribute(particleSystem.geometry.position),
                velocity: new Attribute(velocityArray),
                position: new Attribute(positionArray)
            }
        )

        this.vaoRender = renderProgram.createVao({
            position: new Attribute(new Float32Array(count * 4)),
            color: new Attribute(new Float32Array(count * 4))
        })

        this.transformFeedback = physicsProgram.createTransformFeedback(count, {
            outPosition: this.vaoRender.buffers['position'],
            outColor: this.vaoRender.buffers['color']
        })

        const systemUboArray = new Float32Array(8 * FRAME_COUNT + 4)

        systemUboArray[0] = particleSystem.particleLifeTime

        for (let i = 0; i < FRAME_COUNT; i++) {
            const offset = i * 8 + 4
            const frame = particleSystem.particleKeyframes[i] || emptyFrame

            systemUboArray[offset] = frame.time
            systemUboArray[offset + 1] = frame.size

            systemUboArray[offset + 4] = frame.color.r
            systemUboArray[offset + 5] = frame.color.g
            systemUboArray[offset + 6] = frame.color.b
            systemUboArray[offset + 7] = frame.color.a
        }

        this.systemUboBuffer = gl.createBuffer()
        gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.systemUboBuffer)
        gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, systemUboArray, WebGL2RenderingContext.STATIC_DRAW)
    }

    dispose() {
        this.vaoPhysics.dispose()
        this.vaoRender.dispose()
        this.transformFeedback.dispose()
        this.#gl.deleteBuffer(this.systemUboBuffer)
    }
}
