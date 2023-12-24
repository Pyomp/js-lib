import { Color } from "../../../math/Color.js"
import { Geometry } from "../Geometry.js"
import { Object3D } from "../Object3D.js"
import { Texture } from "../Texture.js"

/**
 * @implements {MaterialGltf}
 */
export class PhongMaterial {
    needsDelete = false
    createUniforms(
        /** @type {Matrix4} */ worldMatrix,
        /** @type {Matrix3} */ normalMatrix,
        /** @type {number} */ shininess = 30,
        /** @type {Color} */ specular = new Color(0x444444)
    ) {
        return {
            modelMatrix: worldMatrix,
            specular,
            shininess,
            normalMatrix // TODO not implemented in shaders
        }
    }
    createUniformsFromGltf({
        /** @type {Matrix4} */ worldMatrix,
        /** @type {Matrix3} */ normalMatrix,
        /** @type {GltfPrimitive} */ gltfPrimitive,
        /** @type {Color} */ specular = new Color(0x444444)
    }) {
        return this.createUniforms(
            worldMatrix,
            normalMatrix,
            200 ** (1 - gltfPrimitive.material?.pbrMetallicRoughness?.roughnessFactor ?? 0),
            specular
        )
    }
    createTextures( /** @type {Image} */ image) {
        return { map: new Texture({ data: image }) }
    }
    createTexturesFromGltf(/** @type {GltfPrimitive} */ gltfPrimitive) {
        return this.createTextures(gltfPrimitive.material?.pbrMetallicRoughness?.baseColorTexture?.source ?? null)
    }
    createGeometry(
        /** @type {Float32Array} */ positionAttributeBuffer,
        /** @type {Float32Array} */ uvAttributeBuffer,
        /** @type {Float32Array} */ normalAttributeBuffer,
        /** @type {number} */ count,
        /** @type {Uint8Array | Uint16Array | Uint32Array} */ indices
    ) {
        const attributes = {
            position: positionAttributeBuffer,
            uv: uvAttributeBuffer,
            normal: normalAttributeBuffer,
        }
        return new Geometry(count, attributes, indices)
    }
    createGeometryFromGltf(/** @type {GltfPrimitive} */ gltfPrimitive) {
        return this.createGeometry(
            gltfPrimitive.attributes.POSITION.buffer,
            gltfPrimitive.attributes.TEXCOORD_0.buffer,
            gltfPrimitive.attributes.NORMAL.buffer,
            gltfPrimitive.indices.count,
            gltfPrimitive.indices.buffer
        )
    }

    createObjectFromGltf(
        /** @type {Node3D} */ node3D,
        /** @type {GltfPrimitive} */ gltfPrimitive,
        /** @type {Color} */ specular = new Color(0x444444)
    ) {
        return new Object3D({
            material: this,
            geometry: this.createGeometryFromGltf(gltfPrimitive),
            textures: this.createTexturesFromGltf(gltfPrimitive),
            uniforms: this.createUniformsFromGltf({ worldMatrix: node3D.worldMatrix, normalMatrix: node3D.normalMatrix, gltfPrimitive, specular })
        })
    }

    vertexShader() {
        return `#version 300 es
in vec3 position;
in vec3 normal;
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

out vec3 v_normal;
out vec2 v_uv;
out vec3 v_surfaceToView;
out vec3 v_worldPosition;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    
    gl_Position = projectionViewMatrix * worldPosition;

    // gl_Position.z = linearizeDepth(gl_Position);

    v_normal = mat3(modelMatrix) * normal;
    v_uv = uv;
    v_worldPosition = worldPosition.xyz / worldPosition.w;
    v_surfaceToView = cameraPosition - v_worldPosition;
}`
    }

    fragmentShader({ pointLightCount }) {
        return `#version 300 es
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
    };
};
#endif

void main() {
    vec3 normal = normalize(v_normal);

    // TODO
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
}`
    }
}
