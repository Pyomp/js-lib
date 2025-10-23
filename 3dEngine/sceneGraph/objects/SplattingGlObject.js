import { SplattingDeferredGlProgram } from "../../programs/SplattingDeferredGlProgram.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { OpaqueGlVao } from "../vao/OpaqueGlVao.js"

const glProgram = new SplattingDeferredGlProgram()

export class SplattingGlObject extends GlObject {
    /**
     * @param {{
     *      worldMatrix: Matrix4
     *      glVao: OpaqueGlVao
     *      splattingUniforms: ReturnType<typeof SplattingDeferredGlProgram.createUniforms>
     * }} args
    */
    constructor(args) {
        super({
            glProgram,
            glVao: args.glVao,
            uniforms: {
                worldMatrix: args.worldMatrix,
                ...args.splattingUniforms
            }
        })
    }
}
