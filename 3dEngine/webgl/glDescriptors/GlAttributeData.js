import { GlArrayBufferData } from "./GlArrayBufferData.js"

export class GlAttributeData {
    /**
     * 
     * @param {{
     *  glArrayBufferData: GlArrayBufferData
     *  name: string
     *  size: number
     *  type: WebGl.Vao.Type | number
     *  normalized?: boolean
     *  stride?: number
     *  offset?: number
     * }} param0 
     */
    constructor({
        glArrayBufferData,
        name,
        size,
        type,
        normalized = false,
        stride = 0,
        offset = 0
    }) {
        this.glArrayBufferData = glArrayBufferData
        this.name = name
        this.size = size
        this.type = WebGL2RenderingContext[type] ?? type
        this.normalized = normalized
        this.stride = stride
        this.offset = offset
    }
}
