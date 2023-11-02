import { GlProgram } from "../../../webgl/GlProgram.js"

export class ParticleRenderGlProgram extends GlProgram {
    constructor(gl, uboIndex) {
        super(
            gl,
            `#version 300 es
            precision highp float;
            precision highp sampler2D;

            in vec4 position; // .w is size
            in vec4 color;

            out vec4 v_color;

            uniform cameraUbo {
                mat4 viewMatrix;
                mat4 projectionMatrix;
                mat4 projectionViewMatrix;
                vec3 cameraPosition;
                float near;
                float far;
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
            `,////////////////////////////////
            `#version 300 es
            precision highp float;
            precision highp sampler2D;

            in vec4 v_color;

            uniform sampler2D map;
            uniform sampler2D depthMap;

            layout(std140) uniform cameraUbo {
                mat4 viewMatrix;
                mat4 projectionMatrix;
                mat4 projectionViewMatrix;
                vec3 cameraPosition;
                float near;
                float far;
            };

            layout(std140) uniform windowUbo {
                vec2 resolution;
                vec2 mouse;
            };

            out vec4 color;

            float depthBetter(float depth){
                return (near * far) / ((far - near) * depth - far);
            }

            void main(){
                if(v_color.a < 0.01) discard;

                color = texture(map, gl_PointCoord.xy) * v_color;
                
                vec2 uv = gl_FragCoord.xy / resolution;
                float depth = float(texture(depthMap, uv).x);
              
                float l = abs(depthBetter(depth) - depthBetter(gl_FragCoord.z));
                color.a *= clamp(l, 0., 1.);
                
                // color = vec4(0.01, 0., 0., 1.);
            }
            `,
            { uboIndex }
        )
    }
}
