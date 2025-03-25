import { GlProgram } from "./GlProgram.js"
import { GlVao } from "./GlVao.js"
import { GlTexture } from './GlTexture.js'
import { GlUbo } from "./GlUbo.js"

export class GlObject {
    /**
     * 
     * @param {{
     *      glProgram: GlProgram
     *      glVao?: GlVao | undefined
     *      uniforms?: {[name: string]: WebGl.UniformData | GlTexture}
     *      glUbos?: GlUbo
     *      drawMode?: WebGl.Render.DrawMode | number
     *      count?: number
     *      offset?: number
     *      additiveBlending?: boolean
     *      normalBlending?: boolean
     *      multiplyBlending?: boolean
     *      subtractiveBlending?: boolean
     *      depthTest?: boolean
     *      depthWrite?: boolean
     *      frontCullFace?: boolean
     *      backCullFace?: boolean
     *      depthFunc?: WebGl.Render.DepthFunc | number
     * }} param0 
     */
    constructor({
        glProgram,
        glVao,
        uniforms,
        glUbos,
        drawMode = WebGL2RenderingContext.TRIANGLES,
        count,
        offset = 0,
        additiveBlending = false,
        normalBlending = false,
        multiplyBlending = false,
        subtractiveBlending = false,
        depthTest = true,
        depthWrite = true,
        frontCullFace = true,
        backCullFace = false,
        depthFunc = WebGL2RenderingContext.LESS,
    }) {
        this.glProgram = glProgram
        this.glVao = glVao
        this.uniforms = uniforms ?? {}
        this.glUbos = glUbos
        this.drawMode = WebGL2RenderingContext[drawMode] ?? drawMode
        this.count = count ?? (glVao ? countFromGlVaoData(glVao) : 0)
        this.offset = offset
        this.additiveBlending = additiveBlending
        this.normalBlending = normalBlending
        this.multiplyBlending = multiplyBlending
        this.subtractiveBlending = subtractiveBlending
        this.depthTest = depthTest
        this.depthWrite = depthWrite
        this.frontCullFace = frontCullFace
        this.backCullFace = backCullFace
        this.depthFunc = depthFunc
    }

    clone() {
        return new GlObject({
            glProgram: this.glProgram,
            glVao: this.glVao,
            uniforms: { ...this.uniforms },
            // glUbosData: this.glUbosData.clone(), // TODO
            drawMode: this.drawMode,
            count: this.count,
            offset: this.offset,
            additiveBlending: this.additiveBlending,
            multiplyBlending: this.multiplyBlending,
            subtractiveBlending: this.subtractiveBlending,
            normalBlending: this.normalBlending,
            depthTest: this.depthTest,
            depthWrite: this.depthWrite,
            frontCullFace: this.frontCullFace,
            backCullFace: this.backCullFace,
            depthFunc: this.depthFunc,
        })
    }
}

/**
 * 
 * @param {GlVao} glVao 
 */
function countFromGlVaoData(glVao) {
    if (glVao) {
        if (glVao.indicesUintArray?.length) {
            return glVao.indicesUintArray?.length
        } else {
            for (const attribute of glVao.attributes) {
                if (attribute.name.toLocaleLowerCase().includes('position')) {
                    return attribute.glArrayBuffer.arrayBuffer.byteLength / (3 * 4)
                }
            }
        }
    }
    return 0
}
