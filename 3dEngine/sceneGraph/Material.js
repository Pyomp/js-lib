import { Texture } from "./Texture.js"
import { Uniform } from "./Uniform.js"

export class Material {
    /**
     * 
     * @param {{
     *  vertexShader: string
     *  fragmentShader: string
     *  uniforms?: { [name: string]: Uniform}
     *  textures?: { [name: string]: Texture}
     * }} param0 
     */
    constructor({ vertexShader, fragmentShader, uniforms, textures }) {
        this.vertexShader = vertexShader
        this.fragmentShader = fragmentShader
        this.uniforms = uniforms
        this.textures = textures
    }
}