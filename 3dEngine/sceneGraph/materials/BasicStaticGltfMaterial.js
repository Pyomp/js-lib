import { Color } from "../../../math/Color.js"
import { Geometry } from "../../webgl/glDescriptors/GlVaoData.js"
import { Object3D } from "../Object3D.js"
import { Texture } from "../../webgl/glDescriptors/GlTextureData.js"

/**
 * @implements {MaterialGltf}
 */
export class BasicStaticMaterial {
    needsDelete = false
    createUniforms(
        /** @type {Matrix4} */ worldMatrix
    ) {
        return {
            modelMatrix: worldMatrix,
        }
    }
    createUniformsFromGltf({/** @type {Matrix4} */ worldMatrix }) { return this.createUniforms(worldMatrix) }

    createTextures( /** @type {Image} */ image) {
        return { map: new Texture({ data: image }) }
    }
    createTexturesFromGltf(/** @type {GltfPrimitive} */ gltfPrimitive) {
        return this.createTextures(gltfPrimitive.material?.pbrMetallicRoughness?.baseColorTexture?.source ?? null)
    }

    createGeometry(
        /** @type {Float32Array} */ positionAttributeBuffer,
        /** @type {Float32Array} */ uvAttributeBuffer,
        /** @type {number} */ count,
        /** @type {Uint8Array | Uint16Array | Uint32Array} */ indices
    ) {
        const attributes = {
            position: positionAttributeBuffer,
            uv: uvAttributeBuffer,
        }
        return new Geometry(count, attributes, indices)
    }
    createGeometryFromGltf(/** @type {GltfPrimitive} */ gltfPrimitive) {
        return this.createGeometry(
            gltfPrimitive.attributes.POSITION.buffer,
            gltfPrimitive.attributes.TEXCOORD_0.buffer,
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
            uniforms: this.createUniformsFromGltf({ worldMatrix: node3D.worldMatrix })
        })
    }

    vertexShader() {
        return `#version 300 es
in vec3 position;
in vec2 uv;

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

out vec2 v_uv;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionViewMatrix * worldPosition;
    v_uv = uv;
}`
    }

    fragmentShader() {
        return `#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D map;       
        
out vec4 outColor;

void main() {
    outColor = texture(map, v_uv);
}`
    }
}
