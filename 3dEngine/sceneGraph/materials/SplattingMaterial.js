import { Geometry } from "../Geometry.js"
import { Texture } from "../Texture.js"

/**
 * @implements {MaterialGltf}
 */
export class SplattingMaterial {
    needsDelete = false
    createGeometry(
        /** @type {Float32Array} */ positionAttributeBuffer,
        /** @type {Float32Array} */ uvAttributeBuffer,
        /** @type {Float32Array} */ normalAttributeBuffer,
        /** @type {Float32Array} */ tangentAttributeBuffer,
        /** @type {number} */ count,
        /** @type {Uint8Array | Uint16Array | Uint32Array} */ indices
    ) {
        const attributes = {
            position: positionAttributeBuffer,
            uv: uvAttributeBuffer,
            normal: normalAttributeBuffer,
            tangent: tangentAttributeBuffer,
        }

        return new Geometry(count, attributes, indices)
    }

    createGeometryFromGltf(/** @type {GltfPrimitive} */ gltfPrimitive) {
        return this.createGeometry(
            gltfPrimitive.attributes.POSITION.buffer,
            gltfPrimitive.attributes.TEXCOORD_0.buffer,
            gltfPrimitive.attributes.NORMAL.buffer,
            gltfPrimitive.attributes.TANGENT.buffer,
            gltfPrimitive.indices.count,
            gltfPrimitive.indices.buffer,
        )
    }

    createTextures(
        /** @type {HTMLImageElement} */ splattingImage,
        /** @type {HTMLImageElement} */ image1,
        /** @type {HTMLImageElement} */ normalImage1,
        /** @type {HTMLImageElement} */ image2,
        /** @type {HTMLImageElement} */ normalImage2,
        /** @type {HTMLImageElement} */ image3,
        /** @type {HTMLImageElement} */ normalImage3,
        /** @type {HTMLImageElement} */ image4,
        /** @type {HTMLImageElement} */ normalImage4,
    ) {
        return {
            mapSplatting: new Texture({ data: splattingImage }),
            map1: new Texture({ data: image1 }),
            normalMap1: new Texture({ data: normalImage1 }),
            map2: new Texture({ data: image2 }),
            normalMap2: new Texture({ data: normalImage2 }),
            map3: new Texture({ data: image3 }),
            normalMap3: new Texture({ data: normalImage3 }),
            map4: new Texture({ data: image4 }),
            normalMap4: new Texture({ data: normalImage4 }),
        }
    }

    createUniforms(
        /** @type {Matrix4} */ worldMatrix,
        /** @type {Matrix3} */ normalMatrix,
        /** @type {Vector2} */ map1Scale,
        /** @type {Vector2} */ map2Scale,
        /** @type {Vector2} */ map3Scale,
        /** @type {Vector2} */ map4Scale
    ) {
        return {
            modelMatrix: worldMatrix,
            normalMatrix,
            map1Scale,
            map2Scale,
            map3Scale,
            map4Scale,
        }
    }

    vertexShader() {
        return `#version 300 es
in vec3 position;
in vec2 uv;
in vec3 normal;
in vec4 tangent;

layout(std140) uniform cameraUbo {
    mat4 viewMatrix;
    mat4 projectionMatrix;
    mat4 projectionViewMatrix;
    vec3 cameraPosition;
    float near;
    float far;
};

uniform mat4 modelMatrix;
uniform mat3 normalMatrix;

out vec2 v_uv;

out vec3 v_normal;
out vec3 v_tangent;
out vec3 v_bitangent;

out vec3 v_surfaceToView;
out vec3 v_worldPosition;

void main() {

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    
    gl_Position = projectionViewMatrix * worldPosition;

    v_uv = uv;

    v_normal = normalize( normalMatrix * normal );
    v_tangent = normalize( ( modelMatrix * viewMatrix * vec4( tangent.xyz, 0.0 ) ).xyz );
    v_bitangent = normalize( cross( v_normal, v_tangent ) * tangent.w );

    v_worldPosition = worldPosition.xyz;
    v_surfaceToView = cameraPosition - v_worldPosition;
}`
    }

    fragmentShader({ pointLightCount }) {
        return `#version 300 es
precision highp float;
precision highp sampler2D;

${pointLightCount > 0 ? '#define POINT_LIGHT' : ''}

in vec2 v_uv;
in vec3 v_surfaceToView;
in vec3 v_worldPosition;
in vec3 v_normal;
in vec3 v_tangent;
in vec3 v_bitangent;
            
// TODO
const vec3 specular = vec3(0.1);
// TODO
const float shininess = 10.;

uniform sampler2D mapSplatting;

uniform sampler2D map1;
uniform sampler2D normalMap1;
uniform vec2 map1Scale;

uniform sampler2D map2;
uniform sampler2D normalMap2;
uniform vec2 map2Scale;

uniform sampler2D map3;
uniform sampler2D normalMap3;
uniform vec2 map3Scale;  

uniform sampler2D map4;
uniform sampler2D normalMap4;
uniform vec2 map4Scale;           

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

        vec3 distance = pointLight.position - v_worldPosition;
        float distanceLength = length(distance);
        vec3 L = distance / distanceLength;

        float lambertian = max(dot(normal, L) * pointLight.intensity / sqrt(distanceLength), 0.0);
        color += lambertian * pointLight.color;

        vec3 R = reflect(-L, normal); // Reflected light vector
        vec3 V = normalize(v_surfaceToView); // Vector to viewer

        float specAngle = max(dot(R, V) * pointLight.intensity / sqrt(distanceLength*100.), 0.0);
        specular += pow(specAngle, shininess);
    }
}
#endif

void main() {
    vec4 splatting = texture(mapSplatting, v_uv);
    splatting.a = 1. - splatting.a;
    splatting = normalize(splatting);

    outColor = texture(map1, v_uv * map1Scale) * splatting.r + 
                texture(map2, v_uv * map2Scale) * splatting.g + 
                texture(map3, v_uv * map3Scale) * splatting.b + 
                texture(map4, v_uv * map4Scale) * splatting.a;

    vec3 normal = normalize(v_normal);

    mat3 tbn = mat3( normalize( v_tangent ), normalize( v_bitangent ), normal );

    vec3 normalMap = texture(normalMap1, v_uv * map1Scale).xyz * splatting.r + 
                    texture(normalMap2, v_uv * map2Scale).xyz * splatting.g + 
                    texture(normalMap3, v_uv * map3Scale).xyz * splatting.b + 
                    texture(normalMap4, v_uv * map4Scale).xyz * splatting.a;

    normalMap = normalize(normalMap) * 2.0 - 1.0;
    normal = normalize( tbn * normalMap );

    // TODO
    vec3 ambientLight = vec3(0.4);

    vec3 pointLightColor;
    float pointLightSpecular;

    #ifdef POINT_LIGHT
    calcPointLight(normal, pointLightColor, pointLightSpecular);
    #endif

    vec3 lightColor = ambientLight + pointLightColor;
    float lightSpecular = pointLightSpecular;

    outColor = vec4(outColor.xyz * lightColor + lightSpecular * specular, outColor.a);
}`
    }
}
