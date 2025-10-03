import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"

export function getGlTextureData(/** @type {GltfTexture} */ gltfTexture) {
    return new GlTexture({
        name: gltfTexture.name,
        data: gltfTexture.source.htmlImageElement,
        minFilter: gltfTexture.sampler.minFilter,
        magFilter: gltfTexture.sampler.magFilter,
        wrapS: gltfTexture.sampler.wrapS,
        wrapT: gltfTexture.sampler.wrapT
    })
}
