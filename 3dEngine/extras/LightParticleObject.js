import { Geometry } from "../sceneGraph/Geometry.js"
import { Material } from "../sceneGraph/Material.js"
import { Object3D } from "../sceneGraph/Object3D.js"
import { Texture } from "../sceneGraph/Texture.js"
import { createSparkleCanvas } from "../textures/sparkle.js"

export class LightParticleObject extends Object3D {
    set count(/** @type {number} */ value) {
        this.geometry.count = value
    }

    constructor() {
        super({
            drawMode: 'POINTS',
            blending: true,
            depthWrite: false,
            geometry: new Geometry(0),
            material: new Material({
                vertexShader: (pointLightCount) =>
                    `#version 300 es
                    precision highp float;
                
                    uniform cameraUbo {
                        mat4 projectionViewMatrix;
                        vec3 cameraPosition;
                    };
        
                    struct PointLight {
                        vec3 position;
                        float intensity;
                        vec3 color;                    
                    };               
                
                    layout(std140) uniform pointLightsUBO {
                        PointLight pointLights[${pointLightCount}];
                    };
                    
                    out vec4 v_color;
        
                    void main() {
                        PointLight pointLight = pointLights[gl_VertexID];
                        
                        gl_Position = projectionViewMatrix * vec4(pointLight.position, 1.0);
                        gl_PointSize = 300. / gl_Position.z;
                        v_color = vec4(pointLight.color, pointLight.intensity);
                    }`,
                fragmentShader: () =>
                    `#version 300 es
                    precision highp float;
        
                    uniform sampler2D map;
        
                    in vec4 v_color;
                    
                    out vec4 outColor;
        
                    void main() {
                        outColor = texture(map, gl_PointCoord.xy) * v_color;
                    }`,
                textures: {
                    map: new Texture({ data: createSparkleCanvas() })
                }
            })
        })
    }
}