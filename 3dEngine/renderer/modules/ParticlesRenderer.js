import { Attribute } from "../../sceneGraph/Attribute.js"
import { GlProgram } from "../../webgl/GlProgram.js"
import { ParticlesObject } from './ParticlesRendererModules/ParticlesObject.js'

export class ParticlesRenderer {
    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {GlProgram} */ #gpgpuProgram

    #count

    #transformFeedback

    constructor(particleCount = 1000) {
        this.inPositionSizeArray = new Float32Array(particleCount * 4)
        this.inVelocityArray = new Float32Array(particleCount * 4)
        this.inTypeArray = new Uint8Array(particleCount)

        this.#count = particleCount
    }

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     */
    initGl(gl, uboIndex) {
        this.#gl = gl

        this.object = new ParticlesObject(gl, uboIndex, this.#count)

        const outVaryings = ['outVelocity', 'outPosition', 'outColor']

        this.#gpgpuProgram = new GlProgram(
            gl,
            `#version 300 es
            in vec4 velocity;
            in vec4 position;
            in uint type;

            uniform float deltatimeSecond;

            out vec4 outVelocity; // .w is time
            out vec4 outPosition; // .w is size
            out vec4 outColor;  

            void main() {
                outVelocity.w = velocity.w + deltatimeSecond;
                float t = outVelocity.w;
                
                outVelocity.xyz = velocity.xyz;

                outPosition.xyz = position.xyz + outVelocity.xyz * deltatimeSecond;

                outPosition.w = ( - pow ( t * 0.5 - 1., 2. ) + 1.) * 10.;
        
                outColor = vec4(1.,0.,0.,1.);
                // outColor = vec4(max(1. - t, 0.) , 0., 0., max(1. - t, 0.));
            }
            `,
            `#version 300 es
            void main() {
                discard;
            }
            `,
            { outVaryings }
        )

        this.#gl = gl

        this.gpgpuVao = gl.createVertexArray()
        gl.bindVertexArray(this.gpgpuVao)

        this.vaoTransformFeedback = this.#gpgpuProgram.createVao({
            velocity: new Attribute(this.inVelocityArray, 'DYNAMIC_COPY'),
            position: new Attribute(this.inPositionSizeArray, 'DYNAMIC_COPY'),
            type: new Attribute(this.inTypeArray, 'DYNAMIC_COPY')
        })

        this.outVelocityGlBuffer = this.#createBuffer(this.inVelocityArray)
        this.outPositionGlBuffer = this.object.vao.buffers['position']

        this.#transformFeedback = gl.createTransformFeedback()
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.#transformFeedback)

        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, outVaryings.indexOf('outVelocity'), this.outVelocityGlBuffer)
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, outVaryings.indexOf('outPosition'), this.outPositionGlBuffer)

        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, outVaryings.indexOf('outColor'), this.object.vao.buffers['color'])

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)
    }

    #createBuffer(data, usage = WebGL2RenderingContext.DYNAMIC_COPY) {
        const buffer = this.#gl.createBuffer()
        this.#gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, buffer)
        this.#gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, data, usage)
        return buffer
    }

    disposeGl() {
        this.vaoTransformFeedback.dispose()
        this.#gpgpuProgram.dispose()
        this.#gl.deleteTransformFeedback(this.#transformFeedback)

        this.#gl.deleteBuffer(this.outVelocityGlBuffer)

        this.object.program.dispose()
        this.object.vao.dispose()
    }

    setParticle(offset, positionX, positionY, positionZ, type) {
        const offset4 = offset * 4

        this.inVelocityArray[offset4 + 0] = (Math.random() - 0.5) * 3
        this.inVelocityArray[offset4 + 1] = (Math.random() - 0.5) * 3
        this.inVelocityArray[offset4 + 2] = (Math.random() - 0.5) * 3
        this.inVelocityArray[offset4 + 3] = 0 // time

        this.inPositionSizeArray[offset4 + 0] = positionX
        this.inPositionSizeArray[offset4 + 1] = positionY
        this.inPositionSizeArray[offset4 + 2] = positionZ
        this.inPositionSizeArray[offset4 + 3] = 0 // size

        this.inTypeArray[offset + 0] = type

        this.#isNewParticle = true
    }

    #isNewParticle = true

    /**
     * @param {number} deltatimeSecond 
     */
    update(deltatimeSecond) {
        const gl = this.#gl

        // no need to call the fragment shader
        gl.enable(WebGL2RenderingContext.RASTERIZER_DISCARD)

        // unbind the buffers so we don't get errors.
        gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, null)

        this.#gpgpuProgram.useProgram()

        this.vaoTransformFeedback.bind()

        if (this.#isNewParticle) {
            this.#isNewParticle = false

            this.vaoTransformFeedback.attributeUpdate['position'](this.inPositionSizeArray)
            this.vaoTransformFeedback.attributeUpdate['velocity'](this.inPositionSizeArray)
            // this.vaoTransformFeedback.attributeUpdate['type'](this.inTypeArray)
        }

        this.#gpgpuProgram.uniformUpdate['deltatimeSecond'](deltatimeSecond)

        // generate numPoints of positions and colors
        // into the buffers
        gl.bindTransformFeedback(WebGL2RenderingContext.TRANSFORM_FEEDBACK, this.#transformFeedback)

        gl.beginTransformFeedback(WebGL2RenderingContext.POINTS)
        gl.drawArrays(WebGL2RenderingContext.POINTS, 0, this.#count)
        gl.endTransformFeedback()

        gl.bindTransformFeedback(WebGL2RenderingContext.TRANSFORM_FEEDBACK, null)

        // turn on using fragment shaders again
        gl.disable(WebGL2RenderingContext.RASTERIZER_DISCARD)

        gl.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, this.object.vao.buffers['position'])
        gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.vaoTransformFeedback.buffers['position'])
        gl.copyBufferSubData(WebGL2RenderingContext.COPY_READ_BUFFER, WebGL2RenderingContext.ARRAY_BUFFER, 0, 0, this.#count * 4 * 4)
        gl.getBufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, 0, this.inPositionSizeArray)

        gl.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, this.outVelocityGlBuffer)
        gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.vaoTransformFeedback.buffers['velocity'])
        gl.copyBufferSubData(WebGL2RenderingContext.COPY_READ_BUFFER, WebGL2RenderingContext.ARRAY_BUFFER, 0, 0, this.#count * 4 * 4)
        gl.getBufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, 0, this.inVelocityArray)

        gl.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, null)
    }

    draw() {
        this.object.program.useProgram()

        this.object.vao.bind()

        this.#gl.drawArrays(WebGL2RenderingContext.POINTS, 0, this.#count)
    }
}
