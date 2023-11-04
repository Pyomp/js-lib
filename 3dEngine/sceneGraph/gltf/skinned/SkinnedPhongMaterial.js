import { Material } from "../../Material.js"

export class SkinnedPhongMaterial extends Material {
    constructor() {
        super({
            vertexShader: () =>
                `#version 300 es
            in vec3 position;
            in vec3 normal;
            in vec2 uv;
            in vec4 weights;
            in uvec4 joints;
            
            layout(std140) uniform cameraUbo {
                mat4 viewMatrix;
                mat4 projectionMatrix;
                mat4 projectionViewMatrix;
                vec3 cameraPosition;
                float near;
                float far;
            };

            uniform mat4 modelMatrix;
            uniform sampler2D jointsTexture;

            out vec3 v_normal;
            out vec2 v_uv;
            out vec3 v_surfaceToView;
            out vec3 v_worldPosition;

            mat4 getBoneMatrix(uint jointNdx) {
                return mat4(
                  texelFetch(jointsTexture, ivec2(0, jointNdx), 0),
                  texelFetch(jointsTexture, ivec2(1, jointNdx), 0),
                  texelFetch(jointsTexture, ivec2(2, jointNdx), 0),
                  texelFetch(jointsTexture, ivec2(3, jointNdx), 0));
            }

            void main() {
                mat4 skinMatrix = getBoneMatrix(joints[0]) * weights[0] +
                                getBoneMatrix(joints[1]) * weights[1] +
                                getBoneMatrix(joints[2]) * weights[2] +
                                getBoneMatrix(joints[3]) * weights[3];
                                
                vec4 worldPosition = modelMatrix * skinMatrix * vec4(position, 1.0);
                
                gl_Position = projectionViewMatrix * worldPosition;

                v_normal = mat3(modelMatrix) * normal;
                v_uv = uv;
                v_worldPosition = worldPosition.xyz / worldPosition.w;
                v_surfaceToView = cameraPosition - v_worldPosition;
        }`,
            fragmentShader: ({ pointLightCount }) =>
                `#version 300 es
            precision highp float;

            ${pointLightCount > 0 ? '#define POINT_LIGHT' : ''}
        
            in vec3 v_normal;
            in vec2 v_uv;

            in vec3 v_surfaceToView;
            in vec3 v_worldPosition;
        
            uniform sampler2D map;

            uniform vec3 specular;
            uniform float shininess;               
                    
            out vec4 outColor;

            #ifdef POINT_LIGHT
            struct PointLight {
                vec3 position;
                float intensity;
                vec3 color;                    
            };               
            
            layout(std140) uniform pointLightsUBO {
                PointLight pointLights[${pointLightCount}];
            };
            
            void calcPointLight(in vec3 normal, out vec3 color, out float specular){
                for (int i = 0; i < ${pointLightCount}; i++) {
                    PointLight pointLight = pointLights[i];

                    vec3 L = normalize(pointLight.position - v_worldPosition);

                    float lambertian = max(dot(normal, L), 0.0);
                    color += lambertian * pointLight.color;

                    vec3 R = reflect(L, normal); // Reflected light vector
                    vec3 V = normalize(-v_worldPosition); // Vector to viewer

                    float specAngle = max(dot(R, V), 0.0);
                    specular += pow(specAngle, shininess);
                }
            }
            #endif

            void main() {
                vec3 normal = normalize(v_normal);
                
                vec3 ambientLight = vec3(0.1, 0.1, 0.1);

                vec3 pointLightColor;
                float pointLightSpecular;

                #ifdef POINT_LIGHT
                calcPointLight(normal, pointLightColor, pointLightSpecular);
                #endif

                vec3 lightColor = ambientLight + pointLightColor;
                float lightSpecular = pointLightSpecular;

                vec4 color = texture(map, v_uv);                  

                outColor = vec4(color.xyz * lightColor + lightSpecular * specular, color.a);
                // outColor = vec4(1.0, 0.,0.,1.);
            }`
        })
    }
}

