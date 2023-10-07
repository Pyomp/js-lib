import { GlProgram } from "../GlProgram.js"
import { GlTexture } from "../GlTexture.js"
import { GlVao } from "../GlVao.js"

export class Object3D {
    /** @type {GlProgram} */  glProgram
    /** @type {GlVao} */ glVao
    /** @type {{[textureName: string]: GlTexture}} */ textures

    drawRange = {
        offset: 0,
        count: 0
    }
    drawMode

    constructor({
        glProgram,
        glVao,
        drawMode = 'TRIANGLE',
        textures = {},
        blending = false,
        depthTest = true,
        depthWrite = true,
        cullFace = true
    }) {
        this.glProgram = glProgram
        this.glVao = glVao

        this.drawRange.count = this.glVao.count

        this.drawMode = WebGL2RenderingContext[drawMode]

        this.textures = textures

        this.blending = blending
        this.depthTest = depthTest
        this.depthWrite = depthWrite
        this.cullFace = cullFace
    }

    update() {

    }

    draw() {

    }
}
