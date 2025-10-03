import { OpaqueStaticDeferredGlProgram } from "../../programs/CommonDeferredProgram.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"

const opaqueDeferredGlProgram = new OpaqueStaticDeferredGlProgram()

export class OpaqueGlObject extends GlObject {
    /**
     * @param {{
     *      worldMatrix:Matrix4
     *      glVao:GlVao
     *      baseTexture: GlTexture
     * }} args
    */
    constructor(args) {
        super({
            glProgram: opaqueDeferredGlProgram,
            glVao: args.glVao,
            uniforms: OpaqueStaticDeferredGlProgram.createUniforms(
                args.worldMatrix,
                args.baseTexture,
            )
        })
    }
}
