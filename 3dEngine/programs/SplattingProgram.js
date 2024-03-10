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

out vec3 v_normal;
out vec3 v_tangent;
out vec3 v_bitangent;

${GLSL_POINT_LIGHT.vertexDeclaration(pointLightCount)}

void main() {

    vec4 worldPosition = ${GLSL_COMMON.worldMatrix} * vec4(position, 1.0);
    
    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * worldPosition;

    v_uv = ${GLSL_COMMON.uvAttribute};

    v_normal = ${GLSL_COMMON.getWorldNormal()};
    v_tangent = ${GLSL_COMMON.getTangent(GLSL_COMMON.worldMatrix, GLSL_CAMERA.viewMatrix, GLSL_COMMON.tangentAttribute)};
    v_bitangent = ${GLSL_COMMON.getBiTangent('v_normal', 'v_tangent', GLSL_COMMON.tangentAttribute)};

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

${GLSL_AMBIENT_LIGHT.fragmentDeclaration}
${GLSL_POINT_LIGHT.fragmentDeclaration(pointLightCount)}
// TODO 
const float shininess = 10.;
const vec3 specular = vec3(0.1);
            
${GLSL_SPLATTING.declaration}

out vec4 outColor;

void main() {
    vec4 splatting = ${GLSL_SPLATTING.getSplatting('v_uv')};
    outColor = ${GLSL_SPLATTING.getColor('v_uv', 'splatting')};
    vec3 normal = ${GLSL_SPLATTING.getNormal('v_normal', 'v_tangent', 'v_bitangent', 'v_uv', 'splatting')};
    normal = normalize(v_normal);
    vec3 pointLightColor;
    float pointLightSpecular;

    ${GLSL_POINT_LIGHT.computePointLight('normal', 'pointLightColor')};

    vec3 lightColor = ${GLSL_AMBIENT_LIGHT.color} + pointLightColor;
    float lightSpecular = pointLightSpecular;

    outColor = vec4(outColor.xyz * lightColor, outColor.a);
    // outColor = vec4(normalize(v_normal), 1.);
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
