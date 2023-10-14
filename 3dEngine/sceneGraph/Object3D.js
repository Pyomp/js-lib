import { Box3 } from "../../math/Box3.js"
import { Geometry } from "./Geometry.js"
import { Material } from "./Material.js"
import { Texture } from "./Texture.js"
import { Uniform } from "./Uniform.js"

export class Object3D {
    drawMode

    boundingBox = new Box3()

    /**
     * 
     * @param {{
     *  material: Material
     *  geometry: Geometry
     *  drawMode?: WebGl.Render.DrawMode
     *  uniforms?: {[name: string]: Uniform}
     *  textures?: {[name: string]: Texture}
     *  blending?: boolean
     *  depthTest?: boolean
     *  depthWrite?: boolean
     *  cullFace?: boolean
     * }} param0 
     */
    constructor({
        material,
        geometry,
        drawMode = 'TRIANGLES',
        uniforms = {},
        textures = {},
        blending = false,
        depthTest = true,
        depthWrite = true,
        cullFace = true
    }) {
        this.material = material
        this.geometry = geometry

        this.drawMode = WebGL2RenderingContext[drawMode]

        this.uniforms = uniforms
        this.textures = textures

        this.blending = blending
        this.depthTest = depthTest
        this.depthWrite = depthWrite
        this.cullFace = cullFace
    }
}
