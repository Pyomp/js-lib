import { GlArrayBuffer } from "../webgl/glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../webgl/glDescriptors/GlAttribute.js"
import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { GlTexture } from "../webgl/glDescriptors/GlTexture.js"
import { GLSL_CAMERA } from "./chunks/glslCamera.js"
import { GLSL_COMMON } from "./chunks/glslCommon.js"

function vertexShader() {
    return `#version 300 es
${GLSL_CAMERA.declaration}
${GLSL_COMMON.vertexDeclaration}

out vec2 v_uv;

void main() {
    vec4 worldPosition = ${GLSL_COMMON.getWorldPosition(GLSL_COMMON.positionAttribute)};
    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * worldPosition;
    v_uv = uv;
}`
}

function fragmentShader() {
    return `#version 300 es
precision highp float;

in vec2 v_uv;

${GLSL_COMMON.fragmentDeclaration}

out vec4 outColor;

void main() {
    vec4 color = texture(${GLSL_COMMON.baseTexture}, v_uv);
    outColor = color;
}`
}

export class BasicGlProgram extends GlProgram {
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
