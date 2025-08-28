import { Matrix4 } from "../../../math/Matrix4.js"
import { GLSL_CAMERA } from "../../programs/chunks/glslCamera.js"
import { GLSL_COMMON } from "../../programs/chunks/glslCommon.js"
import { GLSL_DEFERRED } from "../../programs/chunks/glslDeferred.js"
import { GLSL_POINT } from "../../programs/chunks/glslPoint.js"
import { GLSL_UTILS } from "../../programs/chunks/glslUtils.js"
import { GLSL_WINDOW } from "../../programs/chunks/glslWindow.js"
import { GlArrayBuffer } from "../../webgl/glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../../webgl/glDescriptors/GlAttribute.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlProgram } from "../../webgl/glDescriptors/GlProgram.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"
import { GlRenderer } from "../../webgl/glRenderer/GlRenderer.js"

const glProgram = new GlProgram(() => `#version 300 es
#define ATTENUATION 100.0

in vec3 position;
in vec4 color;
in float size;

${GLSL_CAMERA.declaration}
${GLSL_WINDOW.declaration}
${GLSL_POINT.vertexDeclaration}

uniform mat4 worldMatrix;

out vec4 v_color;
out vec3 v_ViewCenter;
out float v_radius;

void main() {
    vec4 viewPos  = ${GLSL_CAMERA.viewMatrix} * worldMatrix * vec4(position, 1.0);

    v_ViewCenter = viewPos.xyz;
    
    v_radius = size / 2.;
    v_color = color;

    gl_Position = ${GLSL_CAMERA.projectionMatrix} * viewPos;
    gl_PointSize = ${GLSL_POINT.getPixelDiameter('v_radius', 'viewPos.z')};
}
`,
    () => `#version 300 es
precision highp float;
precision highp sampler2D;
precision highp isampler2D;

${GLSL_CAMERA.declaration}
${GLSL_WINDOW.declaration}
${GLSL_UTILS.linearizeDepth.declaration(GLSL_CAMERA.near, GLSL_CAMERA.far)}
${GLSL_UTILS.linearDepthToGl.declaration(GLSL_CAMERA.near, GLSL_CAMERA.far)}
${GLSL_DEFERRED.fragmentUserDeclaration}
${GLSL_POINT.fragmentDeclaration}

in vec4 v_color;
in vec3 v_ViewCenter;
in float v_radius;

out vec4 color;

void main(){
    vec3 sphereNormal = ${GLSL_POINT.getDiscardAndGetSphereNormal()};

    vec3 fragViewPos  = v_ViewCenter + v_radius * sphereNormal;

    ${GLSL_POINT.computeFragDepth('fragViewPos.z')};
    
    vec2 screenUv =${GLSL_POINT.getScreenUV()};
    ivec2 screenTexelCoord = ${GLSL_DEFERRED.getTexelCoord('screenUv')};
    float opaqueDepth = ${GLSL_DEFERRED.getDeferredPositionDepth('screenTexelCoord')}.w;

    float l = ${GLSL_POINT.getDeltaDepth('opaqueDepth', 'fragViewPos.z', 'v_radius')};

    float softAlpha = ${GLSL_POINT.getSoftAlpha('l')};

    float alpha = sphereNormal.z * softAlpha;

    color = vec4(v_color * alpha);
}
`)


export class PointsGlObject extends GlObject {
    constructor(
        /** 
         * @type {{
         *      positions: Float32Array
         *      colors: Float32Array
         *      sizes: Float32Array
         *      worldMatrix: Matrix4
         *      deferredTextures: GlRenderer['deferredTextures']
         * }}
        */
        {
            positions,
            colors,
            sizes,
            worldMatrix,
            deferredTextures
        }
    ) {
        const glVao = new GlVao(
            [
                new GlAttribute({
                    glArrayBuffer: new GlArrayBuffer(positions),
                    name: 'position',
                    size: 3,
                    type: WebGL2RenderingContext.FLOAT,
                }),
                new GlAttribute({
                    glArrayBuffer: new GlArrayBuffer(colors),
                    name: 'color',
                    size: 4,
                    type: WebGL2RenderingContext.FLOAT,
                }),
                new GlAttribute({
                    glArrayBuffer: new GlArrayBuffer(sizes),
                    name: 'size',
                    size: 1,
                    type: WebGL2RenderingContext.FLOAT,
                })
            ]
        )


        super({
            drawMode: 'POINTS',
            additiveBlending: true,
            // normalBlending: true, 
            depthWrite: false,
            // depthTest: false, 
            glVao,
            glProgram,
            uniforms: {
                worldMatrix,
                ...GLSL_DEFERRED.createUserUniform(deferredTextures)
            }
        })

        this.glVao?.boundingBox.makeInfinity()
    }
}
