import { OpaqueSkinnedDeferredGlProgram } from "../../programs/CommonDeferredGlProgram.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"

const opaqueSkinnedDeferredGlProgram = new OpaqueSkinnedDeferredGlProgram()

export class OpaqueSkinnedGlObject extends GlObject {
    /**
     * @param {{
     *      worldMatrix:Matrix4
     *      jointsTexture:GlTexture
     *      glVao:GlVao
     *      baseTexture: GlTexture
     * }} args
    */
    constructor(args) {
        super({
            glProgram: opaqueSkinnedDeferredGlProgram,
            glVao: args.glVao,
            uniforms: OpaqueSkinnedDeferredGlProgram.createUniforms(
                args.worldMatrix,
                args.baseTexture,
                args.jointsTexture
            )
        })
    }
}
