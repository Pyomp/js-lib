import { Attribute } from "../../../webgl/GlAttribute.js"
import { ParticleKeyframes } from "../../../sceneGraph/particle/ParticleKeyframes.js"
import { ParticleSystem } from "../../../sceneGraph/particle/ParticleSystem.js"
import { GlProgram } from "../../../webgl/glContext/GlProgram.js"
import { GlTexture } from "../../../webgl/glContext/GlTexture.js"
import { GlTransformFeedback } from "../../../webgl/glContext/GlTransformFeedback.js"
import { GlUbo } from "../../../webgl/glContext/GlUbo.js"
import { GlVao } from "../../../webgl/glContext/GlVao.js"
import { copyBuffer } from "../../../webgl/glContext/utils.js"
import { ParticlePhysicsGlProgram } from "./ParticlePhysicsGlProgram.js"
import { ParticleRenderGlProgram } from "./ParticleRenderGlProgram.js"

export const FRAME_COUNT = 10

export class ParticleRenderer {
    /** @type {Set<ParticleSystem>} */ particleSystems = new Set()

    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {GlUbo} */ #keyframesUbo
    /** @type {boolean} */ #keyframesUboNeedsUpdate = false

    /** @type {GlProgram} */ #physicsProgram
    /** @type {Attribute} */ #velocityPhysicsAttribute
    /** @type {Attribute} */ #positionPhysicsAttribute
    /** @type {GlVao} */ #vaoPhysics


    /** @type {GlProgram} */ #renderProgram
    /** @type {GlVao} */ #vaoRender
    /** @type {GlTransformFeedback} */ #transformFeedback

    /** @type {GlTexture} */ #depthTexture
    /** @type {Renderer} */ #renderer


    #timeEnd
    #cursor = 0
    setParticle(
        /** @type {Vector3} */ position,
        /** @type {Vector3} */ velocity,
        /** @type {ParticleKeyframes} */ particleKeyframes
    ) {
        const now = performance.now()

        while (this.#timeEnd[this.#cursor] > now) this.#cursor = (this.#cursor + 1) % this.#maxParticleCount
        this.#timeEnd[this.#cursor] = now + particleKeyframes.timeEnd

        velocity.toArray(this.#velocityPhysicsAttribute.typedArray, this.#cursor * 4)
        velocity[this.#cursor * 4 + 3] = 0 // time
        position.toArray(this.#positionPhysicsAttribute.typedArray, this.#cursor * 4)

        this.#velocityPhysicsAttribute.addRangeToUpdate(this.#cursor, this.#cursor + 1)
        this.#positionPhysicsAttribute.addRangeToUpdate(this.#cursor, this.#cursor + 1)

        this.#keyframesUboNeedsUpdate = true
    }

    #maxParticleCount = 1

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {{[uboName: string]: number}} uboIndex 
     * @param {GlTexture} glDepthTexture 
     * @param {Renderer} renderer
     * @param {number} maxParticleCount
     */
    initGl(gl, uboIndex, glDepthTexture, renderer, maxParticleCount) {
        this.#maxParticleCount = maxParticleCount
        this.#renderer = renderer
        this.#gl = gl

        this.#keyframesUbo = new GlUbo(gl, 1)

        this.#physicsProgram = new ParticlePhysicsGlProgram(gl, { ...uboIndex, systemUBO: this.#keyframesUbo.index }, FRAME_COUNT)
        this.#renderProgram = new ParticleRenderGlProgram(gl, uboIndex)

        this.#timeEnd = new Float32Array(maxParticleCount)

        this.#velocityPhysicsAttribute = new Attribute({ typedArray: new Float32Array(maxParticleCount * 4) }) // .w is time
        this.#positionPhysicsAttribute = new Attribute({ typedArray: new Float32Array(maxParticleCount * 4) }) // .w is size

        this.#vaoPhysics = this.#physicsProgram.createVao(
            {
                velocity: this.#velocityPhysicsAttribute,
                position: this.#positionPhysicsAttribute
            }
        )

        this.#vaoRender = this.#renderProgram.createVao({
            position: new Attribute(new Float32Array(maxParticleCount * 4)),
            color: new Attribute(new Float32Array(maxParticleCount * 4))
        })


        this.#transformFeedback = this.#physicsProgram.createTransformFeedback(maxParticleCount, {
            outPosition: this.#vaoRender.buffers['position'],
            outColor: this.#vaoRender.buffers['color']
        })


        this.depthFrameBuffer = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer)

        this.#depthTexture = glDepthTexture

        gl.bindTexture(gl.TEXTURE_2D, this.#depthTexture.#glTexture)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.#depthTexture.#glTexture, 0)
    }

    disposeGl() {
        this.#keyframesUbo.dispose()
        this.#physicsProgram.dispose()
        this.#renderProgram.dispose()

        this.#vaoPhysics.dispose()
        this.#vaoRender.dispose()
        this.#transformFeedback.dispose()
    }

    onContextLost() {
    }


    /**
     * @param {number} deltatimeSecond 
     */
    draw(deltatimeSecond) {
        const gl = this.#gl

        // transform feedback
        gl.enable(WebGL2RenderingContext.RASTERIZER_DISCARD)
        gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, null)
        gl.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, null)

        this.#physicsProgram.useProgram()

        this.#physicsProgram.uniformUpdate['deltatimeSecond'](deltatimeSecond)

        if (this.#keyframesUboNeedsUpdate) {
            this.#keyframesUboNeedsUpdate = false
            this.#keyframesUbo.update()
        }

        this.#vaoPhysics.bind()
        this.#transformFeedback.bind()
        gl.beginTransformFeedback(WebGL2RenderingContext.POINTS)

        gl.drawArrays(WebGL2RenderingContext.POINTS, 0, this.#maxParticleCount)

        gl.endTransformFeedback()


        gl.disable(WebGL2RenderingContext.RASTERIZER_DISCARD)
        gl.bindTransformFeedback(WebGL2RenderingContext.TRANSFORM_FEEDBACK, null)

        // object
        this.#renderProgram.useProgram()
        this.#depthTexture.bindToUnit(this.#renderProgram.textureUnit['depthMap'])

        copyBuffer(gl, this.#vaoRender.buffers['position'], this.#vaoPhysics.buffers['position'], this.#maxParticleCount * 4 * 4)
        copyBuffer(gl, this.#transformFeedback.buffers['outVelocity'], this.#vaoPhysics.buffers['velocity'], this.#maxParticleCount * 4 * 4)

        this.#vaoRender.bind()
        // this.#renderer.getGlTexture(particleSystem.map).bindToUnit(this.#renderProgram.textureUnit['map'])
        gl.drawArrays(WebGL2RenderingContext.POINTS, 0, this.#maxParticleCount)
    }
}
