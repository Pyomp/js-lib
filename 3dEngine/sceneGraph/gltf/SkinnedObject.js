import { Geometry } from "../Geometry.js"
import { Material } from "../Material.js"
import { Object3D } from "../Object3D.js"
import { Uniform } from "../Uniform.js"

const material = new Material({
    vertexShader: `
    `,
    fragmentShader: `
    `,
})

export class SkinnedObject extends Object3D {
    /**
     * 
     * @param {GltfPrimitive} gltfPrimitive
     */
    constructor(gltfPrimitive, textures, modelMatrixUniform) {



        // if (gltfMaterial.alphaMode === 'MASK') {
        //     const alphaTest = true
        // } else if (gltfMaterial.alphaMode === 'BLEND') {
        //     gltfMaterial.blending = AdditiveBlending
        // }

        const uniforms = getUniforms(gltfPrimitive)
        uniforms['modelMatrix'] = modelMatrixUniform

        super({
            material,
            geometry: getGeometry(gltfPrimitive),
            textures,
            uniforms,
        })
    }
}

function getGeometry(gltfPrimitive) {
    return new Geometry()
}

const uniformsCache = new WeakMap()

function getUniforms(gltfPrimitive) {
    if (uniformsCache.has(gltfPrimitive)) {
        return uniformsCache.get(gltfPrimitive)
    }

    const gltfMaterial = gltfPrimitive.material

    const uniforms = {
        alphaTest: new Uniform(gltfMaterial.alphaMode === 'MASK' ? 0.5 : -1)
    }

    if (gltfMaterial.pbrMetallicRoughness?.roughnessFactor !== undefined) {
        uniforms['shininess'] = 200 ** (1 - gltfMaterial.pbrMetallicRoughness.roughnessFactor)
    }

    uniformsCache.set()

    return uniforms
}
