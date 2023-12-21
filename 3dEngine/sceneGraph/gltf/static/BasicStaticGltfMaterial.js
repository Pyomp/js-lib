import { Material } from "../../MaterialOld.js"

export class BasicStaticGltfMaterial extends Material {
    constructor() {
        super({
            vertexShader: () =>
                `#version 300 es
            in vec3 position;
            in vec2 uv;
            
            layout(std140) uniform cameraUbo {
                mat4 viewMatrix;
                mat4 projectionMatrix;
                mat4 projectionViewMatrix;
                vec3 cameraPosition;
                float near;
                float far;
            };

            uniform mat4 modelMatrix;

            out vec2 v_uv;

            void main() {

                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                
                gl_Position = projectionViewMatrix * worldPosition;

                v_uv = uv;
        }`,
            fragmentShader: () =>
                `#version 300 es
            precision highp float;
        
            in vec2 v_uv;
        
            uniform sampler2D map;          
                    
            out vec4 outColor;

            void main() {
                outColor = texture(map, v_uv);
                // outColor = vec4(1.0, 0. ,0. ,1.);
            }`
        })
    }
}

