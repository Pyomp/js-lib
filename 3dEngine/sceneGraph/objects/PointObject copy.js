import { GLSL_CAMERA } from "../../programs/chunks/glslCamera.js"
import { GLSL_DEFERRED } from "../../programs/chunks/glslDeferred.js"
import { GLSL_UTILS } from "../../programs/chunks/glslUtils.js"
import { GLSL_WINDOW } from "../../programs/chunks/glslWindow.js"
import { GlArrayBuffer } from "../../webgl/glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../../webgl/glDescriptors/GlAttribute.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlProgram } from "../../webgl/glDescriptors/GlProgram.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"

const glProgram = new GlProgram(() => `#version 300 es
#define ATTENUATION 100.0

in vec3 position;

${GLSL_CAMERA.declaration}
${GLSL_WINDOW.declaration}

out vec4 v_color;
out vec3 v_ViewCenter;

uniform float u_radius;

void main() {
    vec4 viewPos  = ${GLSL_CAMERA.viewMatrix} * vec4(position, 1.0);

    v_ViewCenter = viewPos.xyz;

    float pixelDiameter = (u_radius *  ${GLSL_WINDOW.resolution}.y) / (-viewPos.z * ${GLSL_CAMERA.fovTanHalf});

    gl_Position = ${GLSL_CAMERA.projectionMatrix} * viewPos;
    gl_PointSize = pixelDiameter;
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

uniform float u_radius;

in vec4 v_color;
in vec3 v_ViewCenter;

out vec4 color;

void main(){
    // normalized coordinates inside the point sprite [-1, 1]
    vec2 uv = 2.0 * gl_PointCoord - 1.0;
    float r2 = dot(uv, uv);
    if (r2 > 1.0) discard;

    // Sphere equation: x^2 + y^2 + z^2 = r^2
    float z = sqrt(1.0 - r2); 

    vec3 normal = vec3(uv, z);
    vec3 fragViewPos  = v_ViewCenter + u_radius * normal;

    // compute sphere gl_FragDepth
    float zScale = ${GLSL_CAMERA.projectionMatrix}[2][2];
    float zOffset = ${GLSL_CAMERA.projectionMatrix}[3][2];
    float ndcDepth = (zScale * fragViewPos.z + zOffset) / -fragViewPos.z;
    gl_FragDepth = ndcDepth * 0.5 + 0.5;
    
    
    float linearDepth = (-fragViewPos.z - ${GLSL_CAMERA.near}) / (${GLSL_CAMERA.far} - ${GLSL_CAMERA.near});

    color = vec4(1.0, 1.0, 1.0, .5); // white sphere
}
`)


export class PointObject extends GlObject {
    constructor(
        /** 
         * @type {{
         *      position: Float32Array
         *      inDeferredColorTexture: GlTexture
         *      inDeferredPositionTexture: GlTexture
         *      inDeferredNormalTexture: GlTexture
         * }}
        */
        {
            position,
            inDeferredColorTexture,
            inDeferredPositionTexture,
            inDeferredNormalTexture
        }
    ) {
        const glArrayBuffer = new GlArrayBuffer(position)

        const glVao = new GlVao(
            [
                new GlAttribute({
                    glArrayBuffer,
                    name: 'position',
                    size: 3,
                    type: WebGL2RenderingContext.FLOAT,
                })
            ]
        )


        super({
            drawMode: 'POINTS',
            // additiveBlending: true,
            normalBlending: true,
            // depthWrite: false,
            glVao,
            glProgram,
            uniforms: {
                u_radius: 0.2,
                ...GLSL_DEFERRED.createUserUniform(inDeferredColorTexture, inDeferredPositionTexture, inDeferredNormalTexture)
            }
        })

        this.glVao?.boundingBox.makeInfinity()
    }
}
