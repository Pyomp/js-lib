import { Line3 } from "../../../math/Line3.js"
import { Vector3 } from "../../../math/Vector3.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { Particle } from "./Particle.js"
import { ParticleKeyframe } from "./ParticleKeyframe.js"

const _vector3null = new Vector3()
const _vector3 = new Vector3()

export class ParticleEmitter {
    #direction
    #stepTime
    #timeRest

    #line
    /** @type {Particle[]} */ #particleBuffer
    /** @type {ParticleKeyframe[]} */ #keyframes
    /** @type {GlTexture} */ #texture

    constructor(
        /** @type {Vector3} */ initialPosition,
        /** @type {ParticleKeyframe[]} */ keyframes,
        /** @type {GlTexture} */ texture,
        stepTime = 0.01
    ) {
        this.#particleBuffer = []
        this.#line = new Line3()
        this.#timeRest = 0
        this.#stepTime = stepTime
        this.#direction = new Vector3()
        this.#line.start.copy(initialPosition)
        this.#line.end.copy(initialPosition)
        this.#keyframes = keyframes
        this.#texture = texture
    }

    #getParticle(
        /** @type {number} */ index
    ) {
        if (index >= this.#particleBuffer.length) {
            this.#particleBuffer.push(new Particle({
                keyframes: this.#keyframes,
                texture: this.#texture
            }))
        }
        return this.#particleBuffer[index]
    }

    getParticles(
        /** @type {Vector3} */ newPosition,
        /** @type {number} */ deltaTime,
        /** @type {Vector3} */ velocity = _vector3null
    ) {
        this.#line.start.copy(this.#line.end)
        this.#line.end.copy(newPosition)

        this.#direction.subVectors(this.#line.end, this.#line.start)

        const ttTime = this.#timeRest + deltaTime

        this.#direction.divideScalar(ttTime / this.#stepTime)


        const particle = this.#getParticle(0)

        _vector3.copy(this.#direction).multiplyScalar(this.#timeRest / this.#stepTime).add(this.#line.start)
        particle.velocity.copy(velocity)
        particle.time = deltaTime - this.#timeRest
        particle.position
            .copy(velocity)
            .multiplyScalar(particle.time)
            .add(_vector3)

        this.#timeRest = deltaTime

        let particleIndex = 1

        while (this.#timeRest >= this.#stepTime) {
            this.#timeRest -= this.#stepTime

            _vector3.add(this.#direction)

            const particle = this.#getParticle(particleIndex)

            particle.velocity.copy(velocity)
            particle.time = this.#timeRest
            particle.position
                .copy(velocity)
                .multiplyScalar(particle.time)
                .add(_vector3)

            particleIndex++
        }
    }
}
