import { GLSL_CAMERA } from "../../../programs/chunks/glslCamera.js"
import { GLSL_UTILS } from "../../../programs/chunks/glslUtils.js"
import { GLSL_WINDOW } from "../../../programs/chunks/glslWindow.js"
import { Particle } from "../../../sceneGraph/particle/Particle.js"
import { ParticleKeyframe } from "../../../sceneGraph/particle/ParticleKeyframe.js"
import { createSparkleCanvas } from "../../../textures/sparkle.js"
import { GlArrayBuffer } from "../../glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../../glDescriptors/GlAttribute.js"
import { GlObject } from "../../glDescriptors/GlObject.js"
import { GlProgram } from "../../glDescriptors/GlProgram.js"
import { GlTexture } from "../../glDescriptors/GlTexture.js"
import { GlVao } from "../../glDescriptors/GlVao.js"

const FLOAT_32_ELEMENT_COUNT = 7

const POSITION_OFFSET = 0
const VELOCITY_OFFSET = POSITION_OFFSET + Float32Array.BYTES_PER_ELEMENT * 3
const TIME_OFFSET = VELOCITY_OFFSET + Float32Array.BYTES_PER_ELEMENT * 3
const SIZE_OFFSET = TIME_OFFSET + Float32Array.BYTES_PER_ELEMENT

const STRIDE = FLOAT_32_ELEMENT_COUNT * Float32Array.BYTES_PER_ELEMENT

const MAX_KEYFRAMES = 8
const KEYFRAME_F32_LENGTH = 8
const KEYFRAME_PIXEL_LENGTH = KEYFRAME_F32_LENGTH / 4
const KEYFRAMES_F32_LENGTH = KEYFRAME_F32_LENGTH * MAX_KEYFRAMES
const KEYFRAMES_PIXEL_LENGTH = KEYFRAMES_F32_LENGTH / 4
const KEYFRAME_TIME_OFFSET = 0
const KEYFRAME_SIZE_OFFSET = 1
const KEYFRAME_COLOR_OFFSET = 4
const KEYFRAME_COLOR_PIXEL_OFFSET = KEYFRAME_COLOR_OFFSET / 4
const KEYFRAME_ALPHA_OFFSET = 7

const MAX_ANIMATION = 1024

export class ParticleRenderGlObject extends GlObject {
    #keyframesBuffer
    #keyframesTexture
    #keyframesHeightIndexArrayBuffer

    constructor(inPositionTimeVelocitySize, glDepthTextureData, maxParticleCount = 100_000) {
        const keyframesHeightIndexArrayBuffer = new GlArrayBuffer(new Uint32Array(MAX_ANIMATION))
        const glVaoData = new GlVao(
            [
                new GlAttribute({
                    glArrayBuffer: inPositionTimeVelocitySize,
                    name: 'position',
                    size: 3,
                    type: WebGL2RenderingContext.FLOAT,
                    stride: STRIDE,
                    offset: POSITION_OFFSET
                }),
                new GlAttribute({
                    glArrayBuffer: inPositionTimeVelocitySize,
                    name: 'time',
                    size: 1,
                    type: WebGL2RenderingContext.FLOAT,
                    stride: STRIDE,
                    offset: TIME_OFFSET
                }),
                new GlAttribute({
                    glArrayBuffer: keyframesHeightIndexArrayBuffer,
                    name: 'keyframesHeightIndex',
                    size: 1,
                    type: WebGL2RenderingContext.UNSIGNED_INT,
                })
            ]
        )

        const keyframesBuffer = new Float32Array(KEYFRAMES_F32_LENGTH * MAX_ANIMATION)
        const keyframesTexture = new GlTexture({
            name: `keyframes particle`,
            data: keyframesBuffer,

            wrapS: 'CLAMP_TO_EDGE',
            wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST',
            magFilter: 'NEAREST',

            internalformat: 'RGBA32F',
            width: KEYFRAMES_F32_LENGTH / 4, // 4 floats / pixel
            height: MAX_ANIMATION,
            border: 0,
            format: 'RGBA',
            type: 'FLOAT',

            needsMipmap: false,
        })

        super({
            glProgram: new ParticleRenderGlProgram(),
            glVao: glVaoData,
            uniforms: {
                keyframesTexture,
                bumpTexture: new GlTexture({
                    data: createSparkleCanvas()
                }),
                depthTexture: glDepthTextureData
            },
            count: maxParticleCount,
            additiveBlending: true,
            depthWrite: false,
            drawMode: 'POINTS',
        })

        this.#keyframesBuffer = keyframesBuffer
        this.#keyframesTexture = keyframesTexture
        this.#keyframesHeightIndexArrayBuffer = keyframesHeightIndexArrayBuffer
    }

    #keyframesToHeightIndex = new Map()
    #heightIndex = 0
    /**
     * 
     * @param {ParticleKeyframe[]} keyframes 
     */
    #getKeyframesId(keyframes) {
        if (this.#keyframesToHeightIndex.has(keyframes)) return this.#keyframesToHeightIndex.get(keyframes)
        if (keyframes.length > MAX_KEYFRAMES) throw new Error(`Particle keyframes length should be less than ${MAX_KEYFRAMES}`)

        const heightIndex = this.#heightIndex
        this.#keyframesToHeightIndex.set(keyframes, heightIndex)
        this.#heightIndex++

        const widthOffset = heightIndex * KEYFRAMES_F32_LENGTH
        for (let i = 0; i < keyframes.length; i++) {
            const keyframe = keyframes[i]
            const offset = i * KEYFRAME_F32_LENGTH + widthOffset
            this.#keyframesBuffer[offset + KEYFRAME_TIME_OFFSET] = keyframe.time
            this.#keyframesBuffer[offset + KEYFRAME_SIZE_OFFSET] = keyframe.size
            keyframe.color.toArray(this.#keyframesBuffer, offset + KEYFRAME_COLOR_OFFSET)
            this.#keyframesBuffer[offset + KEYFRAME_ALPHA_OFFSET] = keyframe.color.a
        }

        this.#keyframesTexture.dataVersion++

        return heightIndex
    }

    rangeToUpdate = [Infinity, -Infinity]

    /**
     * @param {Particle} particle 
     * @param {number} offset
     */
    addParticle(particle, offset) {
        const keyframesId = this.#getKeyframesId(particle.keyframes)
        this.#keyframesHeightIndexArrayBuffer.arrayBuffer[offset + 0] = keyframesId
        this.rangeToUpdate[0] = Math.min(this.rangeToUpdate[0], offset)
        this.rangeToUpdate[1] = Math.max(this.rangeToUpdate[1], offset + FLOAT_32_ELEMENT_COUNT)
    }
}

class ParticleRenderGlProgram extends GlProgram {
    constructor() {
        super(() => `#version 300 es
in vec3 position;
in float time;
in uint keyframesHeightIndex;

${GLSL_CAMERA.declaration}

uniform sampler2D keyframesTexture;

float getAlpha(float start, float end, float current){
    return (current - start) / (end - start);
}

out vec4 v_color;

void main() {
    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * vec4(position, 1.);
    
    int widthIndex = 0;
    vec4 previousKeyframe;
    vec4 keyframe = texelFetch(keyframesTexture, ivec2(widthIndex, keyframesHeightIndex), 0);

    while(keyframe[0] < time && widthIndex < ${KEYFRAMES_PIXEL_LENGTH}) {
        widthIndex += ${KEYFRAME_PIXEL_LENGTH};
        previousKeyframe = keyframe;
        keyframe = texelFetch(keyframesTexture, ivec2(widthIndex, keyframesHeightIndex), 0);
    }

    if(widthIndex >= ${KEYFRAMES_PIXEL_LENGTH}) {
        v_color.w = 0.;
        gl_PointSize = 0.;
    } else if( widthIndex == 0 ) {
        v_color = texelFetch(keyframesTexture, ivec2(1, keyframesHeightIndex), 0);
        gl_PointSize = keyframe[1];
    } else {
        float alpha = getAlpha(previousKeyframe[0], keyframe[0], time);
        vec4 previousKeyframeColor = texelFetch(keyframesTexture, ivec2(widthIndex - ${KEYFRAME_PIXEL_LENGTH} + ${KEYFRAME_COLOR_PIXEL_OFFSET}, keyframesHeightIndex), 0);
        vec4 keyframeColor = texelFetch(keyframesTexture, ivec2(widthIndex + ${KEYFRAME_COLOR_PIXEL_OFFSET}, keyframesHeightIndex), 0);
        v_color = mix(previousKeyframeColor, keyframeColor, alpha);
        gl_PointSize = mix(previousKeyframe[1], keyframe[1], alpha);
    }

    gl_PointSize = gl_PointSize * 100. / gl_Position.z;

    // gl_PointSize=10.;
    // v_color = vec4(1., 0., 0., 1.);
}
`,
            () => `#version 300 es
precision highp float;
precision highp sampler2D;

in vec4 v_color;

uniform sampler2D bumpTexture;
uniform sampler2D depthTexture;

${GLSL_CAMERA.declaration}
${GLSL_WINDOW.declaration}
${GLSL_UTILS.linearizeDepth.declaration(GLSL_CAMERA.near, GLSL_CAMERA.far)}

out vec4 color;

float depthBetter(float depth){
    float ndc = depth * 2.0 - 1.0; 
    return (2.0 * ${GLSL_CAMERA.near} * ${GLSL_CAMERA.far}) / (${GLSL_CAMERA.far} + ${GLSL_CAMERA.near} - ndc * (${GLSL_CAMERA.far} - ${GLSL_CAMERA.near}));
}

void main(){
    color = texture(bumpTexture, gl_PointCoord.xy) * v_color;

    vec2 uv = gl_FragCoord.xy / ${GLSL_WINDOW.resolution};
    float depth = float(texture(depthTexture, uv).x);
    
    float l = abs(${GLSL_UTILS.linearizeDepth.call('depth')} - ${GLSL_UTILS.linearizeDepth.call('gl_FragCoord.z')});
    color.a *= clamp(l * 5., 0., 1.);
    
    // color = v_color;
    // color = vec4(${GLSL_CAMERA.far}/10000.,0.,0.,1.);
}
`)
    }
}
