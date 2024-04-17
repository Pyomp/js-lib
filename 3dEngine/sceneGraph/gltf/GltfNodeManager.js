import { Color } from "../../../math/Color.js"
import { GLSL_COMMON } from "../../programs/chunks/glslCommon.js"
import { GLSL_PBR } from "../../programs/chunks/glslPbr.js"
import { GLSL_SKINNED } from "../../programs/chunks/glslSkinnedChunk.js"
import { GlArrayBuffer } from "../../webgl/glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../../webgl/glDescriptors/GlAttribute.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlProgram } from "../../webgl/glDescriptors/GlProgram.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlVao } from "../../webgl/glDescriptors/GlVao.js"
import { Node3D } from "../Node3D.js"
import { Animation } from "./skinned/animation/Animation.js"
import { Mixer } from "./skinned/animation/Mixer.js"

function getGlTextureData(/** @type {GltfTexture} */ gltfTexture) {
    return new GlTexture({
        name: gltfTexture.name,
        data: gltfTexture.source.htmlImageElement,
        minFilter: gltfTexture.sampler.minFilter,
        magFilter: gltfTexture.sampler.magFilter,
        wrapS: gltfTexture.sampler.wrapS,
        wrapT: gltfTexture.sampler.wrapT
    })
}

/**
 * @param {GltfAttributes} attributes
 * @returns 
 */
function getAttribute(attributes) {
    const glAttributesData = []
    if (attributes.POSITION) {
        const attribute = attributes.POSITION
        const glArrayBufferData = new GlArrayBuffer(attribute.buffer)
        glAttributesData.push(new GlAttribute({ glArrayBuffer: glArrayBufferData, name: GLSL_COMMON.positionAttribute, size: 3, type: WebGL2RenderingContext.FLOAT }))
    }
    if (attributes.TEXCOORD_0) {
        const attribute = attributes.TEXCOORD_0
        const glArrayBufferData = new GlArrayBuffer(attribute.buffer)
        glAttributesData.push(new GlAttribute({ glArrayBuffer: glArrayBufferData, name: GLSL_COMMON.uvAttribute, size: 2, type: WebGL2RenderingContext.FLOAT }))
    }
    if (attributes.NORMAL) {
        const attribute = attributes.NORMAL
        const glArrayBufferData = new GlArrayBuffer(attribute.buffer)
        glAttributesData.push(new GlAttribute({ glArrayBuffer: glArrayBufferData, name: GLSL_COMMON.normalAttribute, size: 3, type: WebGL2RenderingContext.FLOAT }))
    }
    if (attributes.TANGENT) {
        const attribute = attributes.TANGENT
        const glArrayBufferData = new GlArrayBuffer(attribute.buffer)
        glAttributesData.push(new GlAttribute({ glArrayBuffer: glArrayBufferData, name: GLSL_COMMON.tangentAttribute, size: 3, type: WebGL2RenderingContext.FLOAT }))
    }
    if (attributes.JOINTS_0) {
        const attribute = attributes.JOINTS_0
        const glArrayBufferData = new GlArrayBuffer(attribute.buffer)
        glAttributesData.push(new GlAttribute({ glArrayBuffer: glArrayBufferData, name: GLSL_SKINNED.joints, size: 4, type: WebGL2RenderingContext.UNSIGNED_BYTE }))
    }
    if (attributes.WEIGHTS_0) {
        const attribute = attributes.WEIGHTS_0
        const glArrayBufferData = new GlArrayBuffer(attribute.buffer)
        glAttributesData.push(new GlAttribute({ glArrayBuffer: glArrayBufferData, name: GLSL_SKINNED.weights, size: 4, type: WebGL2RenderingContext.FLOAT }))
    }

    return glAttributesData
}

function getGlObjectData(
    /** @type {GltfPrimitive} */ primitive,
    /** @type {GlProgram} */  glProgram = undefined,
    extraUniforms = {},
) {
    /** @type {{[name: string]: WebGl.UniformData | GlTexture}} */
    const uniforms = {}

    if (primitive.material) {
        const material = primitive.material
        uniforms[GLSL_COMMON.alphaTest] = material.alphaMode === 'MASK' ? 0.1 : 0
        if (material.pbrMetallicRoughness) {
            const pbrMetallicRoughness = primitive.material.pbrMetallicRoughness
            if (pbrMetallicRoughness.baseColorFactor) uniforms[GLSL_COMMON.baseColor] = new Color(pbrMetallicRoughness.baseColorFactor)
            if (pbrMetallicRoughness.baseColorTexture) uniforms[GLSL_COMMON.baseTexture] = getGlTextureData(pbrMetallicRoughness.baseColorTexture)
            if (pbrMetallicRoughness.metallicFactor) uniforms[GLSL_PBR.metallic] = pbrMetallicRoughness.metallicFactor
            if (pbrMetallicRoughness.metallicRoughnessTexture) uniforms[GLSL_PBR.metallicRoughnessTexture] = getGlTextureData(pbrMetallicRoughness.metallicRoughnessTexture)
            if (pbrMetallicRoughness.roughnessFactor) uniforms[GLSL_PBR.roughness] = pbrMetallicRoughness.roughnessFactor
        }
    }

    for (const key in extraUniforms) {
        uniforms[key] = extraUniforms[key]
    }

    const attributesData = getAttribute(primitive.attributes)
    const glVaoData = new GlVao(attributesData, primitive.indices.buffer)

    return new GlObject({
        glProgram: glProgram,
        glVao: glVaoData,
        uniforms
    })
}


function getGlObjectsData(
    /** @type {GltfPrimitive[]} */ primitives,
    /** @type {GlProgram} */  glProgram = undefined,
    extraUniforms = {},
) {
    const objects = []

    for (const primitive of primitives) {
        objects.push(getGlObjectData(primitive, glProgram, extraUniforms))
    }

    return objects
}

function disposeDefaultGltfGlObject(glObject) {
    glObject.glVao.needsDelete = true
    if (glObject.uniforms[GLSL_COMMON.baseTexture]) glObject.uniforms[GLSL_COMMON.baseTexture].needsDelete = true
    if (glObject.uniforms[GLSL_PBR.metallicRoughnessTexture]) glObject.uniforms[GLSL_PBR.metallicRoughnessTexture].needsDelete = true
}

function getNode3DWithoutObjects({
    /** @type {GltfNode} */ gltfNode,
    animationDictionary
}) {
    const node3D = new Node3D()
    if (gltfNode.name) node3D.name = gltfNode.name
    if (gltfNode.translation) node3D.position.fromArray(gltfNode.translation)
    if (gltfNode.rotation) node3D.quaternion.fromArray(gltfNode.rotation)
    if (gltfNode.scale) node3D.scale.fromArray(gltfNode.scale)
    if (gltfNode.skin) {
        node3D.mixer = new Mixer(new Animation(gltfNode.skin, animationDictionary))
    }

    return node3D
}

function linkObjectToNode(
    /** @type {Node3D} */ node3D,
    /** @type {GlObject} */ object
) {
    node3D.objects.add(object)
    const uniforms = object.uniforms
    uniforms[GLSL_COMMON.worldMatrix] = node3D.worldMatrix
    if (node3D.mixer) uniforms[GLSL_SKINNED.jointsTexture] = node3D.mixer.jointsTexture
}


function linkObjectsToNode(
    /** @type {Node3D} */ node3D,
    /** @type {GlObject[]} */ objects
) {
    for (const object of objects) {
        linkObjectToNode(node3D, object)
    }
}

function getNode3D({
    gltfNode,
    extraUniforms = {},
    animationDictionary = {},
    glProgramData = undefined,
}) {
    const node3D = getNode3DWithoutObjects({
        gltfNode,
        animationDictionary
    })

    const objects = getGlObjectsData(gltfNode.mesh.primitives, glProgramData, extraUniforms)

    linkObjectsToNode(node3D, objects)

    return node3D
}

export class GltfNodeManager {
    static getNode3DWithoutObjects = getNode3DWithoutObjects
    static linkObjectToNode = linkObjectToNode
    static linkObjectsToNode = linkObjectsToNode
    static getGlTextureData = getGlTextureData
    static getAttribute = getAttribute
    static getGlObjectData = getGlObjectData
    static getGlObjectsData = getGlObjectsData
    static getNode3D = getNode3D
    static disposeDefaultGltfGlObject = disposeDefaultGltfGlObject

    /** @type {Node3D} */ #node3D

    /**
     * @param {{
     *      gltfNode: GltfNode
     *      glProgramData?: GlProgram
     *      extraUniforms?: {[name: string]: WebGl.UniformData}
     *      animationDictionary?: {[gltfAnimationName: string]: string | number}
     * }} params
     */
    constructor({
        gltfNode,
        glProgramData = undefined,
        extraUniforms = {},
        animationDictionary = {}
    }) {
        this.#node3D = getNode3D({
            gltfNode,
            glProgramData,
            extraUniforms,
            animationDictionary
        })
    }

    getNode(glProgram) {
        const node = new Node3D()

        return this.#node3D.clone()
    }

    dispose() {
        for (const object of this.#node3D.objects) {
            if (object instanceof GlObject) {
                disposeDefaultGltfGlObject(object)
            }
        }

        this.#node3D.dispose()
    }
}
