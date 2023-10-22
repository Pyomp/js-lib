import { Attribute } from "../../sceneGraph/Attribute.js"
import { GlProgram } from "../../webgl/GlProgram.js"
import { GlVao } from "../../webgl/GlVao.js"


class ParticlesObject {
    constructor(gl, uboIndex, particleCount) {
        this.program = new GlProgram(
            gl,
            `#version 300 es

            in vec3 position;
            
            uniform cameraUbo {
                mat4 projectionViewMatrix;
                vec3 cameraPosition;
            };

            void main(){
                gl_Position = projectionViewMatrix * vec4(position, 1.);
                gl_PointSize = 50.;
            }
            `,
            `#version 300 es
            precision highp float;

            out vec4 color;

            void main(){
                color = vec4(0., 1., 0., 1.);
            }
            `,
            { uboIndex }
        )

        this.vao = new GlVao(
            gl,
            this.program.program,
            {
                position: new Attribute(new Float32Array(particleCount * 3))
            }
        )
    }
}

export class ParticlesRenderer {
    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {GlProgram} */ #gpgpuProgram

    #count

    #transformFeedback

    constructor() {
        this.inPositionArray = new Float32Array([1, 2, 3])
        this.#count = this.inPositionArray.length / 3
    }

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     */
    initGl(gl, uboIndex) {
        this.#gl = gl

        this.object = new ParticlesObject(gl, uboIndex, this.#count)

        const outVaryings = ['outPosition']

        this.#gpgpuProgram = new GlProgram(
            gl,
            `#version 300 es
            in vec3 position;

            out vec3 outPosition;

            void main() {
                outPosition = position - 0.001;
            }
            `,
            `#version 300 es
            void main() {
                discard;
            }
            `,
            { outVaryings }
        )

        console.log(this.inPositionArray)
        this.vaoTransformFeedback = this.#gpgpuProgram.createVao({ position: new Attribute(this.inPositionArray, 'DYNAMIC_COPY') })

        const outPositionBuffer = this.object.vao.buffers['position']

        this.#transformFeedback = gl.createTransformFeedback()
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.#transformFeedback)
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, outVaryings.indexOf('outPosition'), outPositionBuffer)
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)
    }

    disposeGl() {
        this.vaoTransformFeedback.dispose()
        this.#gpgpuProgram.dispose()
        this.#gl.deleteTransformFeedback(this.#transformFeedback)

        this.object.program.dispose()
        this.object.vao.dispose()
    }

    setParticle(x, y, z) {
        this.inPositionArray[0] = x
        this.inPositionArray[1] = y
        this.inPositionArray[2] = z
        this.vaoTransformFeedback.attributeUpdate['position'](this.inPositionArray)
    }

    update() {
        const gl = this.#gl

        // no need to call the fragment shader
        gl.enable(WebGL2RenderingContext.RASTERIZER_DISCARD)

        // unbind the buffers so we don't get errors.
        gl.bindBuffer(WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, null)
        gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, null)

        this.#gpgpuProgram.useProgram()
        this.vaoTransformFeedback.bind()

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
        gl.copyBufferSubData(WebGL2RenderingContext.COPY_READ_BUFFER, WebGL2RenderingContext.ARRAY_BUFFER, 0, 0, this.#count * 4 * 3)
        gl.getBufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, 0, this.inPositionArray)
        gl.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, null)
    }

    draw() {
        this.object.program.useProgram()

        this.object.vao.bind()

        this.#gl.drawArrays(WebGL2RenderingContext.POINTS, 0, this.#count)
    }
}
