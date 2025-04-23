import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { GlRenderer } from "../webgl/glRenderer/GlRenderer.js"
import { GLSL_AMBIENT_LIGHT } from "./chunks/glslAmbient.js"
import { GLSL_CAMERA } from "./chunks/glslCamera.js"
import { GLSL_COMMON } from "./chunks/glslCommon.js"
import { GLSL_MORPH_TARGET } from "./chunks/glslMorphTarget.js"
import { GLSL_POINT_LIGHT } from "./chunks/glslPointLight.js"
import { GLSL_SKINNED } from "./chunks/glslSkinnedChunk.js"
import { GLSL_UTILS } from "./chunks/glslUtils.js"

function vertexShader({
    pointLightCount,
    isSkinned,
    morphs
}) {
    return `#version 300 es
precision highp float;
precision highp int;

${GLSL_COMMON.vertexDeclaration}
${isSkinned ? GLSL_SKINNED.declaration : ''}
${morphs ? GLSL_MORPH_TARGET.declaration(morphs) : ''}
${GLSL_CAMERA.declaration}

out vec3 v_normal;
out vec3 v_position;
out vec2 v_uv;
out float v_depth;

#define INT_RANGE 2147483647.0

void main() {
    ${isSkinned ? GLSL_SKINNED.computeSkinMatrix : ''}

    vec4 worldPosition = ${GLSL_COMMON.getWorldPosition(
        morphs ? GLSL_MORPH_TARGET.getMorphTargetPosition : GLSL_COMMON.positionAttribute,
        isSkinned ? GLSL_SKINNED.skinMatrix : ''
    )};

    v_position = worldPosition.xyz;

    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * worldPosition;

    float depthRange = ${GLSL_CAMERA.far} - ${GLSL_CAMERA.near};
    float depthRangeHalf = depthRange / 2.;

    v_depth = (gl_Position.z - depthRangeHalf) / (depthRange / INT_RANGE);

    v_normal = ${GLSL_COMMON.getWorldNormal(
        morphs ? GLSL_MORPH_TARGET.getMorphTargetNormal : GLSL_COMMON.normalAttribute,
        isSkinned ? GLSL_SKINNED.skinMatrix : ''
    )};

    v_uv = uv;
}`
}

function fragmentShader({
    pointLightCount,
    isShininessEnable
}) {
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

export class PhongProgram extends GlProgram {
    isShininessEnable = true
    isSkinned = false

    /**
     * 
     * @param {{
     *      renderer: GlRenderer
     *      isShininessEnable?: boolean
     *      isSkinned?: boolean
     *      morphs?: string[]
     * }} param0 
     */
    constructor({
        renderer,
        isShininessEnable = true,
        isSkinned = false,
        morphs,
    }) {
        super(
            () => vertexShader({
                pointLightCount: renderer.pointLightCount,
                isSkinned: this.isSkinned,
                morphs
            }),
            () => fragmentShader({
                pointLightCount: renderer.pointLightCount,
                isShininessEnable: this.isShininessEnable
            })
        )

        this.isShininessEnable = isShininessEnable
        this.isSkinned = isSkinned
    }
}
