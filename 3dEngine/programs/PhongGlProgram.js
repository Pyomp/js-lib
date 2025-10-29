import { GlArrayBuffer } from "../webgl/glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../webgl/glDescriptors/GlAttribute.js"
import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { GlTexture } from "../webgl/glDescriptors/GlTexture.js"
import { GlRenderer } from "../webgl/glRenderer/GlRenderer.js"
import { GLSL_AMBIENT_LIGHT } from "./chunks/glslAmbient.js"
import { GLSL_CAMERA } from "./chunks/glslCamera.js"
import { GLSL_COMMON } from "./chunks/glslCommon.js"
import { GLSL_POINT_LIGHT } from "./chunks/glslPointLight.js"

function vertexShader(
    /** @type {WebGl.RenderingContext} */ context
) {
    return `#version 300 es
${GLSL_CAMERA.declaration}
${GLSL_COMMON.vertexDeclaration}
${GLSL_POINT_LIGHT.vertexDeclaration()}

out vec2 v_uv;
out vec3 v_normal;

void main() {
    vec4 worldPosition = ${GLSL_COMMON.getWorldPosition(GLSL_COMMON.positionAttribute)};
    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * worldPosition;
    v_uv = uv;
    v_normal = ${GLSL_COMMON.normalAttribute};
    ${GLSL_POINT_LIGHT.computeVarying('worldPosition', GLSL_CAMERA.position)};
}`
}

function fragmentShader(
    /** @type {WebGl.RenderingContext} */ context
) {
    return `#version 300 es
precision highp float;

in vec2 v_uv;
in vec3 v_normal;

${GLSL_CAMERA.declaration}
${GLSL_AMBIENT_LIGHT.fragmentDeclaration}
${GLSL_POINT_LIGHT.fragmentDeclaration(context.pointLightCount)}
${GLSL_COMMON.fragmentDeclaration}

out vec4 outColor;

void main() {
    vec3 normal = normalize(v_normal);
    vec4 color = texture(${GLSL_COMMON.baseTexture}, v_uv);
    vec3 pointLightColor;
    float pointLightSpecular;
    ${GLSL_POINT_LIGHT.computePointLight(undefined, 'normal', 'shininess', 'pointLightColor', 'pointLightSpecular')}
    color.rgb *= ${GLSL_AMBIENT_LIGHT.color} + pointLightColor;
    outColor = color;
}`
}

export class PhongGlProgram extends GlProgram {
    static createAttributes(
    /** @type {Float32Array} */ position,
    /** @type {Float32Array} */ uv,
    ) {
        return [
            new GlAttribute({ glArrayBuffer: new GlArrayBuffer(position), name: GLSL_COMMON.positionAttribute, size: 3, type: WebGL2RenderingContext.FLOAT }),
            new GlAttribute({ glArrayBuffer: new GlArrayBuffer(uv), name: GLSL_COMMON.uvAttribute, size: 2, type: WebGL2RenderingContext.FLOAT }),
        ]
    }

    static createUniforms(
        /** @type {Matrix4} */ worldMatrix,
        /** @type {GlTexture} */ baseTexture,
    ) {
        return GLSL_COMMON.createUniforms(worldMatrix, baseTexture)
    }

    constructor() {
        super(vertexShader, fragmentShader)
    }
}
