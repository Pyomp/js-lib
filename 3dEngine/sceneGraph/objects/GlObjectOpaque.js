import { OpaqueStaticDeferredGlProgram } from "../../programs/CommonDeferredGlProgram.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"

const glProgram = new OpaqueStaticDeferredGlProgram()

export class GlObjectOpaque extends GlObject {
    /**
     * @param {{
     *      worldMatrix:Matrix4
     *      glVao:GlVao
     *      baseTexture: GlTexture
     * }} args
    */
    constructor(args) {
        super({
            glProgram,
            glVao: args.glVao,
            uniforms: OpaqueStaticDeferredGlProgram.createUniforms(
                args.worldMatrix,
                args.baseTexture,
            )
        })
    }
}
