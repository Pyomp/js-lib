import { Box3 } from "../../../math/Box3.js"
import { Vector3 } from "../../../math/Vector3.js"
import { loopRaf } from "../../../utils/loopRaf.js"
import { GLSL_CAMERA } from "../../programs/chunks/glslCamera.js"
import { GLSL_DEFERRED } from "../../programs/chunks/glslDeferred.js"
import { GLSL_POINT } from "../../programs/chunks/glslPoint.js"
import { GLSL_UTILS } from "../../programs/chunks/glslUtils.js"
import { GLSL_WINDOW } from "../../programs/chunks/glslWindow.js"
import { createSparkleCanvas } from "../../textures/sparkle.js"
import { GlArrayBuffer } from "../../webgl/glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../../webgl/glDescriptors/GlAttribute.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlProgram } from "../../webgl/glDescriptors/GlProgram.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"
import { GlRenderer } from "../../webgl/glRenderer/GlRenderer.js"
import { ParticleKeyframe } from "../particle/ParticleKeyframe.js"

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

const PHYSICS_DT = 0.1

const glProgram = new GlProgram(() => /* glsl */`#version 300 es
#define PHYSICS_DT ${PHYSICS_DT}
#define ATTENUATION 100.0

in vec3 position;
in vec3 velocity;
in float time;

${GLSL_CAMERA.declaration}
${GLSL_WINDOW.declaration}
${GLSL_POINT.vertexDeclaration}

uniform sampler2D keyframesTexture;
uniform float dt;

float getAlpha(float start, float end, float current){
    return (current - start) / (end - start);
}

out vec4 v_color;
out float v_radius;
out vec3 v_modelViewPosition;

void main() {
    vec4 modelViewPosition = ${GLSL_CAMERA.viewMatrix} * vec4(position + velocity * dt, 1.);

    v_modelViewPosition = modelViewPosition.xyz;

    gl_Position = ${GLSL_CAMERA.projectionMatrix} * modelViewPosition;
    
    int widthIndex = 0;
    vec4 previousKeyframe;
    vec4 keyframe = texelFetch(keyframesTexture, ivec2(widthIndex, 0), 0);

    float actualTime = time + dt;

    while(keyframe[0] < actualTime && widthIndex < ${KEYFRAMES_PIXEL_LENGTH}) {
        widthIndex += ${KEYFRAME_PIXEL_LENGTH};
        previousKeyframe = keyframe;
        keyframe = texelFetch(keyframesTexture, ivec2(widthIndex, 0), 0);
    }

    if(widthIndex >= ${KEYFRAMES_PIXEL_LENGTH}) {
        v_color.w = 0.;
        gl_PointSize = 1.;
        gl_Position.x = 2.;
        gl_Position.w = 1.;
    } else if( widthIndex == 0 ) {
        v_color = texelFetch(keyframesTexture, ivec2(1, 0), 0);

        float computedSize = keyframe[1];
        v_radius = computedSize / 2.;
        gl_PointSize = ${GLSL_POINT.getPixelDiameter('computedSize', 'modelViewPosition.z')};
    } else {
        float alpha = getAlpha(previousKeyframe[0], keyframe[0], actualTime);
        
        vec4 previousKeyframeColor = texelFetch(keyframesTexture, ivec2(widthIndex - ${KEYFRAME_PIXEL_LENGTH} + ${KEYFRAME_COLOR_PIXEL_OFFSET}, 0), 0);
        vec4 keyframeColor = texelFetch(keyframesTexture, ivec2(widthIndex + ${KEYFRAME_COLOR_PIXEL_OFFSET}, 0), 0);
        v_color = mix(previousKeyframeColor, keyframeColor, alpha);

        float computedSize = mix(previousKeyframe[1], keyframe[1], alpha);
        v_radius = computedSize / 2.;
        gl_PointSize = ${GLSL_POINT.getPixelDiameter('computedSize', 'modelViewPosition.z')};
    }
}
`,
    () => `#version 300 es
precision highp float;
precision highp sampler2D;
precision highp isampler2D;

in vec4 v_color;
in float v_radius;
in vec3 v_modelViewPosition;

uniform sampler2D bumpTexture;
uniform sampler2D depthTexture;

${GLSL_CAMERA.declaration}
${GLSL_WINDOW.declaration}
${GLSL_UTILS.linearizeDepth.declaration(GLSL_CAMERA.near, GLSL_CAMERA.far)}
${GLSL_UTILS.linearDepthToGl.declaration(GLSL_CAMERA.near, GLSL_CAMERA.far)}
${GLSL_DEFERRED.fragmentUserDeclaration}
${GLSL_POINT.fragmentDeclaration}

out vec4 color;

void main(){
    vec3 sphereNormal = ${GLSL_POINT.getDiscardAndGetSphereNormal()};

    vec3 fragViewPos = v_modelViewPosition + v_radius * sphereNormal;

    ${GLSL_POINT.computeFragDepth('fragViewPos.z')};
    
    vec2 screenUv = ${GLSL_POINT.getScreenUV()};
    ivec2 screenTexelCoord = ${GLSL_DEFERRED.getTexelCoord('screenUv')};
    float opaqueDepth = ${GLSL_DEFERRED.getDeferredPositionDepth('screenTexelCoord')}.w;

    float l = ${GLSL_POINT.getDeltaDepth('opaqueDepth', 'fragViewPos.z', 'v_radius')};

    float softAlpha = ${GLSL_POINT.getSoftAlpha('l')};

    float alpha = softAlpha;
    alpha *=  sphereNormal.z;
    color = texture(bumpTexture, gl_PointCoord.xy) * v_color;
    color *= alpha;
}
`)


function createKeyFrameTexture(
    /** @type {ParticleKeyframe[]} */ keyframes
) {
    const keyframesBuffer = new Float32Array(KEYFRAMES_F32_LENGTH)

    for (let i = 0; i < keyframes.length; i++) {
        const keyframe = keyframes[i]
        const offset = i * KEYFRAME_F32_LENGTH
        keyframesBuffer[offset + KEYFRAME_TIME_OFFSET] = keyframe.time
        keyframesBuffer[offset + KEYFRAME_SIZE_OFFSET] = keyframe.size
        keyframe.color.toArray(keyframesBuffer, offset + KEYFRAME_COLOR_OFFSET)
        keyframesBuffer[offset + KEYFRAME_ALPHA_OFFSET] = keyframe.color.a
    }

    return new GlTexture({
        name: `keyframes particle`,
        data: keyframesBuffer,

        wrapS: 'CLAMP_TO_EDGE',
        wrapT: 'CLAMP_TO_EDGE',
        minFilter: 'NEAREST',
        magFilter: 'NEAREST',

        internalformat: 'RGBA32F',
        width: KEYFRAMES_PIXEL_LENGTH, // 4 floats / pixel
        height: 1,
        border: 0,
        format: 'RGBA',
        type: 'FLOAT',

        needsMipmap: false,
    })
}

const _box3 = new Box3()
const _vector3 = new Vector3()

export class ParticleSystemObject extends GlObject {
    #positionVelocityTime
    #particleLifeTime
    #emitDeltaTime
    #particleCount
    #glArrayBuffer
    emitterPosition
    #initVelocity
    #maxPointSize = new Vector3()

    constructor(
        /** 
         * @type {{
         *      initVelocity?: (array: Float32Array, offset: number) => void
         *      emitDeltaTime: number
         *      particleLifeTime: number
         *      emitterPosition?: Vector3
         *      additiveBlending?: boolean
         *      normalBlending?: boolean
         *      keyframes: ParticleKeyframe[]
         *      deferredTextures: GlRenderer['deferredTextures']
         *      maxVelocity?: number
         * }}
        */
        {
            initVelocity = (velocity, offset) => {
                velocity[offset] = 0
                velocity[offset + 1] = 0
                velocity[offset + 2] = 0
            },
            emitDeltaTime,
            particleLifeTime,
            emitterPosition = new Vector3(),
            additiveBlending = true,
            normalBlending = false,
            keyframes,
            deferredTextures,
            maxVelocity
        }
    ) {
        const particleCount = Math.ceil(particleLifeTime / emitDeltaTime)
        console.log(`New particle system with ${particleCount} particles.`)
        const arrayBuffer = new Float32Array(particleCount * FLOAT_32_ELEMENT_COUNT).fill(2000)
        const inPositionVelocityTime = new GlArrayBuffer(arrayBuffer, 'DYNAMIC_DRAW')
        const glVao = new GlVao(
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


        super({
            drawMode: 'POINTS',
            additiveBlending,
            normalBlending,
            depthWrite: false,
            count: particleCount,
            glVao,
            glProgram,
            uniforms: {
                dt: 0,
                keyframesTexture: createKeyFrameTexture(keyframes),
                bumpTexture: new GlTexture({
                    data: createSparkleCanvas()
                }),
                ...GLSL_DEFERRED.createUserUniform(deferredTextures)
            }
        })

        this.#glArrayBuffer = inPositionVelocityTime
        this.#positionVelocityTime = arrayBuffer
        this.#particleCount = particleCount
        this.#emitDeltaTime = emitDeltaTime
        this.#particleLifeTime = particleLifeTime
        this.#initVelocity = initVelocity
        this.emitterPosition = emitterPosition


        for (const keyframe of keyframes) {
            if (this.#maxPointSize.x < keyframe.size) this.#maxPointSize.setScalar(keyframe.size)
        }

        if (maxVelocity === undefined) {
            const velocity = new Float32Array(3)
            initVelocity(velocity, 0)
            this.#maxPointSize.add(_vector3.fromArray(velocity.map((v) => Math.abs(v))).multiplyScalar(2))
        } else {
            this.#maxPointSize.addScalar(maxVelocity * 2)
        }

        this.glVao.boundingBox.makeEmpty()
    }

    #emitterTime = 0
    #physicsTime = 0

    #updatePhysics(
        /** @type {number} */ index
    ) {
        const start = FLOAT_32_ELEMENT_COUNT * index

        this.#positionVelocityTime[start] += this.#positionVelocityTime[start + 3] * PHYSICS_DT
        this.#positionVelocityTime[start + 1] += this.#positionVelocityTime[start + 4] * PHYSICS_DT
        this.#positionVelocityTime[start + 2] += this.#positionVelocityTime[start + 5] * PHYSICS_DT
    }

    #currentAddIndex = 0
    #addParticle() {
        this.#currentAddIndex = (this.#currentAddIndex + 1) % this.#particleCount
        const start = FLOAT_32_ELEMENT_COUNT * this.#currentAddIndex

        this.emitterPosition.toArray(this.#positionVelocityTime, start)
        this.#initVelocity(this.#positionVelocityTime, start + 3)

        _box3.setFromCenterAndSize(
            this.emitterPosition,
            this.#maxPointSize
        )

        this.glVao.boundingBox.union(_box3)
        
        return this.#currentAddIndex
    }

    update() {
        const dt = loopRaf.deltatimeSecond

        this.#physicsTime += dt
        this.#emitterTime += dt

        while (this.#emitterTime > this.#emitDeltaTime) {
            this.#emitterTime -= this.#emitDeltaTime
            let rest = this.#emitterTime
            const index = this.#addParticle()
            this.#positionVelocityTime[index * FLOAT_32_ELEMENT_COUNT + 6] = rest
            while (rest > PHYSICS_DT) {
                rest -= PHYSICS_DT
                this.#updatePhysics(index)
            }
            this.#glArrayBuffer.version++
        }

        while (this.#physicsTime > PHYSICS_DT) {
            this.#physicsTime -= PHYSICS_DT
            for (let i = 0; i < this.#particleCount; i++) {
                this.#positionVelocityTime[i * FLOAT_32_ELEMENT_COUNT + 6] += PHYSICS_DT
                this.#updatePhysics(i)
            }
            this.#glArrayBuffer.version++
        }

        this.uniforms.dt = this.#physicsTime
    }
}
