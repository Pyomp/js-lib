import { GlVao } from "../webgl/glDescriptors/GlVao.js"
import { GlObject } from "../webgl/glDescriptors/GlObject.js"
import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { GlAttribute } from "../webgl/glDescriptors/GlAttribute.js"
import { GlArrayBuffer } from "../webgl/glDescriptors/GlArrayBuffer.js"
import { GlTexture } from "../webgl/glDescriptors/GlTexture.js"

export class TextureObject extends GlObject {
    /**
     * 
     * @param {GlTexture} texture 
     */
    constructor(texture) {
        super({
            drawMode: 'TRIANGLES',
            normalBlending: true,
            depthWrite: false,
            depthTest: false,
            glVao: new GlVao([
                new GlAttribute({
                    glArrayBuffer: new GlArrayBuffer(new Float32Array([
                        -1, -1,
                        1, -1,
                        -1, 1,
                        1, 1,
                    ])),
                    name: 'position', size: 2
                }),
                new GlAttribute({
                    glArrayBuffer: new GlArrayBuffer(new Float32Array([
                        0, 0,
                        1, 0,
                        0, 1,
                        1, 1,
                    ])),
                    name: 'uv', size: 2
                })],
                new Uint16Array([0, 1, 2, 1, 3, 2])),
            glProgram: new GlProgram(
                () =>
                    `#version 300 es
                    precision highp float;
                
                    in vec2 position;
                    in vec2 uv;

                    out vec2 v_uv;

                    void main() {
                        v_uv = uv;
                        gl_Position = vec4(position, 0. ,1.);
                    }`,
                () =>
                    `#version 300 es
                    precision highp float;
                    precision highp int;
                    precision highp sampler2D;

                    in vec2 v_uv;

                    uniform sampler2D map;                            

                    out vec4 outColor;

                    void main() {

                        float red = pow(texture(map, v_uv).r, 1000.);
                        // float f = (0.01 * 2000.) / ((2000. - 0.01) * red - 2000.);
                        outColor = vec4(red, 0.,0., 1.);
                        // outColor = texture(map, v_uv);
                        // outColor = vec4(gl_FragCoord.x / 1000. ,0. ,0.,1.);
                    }`
            ),
            uniforms: {
                map: texture
            }
        })
    }
}
