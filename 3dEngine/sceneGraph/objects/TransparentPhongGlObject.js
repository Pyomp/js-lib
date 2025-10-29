import { BasicGlProgram } from "../../programs/BasicGlProgram.js"
import { PhongGlProgram } from "../../programs/PhongGlProgram.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"

// const glProgram = new BasicGlProgram()
const glProgram = new PhongGlProgram()

export class TransparentPhongGlObject extends GlObject {
    /**
     * @param {{
     *      worldMatrix: Matrix4
     *      glVao: GlVao
     *      baseTexture: GlTexture
     * }} args
    */
    constructor(args) {
        super({
            glProgram: glProgram,
            glVao: args.glVao,
            uniforms: BasicGlProgram.createUniforms(
                args.worldMatrix,
                args.baseTexture,
            )
        })
        this.frontCullFace = false
        this.backCullFace = false
        this.normalBlending = true
        this.depthWrite = false
    }
}
