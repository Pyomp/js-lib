export class Object3D {
    drawMode

    transparent = false

    /**
     * 
     * @param {{
     *  material: Material
     *  geometry: Geometry
     *  drawMode?: WebGl.Render.DrawMode
     *  uniforms?: {[name: string]: WebGl.UniformData}
     *  textures?: {[name: string]: Texture}
     *  additiveBlending?: boolean
     *  normalBlending?: boolean
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
        additiveBlending = false,
        normalBlending = false,
        depthTest = true,
        depthWrite = true,
        cullFace = true
    }) {
        this.material = material
        this.geometry = geometry

        this.drawMode = WebGL2RenderingContext[drawMode]

        this.uniforms = uniforms
        this.textures = textures

        this.normalBlending = normalBlending
        this.additiveBlending = additiveBlending
        if (additiveBlending || normalBlending) {
            this.transparent = true
        }

        this.depthTest = depthTest
        this.depthWrite = depthWrite
        this.cullFace = cullFace
    }
}
