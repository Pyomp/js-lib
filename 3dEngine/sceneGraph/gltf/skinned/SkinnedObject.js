import { Matrix4 } from "../../../../math/Matrix4.js"
import { Geometry } from "../../Geometry.js"
import { Material } from "../../Material.js"
import { Object3D } from "../../Object3D.js"
import { Texture } from "../../Texture.js"
import { Uniform } from "../../Uniform.js"
import { SkinnedPhongMaterial } from "./SkinnedPhongMaterial.js"

const material = new SkinnedPhongMaterial()

export class SkinnedObject extends Object3D {
    /**
     * 
     * @param {GltfPrimitive} gltfPrimitive
     * @param {Texture} jointsTexture
     * @param {Matrix4} modelMatrix
     */
    constructor(gltfPrimitive, jointsTexture, modelMatrix) {
        const uniforms = {
            alphaTest: new Uniform(gltfPrimitive.material.alphaMode === 'MASK' ? 0.5 : -1),
            shininess: new Uniform(200 ** (1 - gltfPrimitive.material.pbrMetallicRoughness.roughnessFactor)),
            modelMatrix: new Uniform(modelMatrix)
        }

        const textures = { jointsTexture }

        if (gltfPrimitive.material.pbrMetallicRoughness.baseColorTexture?.source) {
            const mapImage = gltfPrimitive.material.pbrMetallicRoughness.baseColorTexture.source

            const map = getMapTexture(mapImage)
            textures['map'] = map
        }

        super({
            material,
            geometry: getGeometry(gltfPrimitive),
            normalBlending: gltfPrimitive.material.alphaMode === 'BLEND',
            textures,
            uniforms,
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
        joints: gltfPrimitive.attributes.JOINTS_0.buffer,
        weights: gltfPrimitive.attributes.WEIGHTS_0.buffer
    }

    const geometry = new Geometry(gltfPrimitive.indices.count, attributes, gltfPrimitive.indices.buffer)

    geometryCache.set(gltfPrimitive, geometry)

    return geometry
}

const mapTexture = new WeakMap()

function getMapTexture(image) {
    if (mapTexture.has(image))
        return mapTexture.get(image)

    const texture = new Texture({ data: image })

    mapTexture.set(image, texture)

    return texture
}
