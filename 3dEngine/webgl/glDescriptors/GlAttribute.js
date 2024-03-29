import { typedArrayToType } from "../glContext/utils.js"
import { GlArrayBuffer } from "./GlArrayBuffer.js"

export class GlAttribute {
    /**
     * 
     * @param {{
     *  glArrayBuffer: GlArrayBuffer
     *  name: string
     *  size: number
     *  type?: WebGl.Vao.Type | number
     *  normalized?: boolean
     *  stride?: number
     *  offset?: number
     * }} param0 
     */
    constructor({
        glArrayBuffer,
        name,
        size,
        type = undefined,
        normalized = false,
        stride = 0,
        offset = 0
    }) {
        this.glArrayBuffer = glArrayBuffer
        this.name = name
        this.size = size
        this.type = WebGL2RenderingContext[type] ?? type ?? typedArrayToType.get(this.glArrayBuffer.arrayBuffer.constructor)
        this.normalized = normalized
        this.stride = stride
        this.offset = offset
    }
}
