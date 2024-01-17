import { Color } from "../../../../math/Color.js"
import { Geometry } from "../../../webgl/glDescriptors/GlVaoData.js"
import { Object3D } from "../../Object3D.js"
import { Texture } from "../../../webgl/glDescriptors/GlTextureData.js"
import { SkinnedNode } from "./SkinnedNode.js"

/**
 * @implements {Material}
*/
export class SkinnedPhongMaterial {
    needsDelete = false

    createUniforms({
        /** @type {Matrix4} */ worldMatrix,
        /** @type {Matrix3} */ normalMatrix,
        /** @type {number} */ shininess = 30,
        /** @type {Color} */ specular = new Color(0x444444),
        /** @type {Number} */ alphaTest = -1
    }) {
        return {
            modelMatrix: worldMatrix,
            specular,
            shininess,
            alphaTest, // TODO not implemented in shaders
            normalMatrix // TODO not implemented in shaders
        }
    }
    createUniformsFromGltf({
        /** @type {Matrix4} */ worldMatrix = undefined,
        /** @type {Matrix3} */ normalMatrix = undefined,
        /** @type {GltfPrimitive} */ gltfPrimitive,
        /** @type {Color} */ specular = new Color(0x444444)
    }) {
        return this.createUniforms({
            worldMatrix,
            normalMatrix,
            shininess: 200 ** (1 - gltfPrimitive.material.pbrMetallicRoughness.roughnessFactor),
            alphaTest: gltfPrimitive.material.alphaMode === 'MASK' ? 0.5 : -1,
            specular
        })
    }
    createTextures( /** @type {Image} */ image, /** @type {Texture} */ jointsTexture) {
        return { map: new Texture({ data: image }), jointsTexture }
    }
    createTexturesFromGltf(/** @type {GltfPrimitive} */ gltfPrimitive, /** @type {Texture} */ jointsTexture) {
        return this.createTextures(gltfPrimitive.material.pbrMetallicRoughness.baseColorTexture.source, jointsTexture)
    }
    createGeometry(
        /** @type {Float32Array} */ positionAttributeBuffer,
        /** @type {Float32Array} */ uvAttributeBuffer,
        /** @type {Float32Array} */ normalAttributeBuffer,
        /** @type {Uint8Array} */ jointsAttributeBuffer,
        /** @type {Float32Array} */ weightsAttributeBuffer,
        /** @type {number} */ count,
        /** @type {Uint8Array | Uint16Array | Uint32Array} */ indices
    ) {
        const attributes = {
            position: positionAttributeBuffer,
            uv: uvAttributeBuffer,
            normal: normalAttributeBuffer,
            joints: jointsAttributeBuffer,
            weights: weightsAttributeBuffer

        }
        return new Geometry(count, attributes, indices)
    }

    createGeometryFromGltf(/** @type {GltfPrimitive} */ gltfPrimitive) {
        return this.createGeometry(
            gltfPrimitive.attributes.POSITION.buffer,
            gltfPrimitive.attributes.TEXCOORD_0.buffer,
            gltfPrimitive.attributes.NORMAL.buffer,
            gltfPrimitive.attributes.JOINTS_0.buffer,
            gltfPrimitive.attributes.WEIGHTS_0.buffer,
            gltfPrimitive.indices.count,
            gltfPrimitive.indices.buffer
        )
    }

    createObjectFromGltf(
        /** @type {SkinnedNode} */ node3D,
        /** @type {GltfPrimitive} */ gltfPrimitive,
        /** @type {Color} */ specular = new Color(0x444444)
    ) {
        return new Object3D({
            normalBlending: gltfPrimitive.material.alphaMode === 'BLEND',
            material: this,
            geometry: this.createGeometryFromGltf(gltfPrimitive),
            textures: this.createTexturesFromGltf(gltfPrimitive, node3D.mixer.jointsTexture),
            uniforms: this.createUniformsFromGltf({ worldMatrix: node3D.worldMatrix, normalMatrix: node3D.normalMatrix, gltfPrimitive, specular })
        })
    }

    vertexShader() {
        return `#version 300 es
in vec3 position;
in vec3 normal;
in vec2 uv;
in vec4 weights;
in uvec4 joints;

layout(std140) uniform cameraUbo {
    mat4 viewMatrix;
    mat4 projectionMatrix;
    mat4 projectionViewMatrix;
    mat4 projectionViewMatrixInverse;
    vec3 cameraPosition;
    float near;
    float far;
};

uniform mat4 modelMatrix;


out vec3 v_normal;
out vec2 v_uv;
out vec3 v_surfaceToView;
out vec3 v_worldPosition;

uniform sampler2D jointsTexture;
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

    v_normal = mat3(modelMatrix) * mat3(skinMatrix) * normal;
    v_uv = uv;
    v_worldPosition = worldPosition.xyz / worldPosition.w;
    v_surfaceToView = cameraPosition - v_worldPosition;
}`}

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
        
        vec3 eyeVec = normalize(v_surfaceToView);
        vec3 incidentVec = normalize(v_worldPosition - pointLight.position);
        vec3 lightVec = -incidentVec;
        float diffuse = max(dot(lightVec, normal), 0.0);
        float highlight = pow(max(dot(eyeVec, reflect(incidentVec, normal)), 0.0), shininess);
        color += diffuse * pointLight.color;
        specular += highlight;
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
} `}
}
