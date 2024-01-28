import { Color } from "../../../math/Color.js"
import { GLSL_COMMON } from "../../programs/chunks/glslCommon.js"
import { GLSL_PBR } from "../../programs/chunks/glslPbr.js"
import { GLSL_SKINNED } from "../../programs/chunks/glslSkinnedChunk.js"
import { GlArrayBufferData } from "../../webgl/glDescriptors/GlArrayBufferData.js"
import { GlAttributeData } from "../../webgl/glDescriptors/GlAttributeData.js"
import { GlObjectData } from "../../webgl/glDescriptors/GlObjectData.js"
import { GlProgramData } from "../../webgl/glDescriptors/GlProgramData.js"
import { GlTextureData } from "../../webgl/glDescriptors/GlTextureData.js"
import { GlVaoData } from "../../webgl/glDescriptors/GlVaoData.js"
import { Node3D } from "../Node3D.js"
import { Animation } from "./skinned/animation/Animation.js"
import { Mixer } from "./skinned/animation/Mixer.js"

export class GltfManager {
    /** @type {WeakMap<GltfSkin, Animation>} */
    #animations = new WeakMap()
    getAnimation(/** @type {GltfSkin} */ gltfSkin) {
        if (!this.#animations.has(gltfSkin)) this.#animations.set(gltfSkin, new Animation(gltfSkin))
        return this.#animations.get(gltfSkin)
    }

    /** @type {WeakMap<GltfTexture, GlTextureData>} */
    #glTexturesData = new WeakMap()
    getGlTextureData(/** @type {GltfTexture} */ gltfTexture) {
        if (!this.#glTexturesData.has(gltfTexture)) this.#glTexturesData.set(gltfTexture, new GlTextureData({
            name: gltfTexture.name,
            data: gltfTexture.source,
            minFilter: gltfTexture.sampler.minFilter,
            magFilter: gltfTexture.sampler.magFilter,
            wrapS: gltfTexture.sampler.wrapS,
            wrapT: gltfTexture.sampler.wrapT
        }))
        return this.#glTexturesData.get(gltfTexture)
    }

    /**
     * @param {GltfNode} gltfNode
     */
    getNode3D(gltfNode) {
        const node3D = new Node3D()
        if (gltfNode.name) node3D.name = gltfNode.name
        if (gltfNode.translation) node3D.position.fromArray(gltfNode.translation)
        if (gltfNode.rotation) node3D.quaternion.fromArray(gltfNode.rotation)
        if (gltfNode.scale) node3D.scale.fromArray(gltfNode.scale)
        if (gltfNode.skin) {
            const animation = this.getAnimation(gltfNode.skin)
            node3D.mixer = new Mixer(animation)
        }

        for (const primitive of gltfNode.mesh.primitives) {

            /** @type {{[name: string]: WebGl.UniformData | GlTextureData}} */
            const uniforms = { [GLSL_COMMON.worldMatrix]: node3D.worldMatrix }

            if (node3D.mixer) uniforms[GLSL_SKINNED.jointsTexture] = node3D.mixer.jointsTexture

            if (primitive.material?.pbrMetallicRoughness) {
                const pbrMetallicRoughness = primitive.material.pbrMetallicRoughness
                if (pbrMetallicRoughness.baseColorFactor) uniforms[GLSL_COMMON.baseColor] = new Color(pbrMetallicRoughness.baseColorFactor)
                if (pbrMetallicRoughness.baseColorTexture) uniforms[GLSL_COMMON.baseTexture] = this.getGlTextureData(pbrMetallicRoughness.baseColorTexture)
                if (pbrMetallicRoughness.metallicFactor) uniforms[GLSL_PBR.metallic] = pbrMetallicRoughness.metallicFactor
                if (pbrMetallicRoughness.metallicRoughnessTexture) uniforms[GLSL_PBR.metallicRoughnessTexture] = this.getGlTextureData(pbrMetallicRoughness.metallicRoughnessTexture)
                if (pbrMetallicRoughness.roughnessFactor) uniforms[GLSL_PBR.roughness] = pbrMetallicRoughness.roughnessFactor
            }

            const attributesData = this.getAttribute(primitive.attributes)
            const glVaoData = new GlVaoData(attributesData, primitive.indices.buffer)

            const glObject = new GlObjectData({
                glVaoData,
                uniforms,
            })

            node3D.objects.add(glObject)
        }

        return node3D
    }


    getSplattingNode(gltfNode, glProgramData) {

    }

    /**
     * @param {GltfAttributes} attributes
     * @returns 
     */
    getAttribute(attributes) {
        const glAttributesData = []
        if (attributes.POSITION) {
            const attribute = attributes.POSITION
            const glArrayBufferData = new GlArrayBufferData(attribute.buffer)
            glAttributesData.push(new GlAttributeData({ glArrayBufferData, name: GLSL_COMMON.positionAttribute, size: 3, type: WebGL2RenderingContext.FLOAT }))
        }
        if (attributes.TEXCOORD_0) {
            const attribute = attributes.TEXCOORD_0
            const glArrayBufferData = new GlArrayBufferData(attribute.buffer)
            glAttributesData.push(new GlAttributeData({ glArrayBufferData, name: GLSL_COMMON.uvAttribute, size: 2, type: WebGL2RenderingContext.FLOAT }))
        }
        if (attributes.NORMAL) {
            const attribute = attributes.NORMAL
            const glArrayBufferData = new GlArrayBufferData(attribute.buffer)
            glAttributesData.push(new GlAttributeData({ glArrayBufferData, name: GLSL_COMMON.normalAttribute, size: 3, type: WebGL2RenderingContext.FLOAT }))
        }
        if (attributes.TANGENT) {
            const attribute = attributes.TANGENT
            const glArrayBufferData = new GlArrayBufferData(attribute.buffer)
            glAttributesData.push(new GlAttributeData({ glArrayBufferData, name: GLSL_COMMON.tangentAttribute, size: 3, type: WebGL2RenderingContext.FLOAT }))
        }
        if (attributes.JOINTS_0) {
            const attribute = attributes.JOINTS_0
            const glArrayBufferData = new GlArrayBufferData(attribute.buffer)
            glAttributesData.push(new GlAttributeData({ glArrayBufferData, name: GLSL_SKINNED.joints, size: 4, type: WebGL2RenderingContext.UNSIGNED_BYTE }))
        }
        if (attributes.WEIGHTS_0) {
            const attribute = attributes.WEIGHTS_0
            const glArrayBufferData = new GlArrayBufferData(attribute.buffer)
            glAttributesData.push(new GlAttributeData({ glArrayBufferData, name: GLSL_SKINNED.weights, size: 4, type: WebGL2RenderingContext.FLOAT }))
        }

        return glAttributesData
    }
}
