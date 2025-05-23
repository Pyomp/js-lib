import { GlVao } from "../glDescriptors/GlVao.js"
import { GlObject } from "../glDescriptors/GlObject.js"
import { GlProgram } from "../glDescriptors/GlProgram.js"
import { GlAttribute } from "../glDescriptors/GlAttribute.js"
import { GlArrayBuffer } from "../glDescriptors/GlArrayBuffer.js"
import { GlTexture } from "../glDescriptors/GlTexture.js"
import { GLSL_CAMERA } from "../../programs/chunks/glslCamera.js"
import { GLSL_UTILS } from "../../programs/chunks/glslUtils.js"
import { GLSL_AMBIENT_LIGHT } from "../../programs/chunks/glslAmbient.js"
import { GLSL_POINT_LIGHT } from "../../programs/chunks/glslPointLight.js"
import { GlRenderer } from "./GlRenderer.js"
import { GlNoiseTexture } from "../../textures/NoiseTexture.js"

export class OpaqueLightingPostprocessingObject extends GlObject {

    resize(width, height) {
        this.uniforms.noiseTexture.resize(width, height)
    }

    dispose() {
        this.uniforms.noiseTexture.needsDelete = true
    }

    /**
     * 
     * @param {{ 
     *  renderer: GlRenderer
     *  inColorTexture: GlTexture
     *  inPositionTexture: GlTexture
     *  inNormalTexture: GlTexture
     * }} params
     */
    constructor({
        renderer,
        inColorTexture,
        inPositionTexture,
        inNormalTexture,
    }) {
        super({
            drawMode: 'TRIANGLES',
            depthWrite: false,
            depthTest: false,
            uniforms: {
                inColorTexture,
                inPositionTexture,
                inNormalTexture,
                noiseTexture: new GlNoiseTexture()
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

                    uniform sampler2D inColorTexture;
                    uniform isampler2D inPositionTexture;
                    uniform isampler2D inNormalTexture;

                    uniform sampler2D noiseTexture;

                    out vec4 outColor;

                    ${GLSL_CAMERA.declaration}
                    ${GLSL_AMBIENT_LIGHT.fragmentDeclaration}
                    ${GLSL_POINT_LIGHT.uboDeclaration(renderer.pointLightCount)}
                    ${GLSL_UTILS.linearizeDepth.declaration(GLSL_CAMERA.near, GLSL_CAMERA.far)}

                    float getScreenDepth(vec2 uv) {
                        float depth = (float(texture(inPositionTexture, uv).w) / INT_RANGE) + 0.5;
                        return depth;
                    }
                    
                    vec3 getPosition(vec2 uv){
                        return vec3(texture(inPositionTexture, uv).xyz) / 1000.;   
                    }

                    vec3 getNormal(vec2 uv){
                        return normalize(vec3(texture(inNormalTexture, uv).xyz) / INT_RANGE);
                    }

                    vec3 getScreenPosition(vec3 position){
                        vec4 pos = vec4(position, 1.);
                        pos = ${GLSL_CAMERA.projectionViewMatrix} * pos;
                        vec3 ndcPosition = pos.xyz / pos.w;
                        return vec3((ndcPosition.xy + 1.) / 2., ndcPosition.z);
                    }

                    void calcPointLight(in vec3 position, in vec3 normal, out vec3 color, out float specular){
                        for (int i = 0; i < ${renderer.pointLightCount}; i++) {
                            
                            ${GLSL_POINT_LIGHT.PointLight} pointLight = ${GLSL_POINT_LIGHT.pointLights}[i];
                            
                            vec3 eyeVec = vec3(0.,0.,1.); // TODO
                            vec3 incidentVec = position - pointLight.position;
                            float incidentLength = length(incidentVec);
                            incidentVec = incidentVec / incidentLength;
                            vec3 lightVec = -incidentVec;
                            
                            float intensityDistance = max(0., (pointLight.${GLSL_POINT_LIGHT.incidence} - incidentLength) / pointLight.${GLSL_POINT_LIGHT.incidence});
                    
                            float diffuse = max(dot(lightVec, normal), 0.0);
                            color += diffuse * pointLight.${GLSL_POINT_LIGHT.color} * pointLight.${GLSL_POINT_LIGHT.intensity} * intensityDistance;
                    
                            float highlight = pow(max(dot(eyeVec, reflect(incidentVec, normal)), 0.0), 1.);
                            specular += highlight * pointLight.${GLSL_POINT_LIGHT.intensity};
                       
                        }
                    }

                    #define SSAO_SAMPLE_RADIUS 8.0
                    #define SSAO_BIAS 0.04
                    #define SSAO_ATTENUATION 1.
                    #define SSAO_DEPTH_RANGE 1.
                    #define SIN45 0.707107

                    float getPixelOcclusion(vec3 position, vec3 normal, ivec2 fragCoord) {
                        vec3 occluderPosition = vec3(texelFetch(inPositionTexture, fragCoord, 0).xyz) / 1000.;
 
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

                    void main() {
                        vec2 uv = v_uv;

                        vec3 currentPixelColor = texture(inColorTexture, uv).xyz;
                        vec3 currentPixelPosition = getPosition(uv);
                        vec3 currentPixelNormal = normalize(vec3(texture(inNormalTexture, uv).xyz)/1000000.);
                        float currentPixelDepth = getScreenDepth(uv);

                        outColor.rgb = currentPixelColor;

                     
                        // lights
                        PointLight pointLight = PointLight(vec3(1.,1.,1.), 0.5, vec3(1.,1.,1.), 10.);

                        vec3 pointLightColor;
                        float pointLightSpecular;

                        calcPointLight(currentPixelPosition, currentPixelNormal, pointLightColor, pointLightSpecular);

                        outColor.rgb *= ${GLSL_AMBIENT_LIGHT.color} + pointLightColor;

                        
                        // outColor.rgb *= 1. - getOcclusion(currentPixelPosition, currentPixelDepth, currentPixelNormal, ivec2(gl_FragCoord.xy));
                        // outColor.rgb = getPosition(uv) / 10.;
                        // outColor.rgb = getNormal(uv);
                        outColor.a = 1.;
                    }`
            )
        })
    }
}
