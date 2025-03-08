import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { GlRenderer } from "../webgl/glRenderer/GlRenderer.js"
import { GLSL_AMBIENT_LIGHT } from "./chunks/glslAmbient.js"
import { GLSL_CAMERA } from "./chunks/glslCamera.js"
import { GLSL_COMMON } from "./chunks/glslCommon.js"
import { GLSL_MORPH_TARGET } from "./chunks/glslMorphTarget.js"
import { GLSL_POINT_LIGHT } from "./chunks/glslPointLight.js"
import { GLSL_SKINNED } from "./chunks/glslSkinnedChunk.js"

function vertexShader({
    pointLightCount,
    isSkinned,
    morphs
}) {
    return `#version 300 es
${GLSL_COMMON.vertexDeclaration}
${isSkinned ? GLSL_SKINNED.declaration : ''}
${morphs ? GLSL_MORPH_TARGET.declaration(morphs) : ''}
${GLSL_CAMERA.declaration}
${GLSL_POINT_LIGHT.vertexDeclaration(pointLightCount)}

out vec3 v_normal;
out vec2 v_uv;

void main() {
    ${isSkinned ? GLSL_SKINNED.computeSkinMatrix : ''}

    vec4 worldPosition = ${GLSL_COMMON.getWorldPosition(
        morphs ? GLSL_MORPH_TARGET.getMorphTargetPosition : GLSL_COMMON.positionAttribute,
        isSkinned ? GLSL_SKINNED.skinMatrix : ''
    )};
    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * worldPosition;

    v_normal = ${GLSL_COMMON.getWorldNormal(
        morphs ? GLSL_MORPH_TARGET.getMorphTargetNormal : GLSL_COMMON.normalAttribute,
        isSkinned ? GLSL_SKINNED.skinMatrix : ''
    )};

    v_uv = uv;

    ${GLSL_POINT_LIGHT.computeVarying('worldPosition', GLSL_CAMERA.position, pointLightCount)}
}`
}

function fragmentShader({
    pointLightCount,
    isShininessEnable
}) {
    return `#version 300 es
    precision highp float;
    
    in vec2 v_uv;
    in vec3 v_normal;
    
    ${GLSL_COMMON.fragmentDeclaration}
    ${GLSL_AMBIENT_LIGHT.fragmentDeclaration}
    ${GLSL_POINT_LIGHT.fragmentDeclaration(pointLightCount, isShininessEnable)}
    
    uniform vec3 specular;
    uniform float ${GLSL_COMMON.alphaTest};

    layout(location = 0) out vec4 outColor;
    layout(location = 1) out vec3 outNormal;

    // layout(location = 1) out float outDepth;
    // layout(location = 0) out float outDepth;
    layout(location = 2) out float outDepth;
    
    void main() {
        vec3 normal = normalize(v_normal);
        outNormal = normal;
        // outNormal = vec3(255., 0.,0.);
        outDepth = gl_FragCoord.z;

        vec3 pointLightColor;
        ${isShininessEnable ? 'float pointLightSpecular;' : ''}

        ${pointLightCount > 0 ? GLSL_POINT_LIGHT.computePointLight('normal', 'pointLightColor', isShininessEnable ? 'pointLightSpecular;' : '') : ''}
        
        vec3 lightColor = ${GLSL_AMBIENT_LIGHT.color} + pointLightColor;

        ${isShininessEnable ? 'float lightSpecular = pointLightSpecular;' : ''}

        vec4 color = texture(${GLSL_COMMON.baseTexture}, v_uv);
        outColor = color;
        // outNormal = color.rgb;
        // color.xyz += ${GLSL_COMMON.baseColor};

        // outColor = vec4(color.xyz * lightColor ${isShininessEnable ? ' + lightSpecular * specular' : ''}, color.a);

        // if(outColor.a < ${GLSL_COMMON.alphaTest}) discard;
        // 
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
