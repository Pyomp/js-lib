import { GLSL_CAMERA } from "../programs/chunks/glslCamera.js"
import { GlArrayBuffer } from "../webgl/glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../webgl/glDescriptors/GlAttribute.js"
import { GlObject } from "../webgl/glDescriptors/GlObject.js"
import { GlProgram } from "../webgl/glDescriptors/GlProgram.js"
import { GlVao } from "../webgl/glDescriptors/GlVao.js"

const glVao = new GlVao([
    new GlAttribute({
        name: 'position',
        glArrayBuffer: new GlArrayBuffer(new Float32Array([
            0, 0, 0,
            1, 0, 0,
            0, 0, 0,

            0, 0, 0,
            0, 1, 0,
            0, 0, 0,

            0, 0, 0,
            0, 0, 1,
            0, 0, 0,
        ])),
        size: 3
    }),
    new GlAttribute({
        name: 'color',
        glArrayBuffer: new GlArrayBuffer(new Float32Array([
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,

            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
        ])),
        size: 3
    })
])

const glProgram = new GlProgram(() => `#version 300 es
precision highp float;
precision highp int;

in vec3 position;
in vec3 color;

uniform mat4 matrix4;

${GLSL_CAMERA.declaration}

out vec3 v_position;
out vec3 v_color;
out float v_depth;

#define INT_RANGE 2147483647.0

void main() {
    vec4 worldPosition = matrix4 * vec4(position, 1.);
    v_position = worldPosition.xyz;
    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * worldPosition;
    float depthRange = ${GLSL_CAMERA.far} - ${GLSL_CAMERA.near};
    float depthRangeHalf = depthRange / 2.;
    v_depth = (gl_Position.z - depthRangeHalf) / (depthRange / INT_RANGE);
    v_color = color;
}
`,
    () => `#version 300 es
precision highp float;

in vec3 v_position;
in vec3 v_color;
in float v_depth;

layout(location = 0) out vec3 outColor;
layout(location = 1) out ivec4 outPosition;
layout(location = 2) out ivec4 outNormal;
layout(location = 3) out float outDepth; // not used
layout(location = 4) out int outStencil; // not used

#define INT_RANGE 2147483647.0

void main() {
    outColor = v_color;
    outPosition = ivec4(v_position * 1000., v_depth);
    outNormal = ivec4(0, INT_RANGE, 0, 1);
    outDepth = gl_FragCoord.z;
    outStencil = 0;
}`
)

export class Matrix4GlObject extends GlObject {
    #matrix4

    constructor(
        /** @type {Matrix4} */ matrix4
    ) {
        super({
            glProgram,
            glVao,
            depthTest: false,
            depthWrite: false,
            drawMode: 'LINES',
            count: 8,
            uniforms: {
                matrix4
            }
        })

        this.#matrix4 = matrix4
    }
}
