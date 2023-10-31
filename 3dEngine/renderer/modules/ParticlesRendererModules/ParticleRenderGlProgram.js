import { GlProgram } from "../../../webgl/GlProgram.js"

export class ParticleRenderGlProgram extends GlProgram {
    constructor(gl, uboIndex) {
        super(
            gl,
            `#version 300 es

            in vec4 position; // .w is size
            in vec4 color;

            out vec4 v_color;

            uniform cameraUbo {
                mat4 projectionViewMatrix;
                vec3 cameraPosition;
            };

            void main(){
                gl_Position = projectionViewMatrix * vec4(position.xyz, 1.);
                gl_PointSize = position.w * 100. / gl_Position.z;
                if(gl_PointSize < 0.01) {
                    gl_Position.x = 100.;
                    gl_Position.w = 1.;
                }
                v_color = color;
            }
            `,
            `#version 300 es
            precision highp float;

            in vec4 v_color;

            uniform sampler2D map;

            out vec4 color;

            void main(){
                if(v_color.a < 0.01) discard;
                color = texture(map, gl_PointCoord.xy) * v_color;
                // color = vec4(1., 0., 0., 1.);
            }
            `,
            { uboIndex }
        )
    }
}
