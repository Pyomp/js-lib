import { GlProgramData } from "./GlProgramData.js"
import { GlVaoData } from "./GlVaoData.js"
import { GlTextureData } from './GlTextureData.js'
import { GlUboData } from "./GlUboData.js"

export class GlObjectData {

    /**
     * 
     * @param {{
     *      glProgramData: GlProgramData
     *      glVaoData?: GlVaoData | undefined
     *      uniforms?: {[name: string]: WebGl.UniformData}
     *      glTexturesData?: { [uniformName: string]: GlTextureData }
     *      glUbosData?: GlUboData
     *      drawMode?: WebGl.Render.DrawMode | number
     *      count?: number
     *      offset?: number
     *      additiveBlending?: boolean
     *      normalBlending?: boolean
     *      depthTest?: boolean
     *      depthWrite?: boolean
     *      cullFace?: boolean
     * }} param0 
     */
    constructor({
        glProgramData,
        glVaoData,
        uniforms,
        glTexturesData,
        glUbosData,
        drawMode = WebGL2RenderingContext.TRIANGLES,
        count,
        offset = 0,
        additiveBlending = false,
        normalBlending = false,
        depthTest = true,
        depthWrite = true,
        cullFace = true,
    }) {
        this.glProgramData = glProgramData
        this.glVaoData = glVaoData
        this.uniforms = uniforms
        this.glTexturesData = glTexturesData
        this.glUbosData = glUbosData
        this.drawMode = WebGL2RenderingContext[drawMode] ?? drawMode
        this.count = count ?? countFromGlVaoData(glVaoData)
        this.offset = offset
        this.additiveBlending = additiveBlending
        this.normalBlending = normalBlending
        this.depthTest = depthTest
        this.depthWrite = depthWrite
        this.cullFace = cullFace
    }
}

/**
 * 
 * @param {GlVaoData} glVaoData 
 */
function countFromGlVaoData(glVaoData) {
    if (glVaoData) {
        if (glVaoData.indicesUintArray?.length) {
            return glVaoData.indicesUintArray?.length
        } else {
            for (const attribute of glVaoData.attributesData) {
                if (attribute.name.toLocaleLowerCase().includes('position')) {
                    return attribute.glArrayBufferData.arrayBuffer.byteLength / (3 * 4)
                }
            }
        }
    }
    return 0
}
