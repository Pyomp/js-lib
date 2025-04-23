import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { GLSL_CAMERA } from "./chunks/glslCamera.js"
import { GLSL_COMMON } from "./chunks/glslCommon.js"
import { GLSL_SKINNED } from "./chunks/glslSkinnedChunk.js"

function vertexShader() {
    return `#version 300 es
precision highp float;
precision highp int;

${GLSL_COMMON.vertexDeclaration}
${GLSL_SKINNED.declaration}
${GLSL_CAMERA.declaration}

out vec3 v_normal;
out vec3 v_position;
out vec2 v_uv;
out float v_depth;

#define INT_RANGE 2147483647.0

void main() {
    ${GLSL_SKINNED.computeSkinMatrix}

    vec4 worldPosition = ${GLSL_SKINNED.skinMatrix} * vec4(${GLSL_COMMON.positionAttribute}, 1.0);    

    v_position = worldPosition.xyz;

    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * worldPosition;

    float depthRange = ${GLSL_CAMERA.far} - ${GLSL_CAMERA.near};
    float depthRangeHalf = depthRange / 2.;

    v_depth = (gl_Position.z - depthRangeHalf) / (depthRange / INT_RANGE);

    v_normal = mat3(${GLSL_SKINNED.skinMatrix}) * ${GLSL_COMMON.normalAttribute};
    
    v_uv = uv;
}`
}

function fragmentShader() {
    return `#version 300 es
    precision highp float;
    precision highp int;
    
    in vec2 v_uv;
    in vec3 v_normal;
    in vec3 v_position;
    in float v_depth;
    
    ${GLSL_CAMERA.declaration}
    ${GLSL_COMMON.fragmentDeclaration}
    
    uniform vec3 specular;
    uniform float ${GLSL_COMMON.alphaTest};

    layout(location = 0) out vec3 outColor;
    layout(location = 1) out ivec4 outPosition;
    layout(location = 2) out ivec4 outNormal;
    layout(location = 3) out float outDepth; // not used
    layout(location = 4) out int outStencil; // not used
    
    #define INT_RANGE 2147483647.0

    void main() {
        vec4 color = texture(${GLSL_COMMON.baseTexture}, v_uv);
        if(color.a < ${GLSL_COMMON.alphaTest}) discard;
        outColor = color.xyz;
        outPosition = ivec4(v_position * 1000., v_depth);
        outNormal = ivec4(normalize(v_normal) * INT_RANGE, 1);
        outDepth = gl_FragCoord.z;
        outStencil = 0;
    }`
}

export class HairDeferredProgram extends GlProgram {
    constructor() {
        super(
            vertexShader,
            fragmentShader
        )
    }
}
