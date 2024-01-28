import { GlProgramData } from "../webgl/glDescriptors/GlProgramData.js"
import { GlRenderer } from "../webgl/glRenderer/GlRenderer.js"
import { GLSL_AMBIENT_LIGHT } from "./chunks/glslAmbient.js"
import { GLSL_CAMERA } from "./chunks/glslCamera.js"
import { GLSL_COMMON } from "./chunks/glslCommon.js"
import { GLSL_POINT_LIGHT } from "./chunks/glslPointLight.js"
import { GLSL_SKINNED } from "./chunks/glslSkinnedChunk.js"

function vertexShader({
    pointLightCount,
    isSkinned
}) {
    return `#version 300 es
${GLSL_COMMON.vertexDeclaration}
${isSkinned ? GLSL_SKINNED.declaration : ''}
${GLSL_CAMERA.declaration}
${GLSL_POINT_LIGHT.vertexDeclaration(pointLightCount)}

out vec3 v_normal;
out vec2 v_uv;

void main() {
    ${isSkinned ? GLSL_SKINNED.computeSkinMatrix : ''}
    
    vec4 worldPosition = ${GLSL_COMMON.getWorldPosition(isSkinned ? GLSL_SKINNED.skinMatrix : '')};
    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * worldPosition;

    v_normal = ${GLSL_COMMON.getWorldNormal(isSkinned ? GLSL_SKINNED.skinMatrix : '')};
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

    out vec4 outColor;
    
    void main() {
        vec3 normal = normalize(v_normal);

        vec3 pointLightColor;
        ${isShininessEnable ? 'float pointLightSpecular;' : ''}

        ${pointLightCount > 0 ? GLSL_POINT_LIGHT.computePointLight('normal', 'pointLightColor', isShininessEnable ? 'pointLightSpecular;' : '') : ''}
        
        vec3 lightColor = ${GLSL_AMBIENT_LIGHT.color} + pointLightColor;

        ${isShininessEnable ? 'float lightSpecular = pointLightSpecular;' : ''}

        vec4 color = texture(${GLSL_COMMON.baseTexture}, v_uv);

        outColor = vec4(color.xyz * lightColor ${isShininessEnable ? ' + lightSpecular * specular' : ''}, color.a);
    }`
}

export class PhongProgram extends GlProgramData {
    isShininessEnable = true
    isSkinned = false

    /**
     * 
     * @param {{
     *      renderer: GlRenderer
     *      isShininessEnable: boolean
     *      isSkinned: boolean
     * }} param0 
     */
    constructor({
        renderer,
        isShininessEnable = true,
        isSkinned = false,
    }) {
        super(
            () => vertexShader({
                pointLightCount: renderer.pointLightCount,
                isSkinned: this.isSkinned
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
