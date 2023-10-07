import { GlContext } from "../GlContext.js"
import { GlState } from "../GlState.js"
import { Object3D } from "./Object3d.js"

export class Renderer {
    #currentProgram = null
    #currentVao = null
    #currentTextures = {}
    #state
    /** @type {WebGL2RenderingContext} */ #gl

    constructor(gl) {
        this.#gl = gl
        this.#state = new GlState(gl)
    }

    draw(){
        this.drawObjects(objects)
    }

    drawObjects(objects) {
        const gl = this.#gl
        const state = this.#state

        for (const object of objects) {
            const program = object.glProgram
            const vao = object.glVao

            // program
            if (program !== this.#currentProgram) {
                this.#currentProgram = program
                program.useProgram()
                const uniformsToUpdate = program.uniformsToUpdate
                for (const key in uniformsToUpdate) {
                    program.uniformUpdate[key](uniformsToUpdate[key])
                    delete uniformsToUpdate[key]
                }
            }

            // uniform
            const uniformsToUpdate = object.uniformsToUpdate
            for (const key in uniformsToUpdate) {
                program.uniformUpdate[key](uniformsToUpdate[key])
                delete uniformsToUpdate[key]
            }

            // vao
            if (vao !== this.#currentVao) {
                this.#currentVao = vao
                vao.bind()
            }

            // texture
            const textures = object.textures
            const textureUnit = program.textureUnit
            const currentTextures = this.#currentTextures
            for (const name in textures) {
                const texture = textures[name]
                const unit = textureUnit[name]
                if (currentTextures[unit] !== texture) {
                    currentTextures[unit] = texture
                    texture.bindToUnit(unit)
                }
            }

            // states
            state.blending = object.blending
            state.depthTest = object.depthTest
            state.depthWrite = object.depthWrite
            state.cullFace = object.cullFace
            // blendingStuff
            // faceStuff

            if (vao.hasIndices) {
                gl.drawElements(
                    object.drawMode,
                    object.drawRange.count,                // num vertices to process
                    gl.UNSIGNED_SHORT, // type of indices
                    object.drawRange.offset,                 // offset on bytes to indices
                )
            } else {
                gl.drawArrays(object.drawMode, object.drawRange.offset, object.drawRange.count)
            }
        }
    }
}
