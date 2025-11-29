import { GLSL_COMMON } from "../../programs/chunks/glslCommon.js"
import { OpaqueStaticDeferredGlProgram } from "../../programs/CommonDeferredGlProgram.js"
import { PhongGlProgram } from "../../programs/PhongGlProgram.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"

const glProgram = new PhongGlProgram()

export class GlObjectOpaque extends GlObject {
    constructor(
        /**
         * @type {{
         *      worldMatrix:Matrix4
         *      glVao:GlVao
         *      baseTexture: GlTexture
         * }} 
         */
        args
    ) {
        super({
            glProgram,
            glVao: args.glVao,
            uniforms: OpaqueStaticDeferredGlProgram.createUniforms(
                args.worldMatrix,
                args.baseTexture,
            ),
        })
    }
}
