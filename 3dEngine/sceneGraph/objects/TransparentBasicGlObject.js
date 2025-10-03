import { BasicGlProgram } from "../../programs/BasicGlProgram.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"

const basicGlProgram = new BasicGlProgram()

export class TransparentBasicGlObject extends GlObject {
    /**
     * @param {{
     *      worldMatrix: Matrix4
     *      glVao: GlVao
     *      baseTexture: GlTexture
     * }} args
    */
    constructor(args) {
        super({
            glProgram: basicGlProgram,
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
