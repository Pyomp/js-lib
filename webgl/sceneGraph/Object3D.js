import { Box3 } from "../../math/Box3.js"
import { Attribute } from "./Attribute.js"
import { Material } from "./Material.js"
import { Texture } from "./Texture.js"
import { Uniform } from "./Uniform.js"

export class Object3D {
    drawRange = {
        offset: 0,
        count: -1
    }
    drawMode

    boundingBox = new Box3()

    /**
     * 
     * @param {{
     *  material: Material,
     *  attributes: {[name: string]: Attribute},
     *  indices: Uint16Array,
     *  drawMode: WebGl.Render.DrawMode
     *  uniforms: {[name: string]: Uniform},
     *  textures: {[name: string]: Texture},
     *  blending: boolean
     *  depthTest: boolean
     *  depthWrite: boolean
     *  cullFace: boolean
     * }} param0 
     */
    constructor({
        material,
        attributes = {},
        indices = null,
        drawMode = 'TRIANGLES',
        uniforms = {},
        textures = {},
        blending = false,
        depthTest = true,
        depthWrite = true,
        cullFace = true
    }) {
        this.material = material
        this.attributes = attributes
        this.indices = indices

        this.drawMode = WebGL2RenderingContext[drawMode]

        this.uniforms = uniforms
        this.textures = textures

        this.blending = blending
        this.depthTest = depthTest
        this.depthWrite = depthWrite
        this.cullFace = cullFace
    }
}
