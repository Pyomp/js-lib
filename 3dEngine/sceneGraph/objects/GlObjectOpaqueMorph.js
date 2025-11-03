import { OpaqueMorphedDeferredGlProgram } from "../../programs/CommonDeferredGlProgram.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"
import { MorphController } from "../gltf/skinned/animation/MorphController.js"

const glProgram = new OpaqueMorphedDeferredGlProgram()

export class GlObjectOpaqueMorph extends GlObject {
    /**
     * @param {{
     *      worldMatrix:Matrix4
     *      glVao:GlVao
     *      baseTexture: GlTexture
     *      morphController: MorphController
     * }} args
    */
    constructor(args) {
        super({
            glProgram,
            glVao: args.glVao,
            uniforms: OpaqueMorphedDeferredGlProgram.createUniforms(
                args.worldMatrix,
                args.baseTexture,
                args.morphController.positionGlTexture,
                args.morphController.normalGlTexture,
                args.morphController.weight
            )
        })
    }
}

