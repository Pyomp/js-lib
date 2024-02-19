import { Particle } from "../../../sceneGraph/particle/Particle.js"
import { GlArrayBuffer } from "../../glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../../glDescriptors/GlAttribute.js"
import { GlObject } from "../../glDescriptors/GlObject.js"
import { GlProgram } from "../../glDescriptors/GlProgram.js"
import { GlTransformFeedback } from "../../glDescriptors/GlTransformFeedback.js"
import { GlVao } from "../../glDescriptors/GlVao.js"

const FLOAT_32_ELEMENT_COUNT = 7

const POSITION_OFFSET = 0
const VELOCITY_OFFSET = POSITION_OFFSET + Float32Array.BYTES_PER_ELEMENT * 3
const TIME_OFFSET = VELOCITY_OFFSET + Float32Array.BYTES_PER_ELEMENT * 3
const SIZE_OFFSET = TIME_OFFSET + Float32Array.BYTES_PER_ELEMENT

const STRIDE = FLOAT_32_ELEMENT_COUNT * Float32Array.BYTES_PER_ELEMENT

export class ParticlePhysicsGlObject extends GlObject {
    #inPositionVelocityTime
    #vaoF32a
    constructor(maxParticleCount = 100_000) {
        const inPositionVelocityTime = new GlArrayBuffer(new Float32Array(maxParticleCount * FLOAT_32_ELEMENT_COUNT).fill(1000), 'DYNAMIC_DRAW')
        const glVaoData = new GlVao(
            [
                new GlAttribute({
                    glArrayBuffer: inPositionVelocityTime,
                    name: 'position',
                    size: 3,
                    type: WebGL2RenderingContext.FLOAT,
                    stride: STRIDE,
                    offset: POSITION_OFFSET
                }),
                new GlAttribute({
                    glArrayBuffer: inPositionVelocityTime,
                    name: 'velocity',
                    size: 3,
                    type: WebGL2RenderingContext.FLOAT,
                    stride: STRIDE,
                    offset: VELOCITY_OFFSET
                }),
                new GlAttribute({
                    glArrayBuffer: inPositionVelocityTime,
                    name: 'time',
                    size: 1,
                    type: WebGL2RenderingContext.FLOAT,
                    stride: STRIDE,
                    offset: TIME_OFFSET
                })
            ]
        )

        const glProgramData = new ParticlePhysicsGlProgram(maxParticleCount)

        super({
            glProgram: glProgramData,
            glVao: glVaoData,
            uniforms: {
                deltaTime: 0
            },
            count: maxParticleCount
        })
        this.outArrayBufferData = glProgramData.outArrayBufferData
        this.#inPositionVelocityTime = inPositionVelocityTime
        this.#vaoF32a = this.#inPositionVelocityTime.arrayBuffer
    }

    rangeToUpdate = [0, 0]

    /**
     * 
     * @param {Particle} particle 
     * @param {number} offset
     */
    addParticle(particle, offset) {
        const bufferOffset = FLOAT_32_ELEMENT_COUNT * offset
        particle.position.toArray(this.#vaoF32a, bufferOffset)
        particle.velocity.toArray(this.#vaoF32a, bufferOffset + 3)
        this.#vaoF32a[bufferOffset + 6] = 0
        this.rangeToUpdate[0] = Math.min(this.rangeToUpdate[0], bufferOffset)
        this.rangeToUpdate[1] = Math.max(this.rangeToUpdate[1], bufferOffset + FLOAT_32_ELEMENT_COUNT) - this.rangeToUpdate[0]
    }
}

class ParticlePhysicsGlProgram extends GlProgram {
    constructor(maxParticleCount) {
        const arrayBufferData = new GlArrayBuffer(new Float32Array(maxParticleCount * FLOAT_32_ELEMENT_COUNT), 'DYNAMIC_COPY')

        super(() => `#version 300 es
in vec3 velocity;
in vec3 position;
in float time;

uniform float deltaTime;

out vec3 outVelocity;
out vec3 outPosition;
out float outTime;

void main() {
    outTime = time + deltaTime;
    outVelocity = velocity;    
    outPosition = position + outVelocity * deltaTime;
}
`,
            () => `#version 300 es
void main() {
    discard;
}
`,
            new GlTransformFeedback(arrayBufferData, ['outPosition', 'outVelocity', 'outTime'])
        )

        this.outArrayBufferData = arrayBufferData
    }
}
