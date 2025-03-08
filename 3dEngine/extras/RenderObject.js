import { GlVao } from "../webgl/glDescriptors/GlVao.js"
import { GlObject } from "../webgl/glDescriptors/GlObject.js"
import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { GlAttribute } from "../webgl/glDescriptors/GlAttribute.js"
import { GlArrayBuffer } from "../webgl/glDescriptors/GlArrayBuffer.js"
import { GlTexture } from "../webgl/glDescriptors/GlTexture.js"
import { GLSL_CAMERA } from "../programs/chunks/glslCamera.js"
import { GLSL_UTILS } from "../programs/chunks/glslUtils.js"

export class RenderObject extends GlObject {
    /**
     * 
     * @param {{ 
     *  inColorTexture: GlTexture
     *  inPositionTexture: GlTexture
     *  inNormalTexture: GlTexture
     *  inDepthTexture: GlTexture
     * }} params
     */
    constructor({
        inColorTexture,
        inPositionTexture,
        inNormalTexture,
        inDepthTexture
    }) {
        super({
            drawMode: 'TRIANGLES',
            normalBlending: true,
            depthWrite: false,
            depthTest: false,
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
                    flat out vec3 v_lightPos;

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
                    
                    in vec2 v_uv;
                    flat in vec3 v_lightPos;

                    uniform sampler2D inColorTexture;
                    uniform isampler2D inPositionTexture;
                    uniform isampler2D inNormalTexture;
                    uniform sampler2D inDepthTexture;

                    out vec4 outColor;

                    #define SAMPLES 128
                    #define EPSILON 0.01
                    #define DEPTH_REVERSED false
                    #define SHADOW_INTENSITY 5.
                    #define SOFT_SHADOWS .1
                    #define DEPTH_SCALE 1.0

                    ${GLSL_CAMERA.declaration}
                    ${GLSL_UTILS.linearizeDepth.declaration(GLSL_CAMERA.near, GLSL_CAMERA.far)}

                    float getScreenDepth(vec2 uv) {
                        float a = texture(inDepthTexture, uv).x;
                        return ${GLSL_UTILS.linearizeDepth.call('a')};
                    }

                    float diffuse(vec3 n, vec3 l)
                    {
                        return max(0.0, dot(n,l));
                    }

                    struct PointLight {
                        vec3 position;
                        float intensity;
                        vec3 color;
                        float incidence;
                    };
                    
                    vec3 getPosition(vec2 uv){
                        return vec3(texture(inPositionTexture, uv).xyz)/1000.;   
                    }

                    vec3 getNormal(vec2 uv){
                        return normalize(vec3(texture(inNormalTexture, uv).xyz)/1000000.);
                    }

                    vec3 getScreenPosition(vec3 position){
                        vec4 pos = vec4(position, 1.);
                        pos = ${GLSL_CAMERA.projectionViewMatrix} * pos;
                        vec3 ndcPosition = pos.xyz / pos.w;
                        return vec3((ndcPosition.xy+1.)/2., ndcPosition.z);
                    }

                    #define LIGHT_SAMPLE_DIST 0.05

                    float calculateLight(vec3 lightPosition, vec2 uv){
                        vec3 pixelPosition = getPosition(uv);
                        vec3 lightDir = pixelPosition - lightPosition;
                        vec3 pixelScreenPosition = vec3(uv, getScreenDepth(uv));
                        vec3 lightScreenPosition = getScreenPosition(lightPosition);                        
                        vec3 lightScreenDir = pixelScreenPosition - lightScreenPosition;
                        vec3 lightScreenPos = lightScreenPosition; // TODO calculate the bound of the screen
                        
                        float lightResult = 1.;

                        for(int j=0; j<128; j++) {
                            lightScreenPos += LIGHT_SAMPLE_DIST * lightScreenDir;

                            vec3 normal = getNormal(lightScreenPos.xy);

                            lightResult += min(0., dot(lightDir, normal)*0.01);

                            if(lightResult <= 0.) return 0.;

                            // check lightScreenPos go beyond the current pixel point
                            vec3 currentDir = pixelScreenPosition - lightScreenPosition;
                            if(dot(currentDir, lightScreenDir) < 0.9) return lightResult;
                        }

                        return lightResult;
                    }

                    
                    void main() {
                        vec2 uv = v_uv;

                        vec3 currentPixelColor = texture(inColorTexture, uv).xyz;
                        vec3 currentPixelPosition = getPosition(uv);
                        vec3 currentPixelNormal = normalize(vec3(texture(inNormalTexture, uv).xyz)/1000000.);

                        outColor.rgb = currentPixelColor;

                        PointLight pointLight = PointLight(vec3(1.,1.,1.), 0.5, vec3(1.,1.,1.), 10.);

                        // vec3 pointLightColor;
                        // for (int i = 0; i < 1; i++) {                            
                        //     vec3 incidentVec = currentPixelPosition - pointLight.position;
                        //     float incidentLength = length(incidentVec);
                        //     incidentVec = incidentVec / incidentLength;
                        //     vec3 lightVec = -incidentVec;
                            
                        //     float diffuse = max(dot(lightVec, currentPixelNormal), 0.0);
                        //     pointLightColor += diffuse * pointLight.color * pointLight.intensity;
                        // }
                        // outColor.rgb *= pointLightColor;

                        // Compute lighting by marching again to detect obstruction
                        float light = calculateLight(pointLight.position, uv);
    
                        outColor.rgb = vec3(light);
                        outColor.rgb = getNormal(uv);
                        
                        outColor.a = 1.;
                    }`
            ),
            uniforms: {
                inColorTexture,
                inPositionTexture,
                inNormalTexture,
                inDepthTexture
            }
        })
    }
}
