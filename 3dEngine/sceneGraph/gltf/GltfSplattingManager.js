import { Vector2 } from "../../../math/Vector2.js"
import { getImage } from "../../../utils/utils.js"
import { GLSL_SPLATTING } from "../../programs/chunks/glslSplatting.js"
import { GlProgramData } from "../../webgl/glDescriptors/GlProgramData.js"
import { GlTextureData } from "../../webgl/glDescriptors/GlTextureData.js"
import { GltfNodeManager } from "./GltfNodeManager.js"

export class GltfSplattingManager extends GltfNodeManager {
    /**
    * @param {{
    *      splattingTextureUrl: URL
    *      textureColor1Url: URL
    *      textureNormal1Url: URL
    *      textureColor2Url: URL
    *      textureNormal2Url: URL
    *      textureColor3Url: URL
    *      textureNormal3Url: URL
    *      textureColor4Url: URL
    *      textureNormal4Url: URL
    * }} params
    */
    static async loadSplattingTextures({
        splattingTextureUrl,
        textureColor1Url,
        textureNormal1Url,
        textureColor2Url,
        textureNormal2Url,
        textureColor3Url,
        textureNormal3Url,
        textureColor4Url,
        textureNormal4Url,
    }) {
        const [
            splattingTextureImage,
            textureColor1Image,
            textureNormal1Image,
            textureColor2Image,
            textureNormal2Image,
            textureColor3Image,
            textureNormal3Image,
            textureColor4Image,
            textureNormal4Image,
        ] = await Promise.all([
            getImage(splattingTextureUrl.href),
            getImage(textureColor1Url.href),
            getImage(textureNormal1Url.href),
            getImage(textureColor2Url.href),
            getImage(textureNormal2Url.href),
            getImage(textureColor3Url.href),
            getImage(textureNormal3Url.href),
            getImage(textureColor4Url.href),
            getImage(textureNormal4Url.href),
        ])

        return {
            splattingTexture: new GlTextureData({ data: splattingTextureImage, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
            textureColor1: new GlTextureData({ data: textureColor1Image, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
            textureNormal1: new GlTextureData({ data: textureNormal1Image, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
            textureColor2: new GlTextureData({ data: textureColor2Image, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
            textureNormal2: new GlTextureData({ data: textureNormal2Image, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
            textureColor3: new GlTextureData({ data: textureColor3Image, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
            textureNormal3: new GlTextureData({ data: textureNormal3Image, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
            textureColor4: new GlTextureData({ data: textureColor4Image, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
            textureNormal4: new GlTextureData({ data: textureNormal4Image, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
        }
    }

    #splattingTexture
    #textureColor1
    #textureNormal1
    #textureScale1
    #textureColor2
    #textureNormal2
    #textureScale2
    #textureColor3
    #textureNormal3
    #textureScale3
    #textureColor4
    #textureNormal4
    #textureScale4

    /**
     * 
     * @param {{
     *      gltfNode: GltfNode
     *      glProgramData: GlProgramData
     *      splattingTexture: GlTextureData
     *      textureColor1: GlTextureData
     *      textureNormal1: GlTextureData
     *      textureScale1: Vector2
     *      textureColor2: GlTextureData
     *      textureNormal2: GlTextureData
     *      textureScale2: Vector2
     *      textureColor3: GlTextureData
     *      textureNormal3: GlTextureData
     *      textureScale3: Vector2
     *      textureColor4: GlTextureData
     *      textureNormal4: GlTextureData
     *      textureScale4: Vector2
     * }} params
     */
    constructor({
        gltfNode,
        glProgramData,
        splattingTexture,
        textureColor1,
        textureNormal1,
        textureScale1,
        textureColor2,
        textureNormal2,
        textureScale2,
        textureColor3,
        textureNormal3,
        textureScale3,
        textureColor4,
        textureNormal4,
        textureScale4,
    }) {
        super(gltfNode, glProgramData)
        this.#splattingTexture = splattingTexture
        this.#textureColor1 = textureColor1
        this.#textureNormal1 = textureNormal1
        this.#textureScale1 = textureScale1
        this.#textureColor2 = textureColor2
        this.#textureNormal2 = textureNormal2
        this.#textureScale2 = textureScale2
        this.#textureColor3 = textureColor3
        this.#textureNormal3 = textureNormal3
        this.#textureScale3 = textureScale3
        this.#textureColor4 = textureColor4
        this.#textureNormal4 = textureNormal4
        this.#textureScale4 = textureScale4
    }

    getNode() {
        const node3D = super.getNode()

        for (const object of node3D.objects) {
            const uniforms = object.uniforms
            uniforms[GLSL_SPLATTING.splattingTexture] = this.#splattingTexture
            uniforms[GLSL_SPLATTING.textureColor1] = this.#textureColor1
            uniforms[GLSL_SPLATTING.textureNormal1] = this.#textureNormal1
            uniforms[GLSL_SPLATTING.textureScale1] = this.#textureScale1
            uniforms[GLSL_SPLATTING.textureColor2] = this.#textureColor2
            uniforms[GLSL_SPLATTING.textureNormal2] = this.#textureNormal2
            uniforms[GLSL_SPLATTING.textureScale2] = this.#textureScale2
            uniforms[GLSL_SPLATTING.textureColor3] = this.#textureColor3
            uniforms[GLSL_SPLATTING.textureNormal3] = this.#textureNormal3
            uniforms[GLSL_SPLATTING.textureScale3] = this.#textureScale3
            uniforms[GLSL_SPLATTING.textureColor4] = this.#textureColor4
            uniforms[GLSL_SPLATTING.textureNormal4] = this.#textureNormal4
            uniforms[GLSL_SPLATTING.textureScale4] = this.#textureScale4
        }

        return node3D
    }
}
