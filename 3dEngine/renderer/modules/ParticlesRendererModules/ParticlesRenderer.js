import { Attribute } from "../../../sceneGraph/Attribute.js"
import { GlProgram } from "../../../webgl/GlProgram.js"
import { GlTexture } from "../../../webgl/GlTexture.js"
import { ParticlesObject } from './ParticlesObject.js'

const PATTERN_TEXTURE_SIZE = 512
const PATTERN_MAX_FRAME = 16
const PATTERN_SIZE = PATTERN_TEXTURE_SIZE / PATTERN_MAX_FRAME // 32 

export class ParticlesRenderer {
    /** @type {WebGL2RenderingContext} */ #gl

    /** @type {GlProgram} */ #gpgpuProgram

    #count

    #transformFeedback

    #patternArray
    /** @type {GlTexture} */  #patternTexture
    #patternTextureNeedsUpdate = true

    constructor(particleCount = 1000) {
        this.inPositionSizeArray = new Float32Array(particleCount * 4)
        this.inVelocityArray = new Float32Array(particleCount * 4)
        this.inTypeArray = new Uint8Array(particleCount)
        this.#patternArray = new Float32Array(PATTERN_TEXTURE_SIZE * PATTERN_TEXTURE_SIZE * 4)

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
            in int type;
        
            uniform float deltatimeSecond;
            uniform sampler2D frames;

            out vec4 outVelocity; // .w is time
            out vec4 outPosition; // .w is size
            out vec4 outColor;  

            ivec2 frameCoordinates;

            int getFrameIndex(int type, float currentTime){
                int index = 0;

                frameCoordinates.x = 0;
                frameCoordinates.y = type;
                float frameTime = texelFetch(frames, frameCoordinates, 0).x;

                while (frameTime < currentTime && index < ${PATTERN_MAX_FRAME} ) {
                    index++;
                    frameCoordinates.x += ${PATTERN_SIZE};
                    frameTime = texelFetch(frames, frameCoordinates, 0).x;
                }

                return index;
            }

            float getAlpha(float start, float end, float current){
                return (current - start) / (end - start);
            }

            
            struct Frame {
                float time;
                vec4 color;
                float size;
            };

            Frame getFrame(int frameIndex){
                frameCoordinates.x = frameIndex * ${PATTERN_SIZE};
                frameCoordinates.y = type;
                vec4 data0 = texelFetch(frames, frameCoordinates, 0);
                vec4 data1 = texelFetch(frames, frameCoordinates + 1, 0);
                vec4 data2 = texelFetch(frames, frameCoordinates + 2, 0);
                return Frame(data0.x, data1, data2.x);
            }

            void main() {
                outVelocity.w = velocity.w + deltatimeSecond;
                float t = outVelocity.w;
                t = 1.;
                int frameIndex  = getFrameIndex(type, t);

                if(frameIndex >= ${PATTERN_MAX_FRAME}) {
                    outColor.w = 0.;
                    outColor = vec4(0., 0., 1., 1.);
                } else if( frameIndex == 0 ) {
                    Frame frame = getFrame(0);
                    outColor = frame.color;
                    outPosition.w = frame.size;
                    outColor = vec4(0., 1., 0., 1.);
                } else {
                    Frame previousFrame = getFrame(frameIndex - 1);
                    Frame frame = getFrame(frameIndex);
                    float alpha = getAlpha(previousFrame.time, frame.time, t);
                    outColor = mix(previousFrame.color, frame.color, alpha);
                    outPosition.w = mix(previousFrame.size, frame.size, alpha);
                    outColor = vec4(1., 0., 0., 1.);
                }
                outVelocity.xyz = velocity.xyz;
                // outPosition.w = 10.;
                outPosition.xyz = position.xyz + outVelocity.xyz * deltatimeSecond;
                outPosition.xyz = position.xyz;
                // outPosition.w = ( - pow ( t * 0.5 - 1., 2. ) + 1.) * 10.;
        
                // outColor = vec4(1., 0., 0., 1.);
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

        this.#patternTexture = new GlTexture({
            gl,
            data: this.#patternArray,

            wrapS: 'CLAMP_TO_EDGE',
            wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST',
            magFilter: 'NEAREST',

            target: 'TEXTURE_2D',
            level: 0,
            internalformat: 'RGBA32F',
            width: PATTERN_TEXTURE_SIZE,
            height: PATTERN_TEXTURE_SIZE,
            border: 0,
            format: 'RGBA',
            type: 'FLOAT',

            needsMipmap: false,
        })

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

    /**
     * 
     * @param {number} offset 
     * @param {{
     *  position: Vector3
     *  velocity: Vector3
     *  type: number
     * }} options
     */
    setParticle(offset, { position, velocity, type }) {
        const offset4 = offset * 4

        this.inVelocityArray[offset4 + 0] = velocity.x
        this.inVelocityArray[offset4 + 1] = velocity.y
        this.inVelocityArray[offset4 + 2] = velocity.z
        this.inVelocityArray[offset4 + 3] = 0 // time

        this.inPositionSizeArray[offset4 + 0] = position.x
        this.inPositionSizeArray[offset4 + 1] = position.y
        this.inPositionSizeArray[offset4 + 2] = position.z
        this.inPositionSizeArray[offset4 + 3] = 0 // size

        this.inTypeArray[offset + 0] = (type ?? 0) * PATTERN_TEXTURE_SIZE

        this.#isNewParticle = true
    }



    setPattern(
        patternId,
        frame
    ) {
        this.#patternArray.set(frame, patternId * PATTERN_TEXTURE_SIZE * 3)
        this.#patternTextureNeedsUpdate = true
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
        if (this.#patternTextureNeedsUpdate) {
            this.#patternTexture.updateData(this.#patternArray, WebGL2RenderingContext.TEXTURE0)
        } else {
            this.#patternTexture.bindToUnit(WebGL2RenderingContext.TEXTURE0)
        }

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