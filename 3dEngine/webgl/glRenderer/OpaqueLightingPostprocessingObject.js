import { GlVao } from "../glDescriptors/GlVao.js"
import { GlObject } from "../glDescriptors/GlObject.js"
import { GlProgram } from "../glDescriptors/GlProgram.js"
import { GlAttribute } from "../glDescriptors/GlAttribute.js"
import { GlArrayBuffer } from "../glDescriptors/GlArrayBuffer.js"
import { GLSL_CAMERA } from "../../programs/chunks/glslCamera.js"
import { GLSL_UTILS } from "../../programs/chunks/glslUtils.js"
import { GLSL_AMBIENT_LIGHT } from "../../programs/chunks/glslAmbient.js"
import { GLSL_POINT_LIGHT } from "../../programs/chunks/glslPointLight.js"
import { GlRenderer } from "./GlRenderer.js"
import { GlTextureNoise } from "../../textures/GlTextureNoise.js"
import { GLSL_WINDOW } from "../../programs/chunks/glslWindow.js"
import { GLSL_DEFERRED } from "../../programs/chunks/glslDeferred.js"

export class OpaqueLightingPostprocessingObject extends GlObject {

    resize(
        /** @type {number} */ width,
        /** @type {number} */ height
    ) {
        this.uniforms.noiseTexture.resize(width, height)
    }

    dispose() {
        this.uniforms.noiseTexture.needsDelete = true
    }

    /**
     * 
     * @param {{ 
     *      renderer: GlRenderer
     * }} params
     */
    constructor({
        renderer
    }) {
        super({
            drawMode: 'TRIANGLES',
            depthWrite: false,
            depthTest: false,
            uniforms: {
                noiseTexture: new GlTextureNoise(),
                ...GLSL_DEFERRED.createUserUniform(renderer.deferredOpaqueFB.deferredTextures)
            },
            glVao: new GlVao([
                new GlAttribute({
                    glArrayBuffer: new GlArrayBuffer(new Float32Array([
                        -1, -1,
                        1, -1,
                        -1, 1,
                        1, 1,
                    ])),
                    name: 'position', size: 2
                }),
                new GlAttribute({
                    glArrayBuffer: new GlArrayBuffer(new Float32Array([
                        0, 0,
                        1, 0,
                        0, 1,
                        1, 1,
                    ])),
                    name: 'uv', size: 2
                })],
                new Uint16Array([0, 1, 2, 1, 3, 2])),
            glProgram: new GlProgram(
                () =>
                    `#version 300 es
                    precision highp float;
                
                    in vec2 position;
                    in vec2 uv;

                    out vec2 v_uv;

                    void main() {
                        v_uv = uv;
                        gl_Position = vec4(position, 0. ,1.);
                    }`,
                () =>
                    /*glsl*/`#version 300 es
                    precision highp float;
                    precision highp int;
                    precision highp isampler2D;
                    precision highp sampler2D;
                    
                    #define INT_RANGE 2147483647.0

                    in vec2 v_uv;

                    uniform sampler2D noiseTexture;

                    out vec4 outColor;

                    ${GLSL_CAMERA.declaration}
                    ${GLSL_AMBIENT_LIGHT.fragmentDeclaration}
                    ${GLSL_POINT_LIGHT.uboDeclaration(renderer.pointLightCount)}
                    ${GLSL_UTILS.linearizeDepth.declaration(GLSL_CAMERA.near, GLSL_CAMERA.far)}
                    ${GLSL_WINDOW.declaration}
                    ${GLSL_DEFERRED.fragmentUserDeclaration}

                    ${GLSL_POINT_LIGHT.calcPointLightsDeclaration(renderer.pointLightCount, GLSL_CAMERA.position)}

                    #define SSAO_SAMPLE_RADIUS 8.0
                    #define SSAO_BIAS 0.04
                    #define SSAO_ATTENUATION 1.
                    #define SSAO_DEPTH_RANGE 1.
                    #define SIN45 0.707107

                    float getPixelOcclusion(vec3 position, vec3 normal, ivec2 fragCoord) {
                        vec3 occluderPosition = ${GLSL_DEFERRED.getDeferredPositionDepth('fragCoord')}.xyz;

                        vec3 positionVec = occluderPosition - position;

                        float intensity = max(dot(normal, normalize(positionVec)) - SSAO_BIAS, 0.0);
                    
                        float attenuation = 1.0 / (SSAO_ATTENUATION + SSAO_ATTENUATION * length(positionVec));
            
                        return intensity * attenuation;
                    }

                    float getOcclusion(vec3 position, float depth, vec3 normal, ivec2 fragCoord){
                        float kernelRadius = SSAO_SAMPLE_RADIUS * (1.0 - depth);

                        vec2 rand = normalize(texelFetch(noiseTexture, fragCoord, 0).xy);

                        vec2 kernel[4];
                        kernel[0] = vec2(0.0, 1.0);
                        kernel[1] = vec2(1.0, 0.0);
                        kernel[2] = vec2(0.0, -1.0);
                        kernel[3] = vec2(-1.0, 0.0);
            
                        float occlusion = 0.0;
                        for (int i = 0; i < 4; ++i) {
                            vec2 k1 = reflect(kernel[i], rand);
                            vec2 k2 = vec2(k1.x * SIN45 - k1.y * SIN45, k1.x * SIN45 + k1.y * SIN45);
            
                            k1 *= kernelRadius;
                            k2 *= kernelRadius;
            
                            occlusion += getPixelOcclusion(position, normal, fragCoord + ivec2(k1));
                            occlusion += getPixelOcclusion(position, normal, fragCoord + ivec2(k2 * 0.75));
                            occlusion += getPixelOcclusion(position, normal, fragCoord + ivec2(k1 * 0.5));
                            occlusion += getPixelOcclusion(position, normal, fragCoord + ivec2(k2 * 0.25));
                        }
            
                        return clamp(occlusion / 16.0, 0.0, 1.0);
                    }

                    #define EDL_RADIUS 1.
                    #define EDL_STRENGTH 10.

                    float computeEDL(ivec2 texelCoord, float currentDepth)
                    {
                        float factor = 1.-currentDepth;
                        factor = factor*factor;
                        factor = factor*factor;
                        factor = factor*factor;
                        factor = factor*factor;
                        factor = factor*factor;
                        factor = factor*factor;
                        factor = factor*factor;

                        float sum = 0.0;

                        float radius = 1. + EDL_RADIUS * factor;

                        const int checkNumber = 4;

                        ivec2 offsets[checkNumber] = ivec2[](
                            ivec2( 0. * radius,  1. * radius),
                            ivec2( 0. * radius, -1. * radius),
                            ivec2( 1. * radius,  0. * radius),
                            ivec2(-1. * radius,  0. * radius)
                        );

                        for (int i = 0; i < checkNumber; ++i) {
                            float neighborDepth = ${GLSL_DEFERRED.getDeferredPositionDepth('texelCoord + offsets[i]')}.w;
                            float diff =  currentDepth - neighborDepth;
                            sum += diff;
                        }

                        sum = abs(sum);

                        // Apply exponential falloff
                        // float shade = exp(-EDL_STRENGTH * sum);
          
                        float shade = (sum *( 0.01 + 10. * factor)) > 0.0001 ? 0.0 : 1.0;

                        return clamp(shade, 0.0, 1.0);
                    }
                    
                    void main() {
                        vec2 uv = v_uv;
                        ivec2 texelCoord = ${GLSL_DEFERRED.getTexelCoord('uv')};

                        vec3 currentPixelColor;
                        vec3 currentPixelPosition;
                        vec3 currentPixelNormal;
                        float currentPixelDepth;

                        ${GLSL_DEFERRED.computeDeferredPixel('texelCoord', 'currentPixelColor', 'currentPixelPosition', 'currentPixelDepth', 'currentPixelNormal')}

                        outColor.rgb = currentPixelColor;
                     
                        // lights
                        PointLight pointLight = PointLight(vec3(1.,1.,1.), 0.5, vec3(1.,1.,1.), 10.);

                        vec3 pointLightColor;
                        float pointLightSpecular;

                        ${GLSL_POINT_LIGHT.computePointLight('currentPixelPosition', 'currentPixelNormal', '1.0', 'pointLightColor', 'pointLightSpecular')}

                        outColor.rgb *= ${GLSL_AMBIENT_LIGHT.color} + pointLightColor;

                        float edlShade = computeEDL(texelCoord, currentPixelDepth);
                        outColor.rgb *= edlShade;

                        // outColor.rgb *= 1. - getOcclusion(currentPixelPosition, currentPixelDepth, currentPixelNormal, ivec2(gl_FragCoord.xy));
                        // outColor.rgb = vec3(1.-currentPixelDepth);
                        // outColor.rgb = currentPixelNormal;
                        outColor.a = 1.;
                    }`
            )
        })
    }
}
