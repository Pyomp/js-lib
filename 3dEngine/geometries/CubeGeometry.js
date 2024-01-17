import { GlArrayBufferData } from "../webgl/glDescriptors/GlArrayBufferData.js"
import { GlAttributeData } from "../webgl/glDescriptors/GlAttributeData.js"

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
        new GlAttributeData({
            name: 'position',
            glArrayBufferData: new GlArrayBufferData(this.buffers.position),
            size: 3,
            type: 'FLOAT'
        }),
        new GlAttributeData({
            name: 'normal',
            glArrayBufferData: new GlArrayBufferData(this.buffers.normal),
            size: 3,
            type: 'FLOAT'
        }),
        new GlAttributeData({
            name: 'uv',
            glArrayBufferData: new GlArrayBufferData(this.buffers.uv),
            size: 2,
            type: 'FLOAT'
        }),

    ]

    indicesUintArray = new Uint16Array([
        0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
    ])
}
