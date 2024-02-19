import { GlArrayBuffer } from "../webgl/glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../webgl/glDescriptors/GlAttribute.js"

export class CubeGeometry {
    buffers = {
        position: new Float32Array([
            1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1,
        ]),
        normal: new Float32Array([
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        ]),
        uv: new Float32Array([
            1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
        ])
    }

    attributesData = [
        new GlAttribute({
            name: 'position',
            glArrayBuffer: new GlArrayBuffer(this.buffers.position),
            size: 3,
            type: 'FLOAT'
        }),
        new GlAttribute({
            name: 'normal',
            glArrayBuffer: new GlArrayBuffer(this.buffers.normal),
            size: 3,
            type: 'FLOAT'
        }),
        new GlAttribute({
            name: 'uv',
            glArrayBuffer: new GlArrayBuffer(this.buffers.uv),
            size: 2,
            type: 'FLOAT'
        }),

    ]

    indicesUintArray = new Uint16Array([
        0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
    ])
}
