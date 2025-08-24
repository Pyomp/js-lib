import { loopRaf } from "../../../utils/loopRaf.js"
import { GLSL_CAMERA } from "../../programs/chunks/glslCamera.js"
import { GLSL_DEFERRED } from "../../programs/chunks/glslDeferred.js"
import { GLSL_POINT_LIGHT } from "../../programs/chunks/glslPointLight.js"
import { GLSL_UTILS } from "../../programs/chunks/glslUtils.js"
import { GLSL_WINDOW } from "../../programs/chunks/glslWindow.js"
import { createSparkleCanvas } from "../../textures/sparkle.js"
import { GlArrayBuffer } from "../../webgl/glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../../webgl/glDescriptors/GlAttribute.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlProgram } from "../../webgl/glDescriptors/GlProgram.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"
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

const glProgram = new GlProgram(() => `#version 300 es
#define PHYSICS_DT ${PHYSICS_DT}
#define ATTENUATION 100.0

in vec3 position;
in vec3 velocity;
in float time;

${GLSL_CAMERA.declaration}
${GLSL_WINDOW.declaration}

uniform sampler2D keyframesTexture;
uniform float dt;

float getAlpha(float start, float end, float current){
    return (current - start) / (end - start);
}

out vec4 v_color;
out float v_size;

void main() {
    float size = 5.;

    vec3 mvPosition = position + velocity * dt;

    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * vec4(mvPosition, 1.);
    
    int widthIndex = 0;
    vec4 previousKeyframe;
    vec4 keyframe = texelFetch(keyframesTexture, ivec2(widthIndex, 0), 0);

    while(keyframe[0] < time && widthIndex < ${KEYFRAMES_PIXEL_LENGTH}) {
        widthIndex += ${KEYFRAME_PIXEL_LENGTH};
        previousKeyframe = keyframe;
        keyframe = texelFetch(keyframesTexture, ivec2(widthIndex, 0), 0);
    }

    float pointFactor = ${GLSL_WINDOW.resolution}.y * 0.5;

    if(widthIndex >= ${KEYFRAMES_PIXEL_LENGTH}) {
        v_color.w = 0.;
        gl_PointSize = 1.;
        gl_Position.x = 2.;
        gl_Position.w = 1.;
    } else if( widthIndex == 0 ) {
        v_color = texelFetch(keyframesTexture, ivec2(1, 0), 0);
        gl_PointSize = keyframe[1] * size * pointFactor / gl_Position.z;        
    } else {
        float alpha = getAlpha(previousKeyframe[0], keyframe[0], time);
        vec4 previousKeyframeColor = texelFetch(keyframesTexture, ivec2(widthIndex - ${KEYFRAME_PIXEL_LENGTH} + ${KEYFRAME_COLOR_PIXEL_OFFSET}, 0), 0);
        vec4 keyframeColor = texelFetch(keyframesTexture, ivec2(widthIndex + ${KEYFRAME_COLOR_PIXEL_OFFSET}, 0), 0);
        v_color = mix(previousKeyframeColor, keyframeColor, alpha);
        gl_PointSize = mix(previousKeyframe[1], keyframe[1], alpha) * size * pointFactor / gl_Position.z;
    }

    v_size = gl_PointSize / ${GLSL_WINDOW.resolution}.y;
}
`,
    () => `#version 300 es
precision highp float;
precision highp sampler2D;
precision highp isampler2D;

in vec4 v_color;
in float v_size;

uniform sampler2D bumpTexture;
uniform sampler2D depthTexture;

${GLSL_CAMERA.declaration}
${GLSL_WINDOW.declaration}
${GLSL_UTILS.linearizeDepth.declaration(GLSL_CAMERA.near, GLSL_CAMERA.far)}
${GLSL_UTILS.linearDepthToGl.declaration(GLSL_CAMERA.near, GLSL_CAMERA.far)}

${GLSL_DEFERRED.fragmentUserDeclaration}

out vec4 color;

void main(){
    // 1. Circle mask inside the point
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(uv, uv);
    if (r2 > 1.0) discard;

    // 2. Sphere z displacement from circle equation: x^2 + y^2 + z^2 = r^2
    float zDisp = sqrt(max(0.0, 1.0 - r2)); // normalized hemisphere depth

    // 3. Add displacement to current depth
    //    Here gl_FragCoord.z is window-space depth [0,1].
    float pointDepthLinear = ${GLSL_UTILS.linearizeDepth.call('gl_FragCoord.z')};
    pointDepthLinear -= (zDisp * v_size);
    float sphereDepth = pointDepthLinear;
    // float sphereDepth = gl_FragCoord.z - (zDisp * v_size);

    // 4. Scene depth from depth texture

    float sceneDepthLinear = ${GLSL_DEFERRED.getDeferredPositionDepth('uv')}.w;

    vec2 screenUv = gl_FragCoord.xy / ${GLSL_WINDOW.resolution};
    float sceneDepth = float(texture(depthTexture, screenUv).x);

    // 5. Depth difference → attenuation
    float delta = sphereDepth - sceneDepth;
    float fade = mix(1.0, 0.0,
                     smoothstep(0.0, v_size, max(0.0, delta)));

  
    // 6. Opacity also depends on distance from center (strongest at center)
    float radial = sqrt(1.0 - r2);  

    float particleDepthLinear = ${GLSL_UTILS.linearizeDepth.call('gl_FragCoord.z')};

    float alpha = radial;
    // float alpha = radial * fade;

    // float de = length(gl_PointCoord * 2. - 1.);
    // float sphereDepth = 1. - de * de;
    // particleDepthLinear -= sphereDepth * v_size * 0.038;

    // float l = abs(${GLSL_UTILS.linearizeDepth.call('screenDepth')} - particleDepthLinear);

    
    // color = texture(bumpTexture, gl_PointCoord.xy) * v_color;
    // color = texture(bumpTexture, gl_PointCoord.xy);

    color = vec4(1.0, 0.6, 0.2, 1.0);
    color *= alpha;
    color = vec4(zDisp,zDisp,zDisp, 1.0);

    // 8. Update depth buffer with our displaced depth
    // gl_FragDepth = sphereDepth;
    gl_FragDepth = ${GLSL_UTILS.linearDepthToGl.call('pointDepthLinear')};
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


export class ParticleSystemObject extends GlObject {
    #positionVelocityTime
    #particleLifeTime
    #emitDeltaTime
    #particleCount
    #glArrayBuffer
    #emitterPosition
    #initVelocity

    constructor(
        /** 
         * @type {{
         *      initVelocity: (array: Float32Array, offset: number) => void
         *      emitDeltaTime: number
         *      particleLifeTime: number
         *      emitterPosition: Vector3
         *      opaquePositionDepthTexture: GlTexture
         *      depthTexture: GlTexture
         *      keyframes: ParticleKeyframe[]
         *      inDeferredColorTexture: GlTexture
         *      inDeferredPositionTexture: GlTexture
         *      inDeferredNormalTexture: GlTexture
         * }}
        */
        {
            initVelocity,
            emitDeltaTime,
            particleLifeTime,
            emitterPosition,
            opaquePositionDepthTexture,
            depthTexture,
            keyframes,
            inDeferredColorTexture,
            inDeferredPositionTexture,
            inDeferredNormalTexture
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
            additiveBlending: true,
            depthWrite: false,
            count: particleCount,
            glVao,
            glProgram,
            uniforms: {
                dt: 0,
                keyframesTexture: createKeyFrameTexture(keyframes),
                opaquePositionDepthTexture,
                bumpTexture: new GlTexture({
                    data: createSparkleCanvas()
                }),
                depthTexture,
                ...GLSL_DEFERRED.createUserUniform(inDeferredColorTexture, inDeferredPositionTexture, inDeferredNormalTexture)
            }
        })

        this.#glArrayBuffer = inPositionVelocityTime
        this.#positionVelocityTime = arrayBuffer
        this.#particleCount = particleCount
        this.#emitDeltaTime = emitDeltaTime
        this.#particleLifeTime = particleLifeTime
        this.#initVelocity = initVelocity
        this.#emitterPosition = emitterPosition

        this.glVao?.boundingBox.makeInfinity()
        setTimeout(() => {
            this.glVao?.computeBoundingBox()
            this.glVao?.boundingBox.expandByScalar(1.5)
        }, particleLifeTime * 1000 + 1000)
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

        this.#emitterPosition.toArray(this.#positionVelocityTime, start)
        this.#initVelocity(this.#positionVelocityTime, start + 3)

        return this.#currentAddIndex
    }

    update() {
        const dt = loopRaf.deltatimeSecond

        this.#physicsTime += dt
        this.#emitterTime += dt

        for (let i = 0; i < this.#particleCount; i++) {
            this.#positionVelocityTime[i * FLOAT_32_ELEMENT_COUNT + 6] += dt
        }

        while (this.#emitterTime > this.#emitDeltaTime) {
            this.#emitterTime -= this.#emitDeltaTime
            let rest = this.#emitterTime
            const index = this.#addParticle()
            this.#positionVelocityTime[index * FLOAT_32_ELEMENT_COUNT + 6] = rest
            while (rest > PHYSICS_DT) {
                rest -= PHYSICS_DT
                this.#updatePhysics(index)
            }
        }

        while (this.#physicsTime > PHYSICS_DT) {
            this.#physicsTime -= PHYSICS_DT
            for (let i = 0; i < this.#particleCount; i++) {
                this.#updatePhysics(i)
            }
        }

        this.uniforms.dt = this.#physicsTime

        this.#glArrayBuffer.version++
    }
}
