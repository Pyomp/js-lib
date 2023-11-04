import { Matrix4 } from "../../../../math/Matrix4.js"
import { Geometry } from "../../Geometry.js"
import { Object3D } from "../../Object3D.js"
import { Texture } from "../../Texture.js"
import { Uniform } from "../../Uniform.js"
import { BasicStaticGltfMaterial } from "./BasicStaticGltfMaterial.js"

const material = new BasicStaticGltfMaterial()

export class StaticGltfObject extends Object3D {
    /**
     * 
     * @param {GltfPrimitive} gltfPrimitive
     * @param {Matrix4} modelMatrix
     */
    constructor(gltfPrimitive, modelMatrix) {
        const uniforms = {
            modelMatrix: new Uniform(modelMatrix)
        }

        const textures = {}

        if (gltfPrimitive.material.pbrMetallicRoughness.baseColorTexture) {
            const map = getMapTexture(gltfPrimitive.material.pbrMetallicRoughness.baseColorTexture)
            textures['map'] = map
        }

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
        uv: gltfPrimitive.attributes.TEXCOORD_0.buffer
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
