import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { GlRenderer } from "../webgl/glRenderer/GlRenderer.js"
import { GLSL_AMBIENT_LIGHT } from "./chunks/glslAmbient.js"
import { GLSL_CAMERA } from "./chunks/glslCamera.js"
import { GLSL_COMMON } from "./chunks/glslCommon.js"
import { GLSL_POINT_LIGHT } from "./chunks/glslPointLight.js"
import { GLSL_SPLATTING } from "./chunks/glslSplatting.js"

function vertexShader(pointLightCount) {
    return `#version 300 es
in vec3 ${GLSL_COMMON.positionAttribute};
in vec2 ${GLSL_COMMON.uvAttribute};
in vec3 ${GLSL_COMMON.normalAttribute};
in vec4 ${GLSL_COMMON.tangentAttribute};

${GLSL_CAMERA.declaration}

uniform mat4 ${GLSL_COMMON.worldMatrix};
uniform mat3 ${GLSL_COMMON.normalMatrix};

out vec2 v_uv;
out vec3 v_position;
out float v_depth;

out vec3 v_normal;
out vec3 v_tangent;
out vec3 v_bitangent;

${GLSL_POINT_LIGHT.vertexDeclaration(pointLightCount)}

#define INT_RANGE 2147483647.0

void main() {

    vec4 worldPosition = ${GLSL_COMMON.worldMatrix} * vec4(position, 1.0);

    v_position = worldPosition.xyz;

    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * worldPosition;

    v_uv = ${GLSL_COMMON.uvAttribute};

    v_normal = ${GLSL_COMMON.getWorldNormal(GLSL_COMMON.normalAttribute)};
    v_tangent = ${GLSL_COMMON.getTangent(GLSL_COMMON.worldMatrix, GLSL_CAMERA.viewMatrix, GLSL_COMMON.tangentAttribute)};
    v_bitangent = ${GLSL_COMMON.getBiTangent('v_normal', 'v_tangent', GLSL_COMMON.tangentAttribute)};

    float depthRange = ${GLSL_CAMERA.far} - ${GLSL_CAMERA.near};
    float depthRangeHalf = depthRange / 2.;
    v_depth = (gl_Position.z - depthRangeHalf) / (depthRange / INT_RANGE);

    ${GLSL_POINT_LIGHT.computeVarying('worldPosition', GLSL_CAMERA.position, pointLightCount)}
}`
}

function fragmentShader(pointLightCount) {
    return `#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 v_uv;
in vec3 v_normal;
in vec3 v_tangent;
in vec3 v_bitangent;
in vec3 v_position;
in float v_depth;

${GLSL_AMBIENT_LIGHT.fragmentDeclaration}
${GLSL_POINT_LIGHT.fragmentDeclaration(pointLightCount)}
// TODO 
const float shininess = 10.;
const vec3 specular = vec3(0.1);
            
${GLSL_SPLATTING.declaration}

layout(location = 0) out vec3 outColor;
layout(location = 1) out ivec4 outPosition;
layout(location = 2) out ivec4 outNormal;
layout(location = 3) out float outDepth; // not used
layout(location = 4) out int outStencil; // not used

#define INT_RANGE 2147483647.0

void main() {
    vec4 splatting = ${GLSL_SPLATTING.getSplatting('v_uv')};
    outColor = ${GLSL_SPLATTING.getColor('v_uv', 'splatting')}.rgb;
    vec3 normal = ${GLSL_SPLATTING.getNormal('v_normal', 'v_tangent', 'v_bitangent', 'v_uv', 'splatting')};
    outNormal = ivec4(normalize(normal) * INT_RANGE, 1);
    outPosition = ivec4(v_position * 1000., gl_FragCoord.z * INT_RANGE);
}`
}

export class GlSplattingProgram extends GlProgram {

    /**
     * 
     * @param {GlRenderer} renderer 
     */
    constructor(renderer) {
        super(
            () => vertexShader(renderer.pointLightCount),
            () => fragmentShader(renderer.pointLightCount)
        )
    }
}
