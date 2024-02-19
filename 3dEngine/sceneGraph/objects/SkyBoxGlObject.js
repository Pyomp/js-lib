import { GLSL_CAMERA } from "../../programs/chunks/glslCamera.js"
import { GlArrayBuffer } from "../../webgl/glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../../webgl/glDescriptors/GlAttribute.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlProgram } from "../../webgl/glDescriptors/GlProgram.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"

const glProgramData = new GlProgram(
    () => `#version 300 es
in vec2 position;
out vec4 v_position;
void main() {
    v_position = vec4(position, 1.0, 1.0);
    gl_Position = v_position;
}`,

    () => `#version 300 es
precision highp float;

uniform samplerCube skyBox;

${GLSL_CAMERA.declaration}

in vec4 v_position;

out vec4 outColor;

void main() {
    vec4 t = ${GLSL_CAMERA.projectionViewMatrixInverse} * v_position;
    outColor = texture(skyBox, normalize(t.xyz / t.w));
}`)

const glVaoData = new GlVao([
    new GlAttribute({
        name: 'position',
        size: 2,
        type: 'FLOAT',
        glArrayBuffer: new GlArrayBuffer(new Float32Array(
            [
                -1, -1,
                1, -1,
                -1, 1,
                -1, 1,
                1, -1,
                1, 1
            ]
        ))
    })
])

export class SkyBoxGlObject extends GlObject {
    constructor(
    /** @type {URL | HTMLImageElement} */ positiveX,
    /** @type {URL | HTMLImageElement} */ negativeX,
    /** @type {URL | HTMLImageElement} */ positiveY,
    /** @type {URL | HTMLImageElement} */ negativeY,
    /** @type {URL | HTMLImageElement} */ positiveZ,
    /** @type {URL | HTMLImageElement} */ negativeZ,
    ) {
        const uniforms = {
            skyBox: new GlTexture({
                data: [
                    positiveX,
                    negativeX,
                    positiveY,
                    negativeY,
                    positiveZ,
                    negativeZ,
                ]
            })
        }

        super({
            glProgram: glProgramData,
            glVao: glVaoData,
            uniforms,
            count: 6,
            drawMode: WebGL2RenderingContext.TRIANGLES,
            depthFunc: WebGL2RenderingContext.LEQUAL
        })
    }
}
