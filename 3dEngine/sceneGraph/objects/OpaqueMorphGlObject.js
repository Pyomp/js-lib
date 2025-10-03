import { OpaqueMorphedDeferredGlProgram } from "../../programs/CommonDeferredProgram.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"
import { MorphController } from "../gltf/skinned/animation/MorphController.js"

const opaqueMorphDeferredGlProgram = new OpaqueMorphedDeferredGlProgram()

export class OpaqueMorphGlObject extends GlObject {
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
            glProgram: opaqueMorphDeferredGlProgram,
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

