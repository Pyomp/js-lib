import { OpaqueSkinnedMorphedDeferredGlProgram } from "../../programs/CommonDeferredGlProgram.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"
import { MorphController } from "../gltf/skinned/animation/MorphController.js"

const opaqueSkinnedMorphedDeferredGlProgram = new OpaqueSkinnedMorphedDeferredGlProgram()

export class OpaqueSkinnedMorphedGlObject extends GlObject {
    /**
     * @param {{
     *      worldMatrix:Matrix4
     *      jointsTexture:GlTexture
     *      glVao:GlVao
     *      baseTexture: GlTexture
     *      morphController: MorphController
     * }} args
    */
    constructor(args) {
        super({
            glProgram: opaqueSkinnedMorphedDeferredGlProgram,
            glVao: args.glVao,
            uniforms: OpaqueSkinnedMorphedDeferredGlProgram.createUniforms(
                args.worldMatrix,
                args.baseTexture,
                args.jointsTexture,
                args.morphController.positionGlTexture,
                args.morphController.normalGlTexture,
                args.morphController.weight
            )
        })

    }

}

