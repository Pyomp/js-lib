import { GLSL_CAMERA } from "../../programs/chunks/glslCamera.js"
import { GlArrayBufferData } from "../../webgl/glDescriptors/GlArrayBufferData.js"
import { GlAttributeData } from "../../webgl/glDescriptors/GlAttributeData.js"
import { GlObjectData } from "../../webgl/glDescriptors/GlObjectData.js"
import { GlProgramData } from "../../webgl/glDescriptors/GlProgramData.js"
import { GlTextureData } from "../../webgl/glDescriptors/GlTextureData.js"
import { GlVaoData } from "../../webgl/glDescriptors/GlVaoData.js"

export class SkyBoxGlObject extends GlObjectData {
    constructor(images) {
        const glProgramData = new GlProgramData(
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

        const glVaoData = new GlVaoData([
            new GlAttributeData({
                name: 'position',
                size: 2,
                type: 'FLOAT',
                glArrayBufferData: new GlArrayBufferData(new Float32Array(
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

        const uniforms = {
            skyBox: new GlTextureData({
                data: images
            })
        }

        super({
            glProgramData,
            glVaoData,
            uniforms,
            count: 6,
            drawMode: WebGL2RenderingContext.TRIANGLES,
            depthFunc: WebGL2RenderingContext.LEQUAL
        })
    }
}
