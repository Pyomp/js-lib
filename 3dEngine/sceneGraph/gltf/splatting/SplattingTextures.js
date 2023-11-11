import { Texture } from "../../Texture.js"

export class SplattingTextures {
    /**
     * 
     * @param {{
     *      splattingImage: Image
     *      image1: Image
     *      normalImage1: Image
     *      map1Scale: Vector2
     *      image2: Image
     *      normalImage2: Image
     *      map2Scale: Vector2
     *      image3: Image
     *      normalImage3: Image
     *      map3Scale: Vector2
     *      image4: Image
     *      normalImage4: Image
     *      map4Scale: Vector2
     * }} textures
     */
    constructor({
        splattingImage,

        image1,
        normalImage1,
        map1Scale,

        image2,
        normalImage2,
        map2Scale,

        image3,
        normalImage3,
        map3Scale,

        image4,
        normalImage4,
        map4Scale,
    }) {
        this.mapSplatting = getMapSplattingTexture(splattingImage)

        this.map1 = getMapTexture(image1)
        this.normalMap1 = getMapTexture(normalImage1)
        this.map1Scale = map1Scale

        this.map2 = getMapTexture(image2)
        this.normalMap2 = getMapTexture(normalImage2)
        this.map2Scale = map2Scale

        this.map3 = getMapTexture(image3)
        this.normalMap3 = getMapTexture(normalImage3)
        this.map3Scale = map3Scale

        this.map4 = getMapTexture(image4)
        this.normalMap4 = getMapTexture(normalImage4)
        this.map4Scale = map4Scale
    }
}

/** @type {WeakMap<Image, Texture>} */
const mapSplattingTexture = new WeakMap()
/** @type {WeakMap<Image, Texture>} */
const mapTexture = new WeakMap()

function getMapSplattingTexture(image) {
    if (!mapSplattingTexture.has(image)) {
        mapSplattingTexture.set(image, new Texture({
            needsMipmap: false,
            data: image,
        }))
    }
    return mapSplattingTexture.get(image)
}
function getMapTexture(image) {
    if (!mapTexture.has(image)) {
        mapTexture.set(image, new Texture({
            minFilter: 'LINEAR_MIPMAP_NEAREST',
            magFilter: 'LINEAR',
            wrapS: 'REPEAT',
            wrapT: 'REPEAT',
            data: image,
        }))
    }
    return mapTexture.get(image)
}
