import { Geometry } from "../webgl/glDescriptors/GlVaoData.js"
import { Object3D } from "../sceneGraph/Object3D.js"
import { Texture } from "../webgl/glDescriptors/GlTextureData.js"
import { createSparkleCanvas } from "../textures/sparkle.js"

/**
 * @implements {Material}
 */
export class LightParticleMaterial {
    needsDelete = false

    vertexShader({ pointLightCount }) {
        return `#version 300 es
precision highp float;

layout(std140) uniform cameraUbo {
    mat4 viewMatrix;
    mat4 projectionMatrix;
    mat4 projectionViewMatrix;
    mat4 projectionViewMatrixInverse;
    vec3 cameraPosition;
    float near;
    float far;
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
}`
    }
    fragmentShader() {
        return `#version 300 es
precision highp float;

uniform sampler2D map;

in vec4 v_color;

out vec4 outColor;

void main() {
    outColor = texture(map, gl_PointCoord.xy) * v_color;
}`
    }
    createUniforms() { return {} }
    createTextures() {
        return {
            map: new Texture({ data: createSparkleCanvas() })
        }
    }
    createGeometry() { return new Geometry(0) }
}

export class LightParticleObject extends Object3D {
    set count(/** @type {number} */ value) {
        this.geometry.count = value
    }

    constructor(
        /** @type {LightParticleMaterial} */ material = new LightParticleMaterial(),
        /** @type {{[name: string]: Texture}} */ textures = material.createTextures(),
    ) {
        super({
            drawMode: 'POINTS',
            additiveBlending: true,
            depthWrite: false,
            geometry: new Geometry(0),
            material,
            textures,
        })
    }
}
