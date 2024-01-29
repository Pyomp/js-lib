import { GlProgramData } from "../../webgl/glDescriptors/GlProgramData.js"
import { GltfNodeManager } from "./GltfNodeManager.js"

export class GltfSplattingManager extends GltfNodeManager {
    initNode3D(gltfNode)


    /**
     * 
     * @param {{
     *      gltfNode: GltfNode
     *      glProgramData: GlProgramData
     *      splattingTexture: URL
     *      textureColor1: URL
     *      textureNormal1: URL
     *      textureScale1: URL
     *      textureColor2: URL
     *      textureNormal2: URL
     *      textureScale2: URL
     *      textureColor3: URL
     *      textureNormal3: URL
     *      textureScale3: URL
     *      textureColor4: URL
     *      textureNormal4: URL
     *      textureScale4: URL
     * }} params
     */
    getNode3D({
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

        const node3D = super.getNode3D(gltfNode, glProgramData)

        for (const object of node3D.objects) {
            //@ts-expect-error ts so bad
            object.uniforms
        }

        return node3D
    }
}
