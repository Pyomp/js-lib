import { Attribute } from "../../../sceneGraph/Attribute.js"
import { GlProgram } from "../../../webgl/GlProgram.js"
import { GlVao } from "../../../webgl/GlVao.js"

export class ParticlesObject {
    constructor(gl, uboIndex, particleCount) {
        this.program = new GlProgram(
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
                gl_PointSize = position.w;
                v_color = color;
            }
            `,
            `#version 300 es
            precision highp float;

            in vec4 v_color;

            out vec4 color;

            void main(){
                color = v_color;
            }
            `,
            { uboIndex }
        )

        this.vao = new GlVao(
            gl,
            this.program.program,
            {
                position: new Attribute(new Float32Array(particleCount * 4)),
                color: new Attribute(new Float32Array(particleCount * 4))
            }
        )
    }
}
