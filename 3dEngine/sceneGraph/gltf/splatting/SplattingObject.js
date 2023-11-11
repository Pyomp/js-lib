import { Matrix4 } from "../../../../math/Matrix4.js"
import { Geometry } from "../../Geometry.js"
import { Object3D } from "../../Object3D.js"
import { Texture } from "../../Texture.js"
import { Uniform } from "../../Uniform.js"
import { SplattingMaterial } from "./SplattingMaterial.js"
import { SplattingTextures } from "./SplattingTextures.js"

const material = new SplattingMaterial()

export class SplattingObject extends Object3D {
    /**
     * 
     * @param {GltfPrimitive} gltfPrimitive
     * @param {{[name: string]: Uniform}} uniforms
     * @param {{[name: string]: Texture}} textures
     */
    constructor(gltfPrimitive, uniforms, textures) {
        super({
            material,
            geometry: getGeometry(gltfPrimitive),
            textures,
            uniforms
        })
    }
}

/** @type {WeakMap<GltfPrimitive, Geometry>} */
const geometryCache = new WeakMap()

/**
 * 
 * @param {GltfPrimitive} gltfPrimitive 
 */
function getGeometry(gltfPrimitive) {
    if (geometryCache.has(gltfPrimitive))
        return geometryCache.get(gltfPrimitive)

    const attributes = {
        position: gltfPrimitive.attributes.POSITION.buffer,
        uv: gltfPrimitive.attributes.TEXCOORD_0.buffer,
        normal: gltfPrimitive.attributes.NORMAL.buffer,
        tangent: gltfPrimitive.attributes.TANGENT.buffer
    }

    const geometry = new Geometry(gltfPrimitive.indices.count, attributes, gltfPrimitive.indices.buffer)

    geometryCache.set(gltfPrimitive, geometry)

    return geometry
}

/** @type {WeakMap<GltfTexture, Texture>} */
const mapTexture = new WeakMap()

/**
 * 
 * @param {GltfTexture} gltfTexture 
 * @returns 
 */
function getMapTexture(gltfTexture) {
    if (mapTexture.has(gltfTexture))
        return mapTexture.get(gltfTexture)

    const texture = new Texture({
        minFilter: gltfTexture.sampler.minFilter,
        magFilter: gltfTexture.sampler.magFilter,
        wrapS: gltfTexture.sampler.wrapS,
        wrapT: gltfTexture.sampler.wrapT,
        data: gltfTexture.source
    })

    mapTexture.set(gltfTexture, texture)

    return texture
}
