import { Box3 } from "../../math/Box3.js"
import { GlContext } from "../GlContext.js"
import { GlProgram } from "../GlProgram.js"
import { GlTexture } from "../GlTexture.js"
import { GlVao } from "../GlVao.js"
import { Camera } from "./Camera.js"
import { Material } from "./Material.js"
import { Node3D } from "./Node3D.js"
import { Object3D } from "./Object3D.js"
import { Scene } from "./Scene.js"
import { Texture } from "./Texture.js"

const _box3 = new Box3()

export class Renderer {
    canvas = document.createElement('canvas')

    scene = new Scene()

    camera = new Camera()

    constructor() {
        this.canvas.style.top = '0'
        this.canvas.style.left = '0'
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'
        this.canvas.style.zIndex = '-1'
        this.canvas.style.position = 'fixed'

        this.initGl()
    }

    initGl() {
        this.glContext = new GlContext(this.canvas)
    }

    /** @type {Map<Material, GlProgram>} */
    #programMap = new Map()

    #vaoMap = new Map()

    /** @type {Map<Texture, GlTexture>} */
    #textureMap = new Map()

    render() {
        this.scene.updateWorldMatrix()
        this.camera.update()

        const nodesToDraw = getNodesInFrustum(this.scene, this.camera.frustum)

        for (const node of nodesToDraw) { node.animation.updateBoneMatrix() }

        const objectsToDraw = getObjectsInFrustum(nodesToDraw, this.camera.frustum)

        const [opaqueObjects, transparentObjects] = sortTransparencyObjects(objectsToDraw)

        opaqueObjects.sort(this.compareObjectDrawOptimizationBound)
        transparentObjects.sort(this.compareObjectDrawOptimizationBound)

        /////// WebGL part ///////

        let material, program
        let attributes

        for (const object of opaqueObjects) {
            if (material !== object.material) {
                material = object.material

                if (!this.#programMap.has(material)) {
                    this.#programMap.set(material, new GlProgram(
                        this.glContext.gl,
                        material.vertexShader,
                        material.fragmentShader
                    ))
                }

                program = this.#programMap.get(material)
                program.useProgram()

                this.#bindUniforms(program, material.uniforms)

                this.#bindTextures(program, material.textures)
            }

            if (attributes !== object.attributes) {
                attributes = object.attributes

                if (!this.#vaoMap.has(attributes)) {
                    this.#vaoMap.set(attributes, new GlVao(
                        this.glContext.gl,
                        program,
                        attributes,
                        object.indices
                    ))
                }

                const vao = this.#vaoMap.get(material)
                vao.bind()
            }

            this.glContext.cullFace = object.cullFace
            this.glContext.blending = object.blending
            this.glContext.depthTest = object.depthTest
            this.glContext.depthWrite = object.depthWrite

            this.#bindUniforms(program, object.uniforms)

            this.#bindTextures(program, object.textures)
        }
    }

    #bindUniforms(program, uniforms) {
        for (const key in uniforms) {
            const uniform = uniforms[key]
            if (uniform.needsUpdate) {
                uniform.needsUpdate = false
                program.uniformUpdate[key](uniform.data)
            }
        }
    }

    /**
     * 
     * @param {GlProgram} program 
     * @param {Texture[]} textures 
     */
    #bindTextures(program, textures) {
        for (const key in textures) {
            const texture = textures[key]
            if (!this.#textureMap.has(texture)) this.#textureMap.set(texture, new GlTexture({
                gl: this.glContext.gl,
                ...texture
            }))

            const glTexture = this.#textureMap.get(texture)

            if (texture.needsUpdate) {
                texture.needsUpdate = true
                glTexture.updateData(texture.data)
            }

            glTexture.bindToUnit(program.textureUnit[key])
        }
    }

    #lastProgramId = 0
    #programCache = new WeakMap()
    #lastVaoId = 0
    #vaoCache = new WeakMap()
    #objectState = new WeakMap()

    compareObjectDrawOptimizationBound = this.compareObjectDrawOptimization.bind(this)
    compareObjectDrawOptimization(a, b) {
        if (!this.#programCache.has(a.material)) this.#programCache.set(a.material, this.#lastProgramId++)
        if (!this.#programCache.has(b.material)) this.#programCache.set(b.material, this.#lastProgramId++)
        const materialIdA = this.#programCache.get(a.material)
        const materialIdB = this.#programCache.get(b.material)
        if (materialIdA !== materialIdB) return materialIdA - materialIdB

        if (!this.#vaoCache.has(a.attributes)) this.#vaoCache.set(a.attributes, this.#lastVaoId++)
        if (!this.#vaoCache.has(b.attributes)) this.#vaoCache.set(b.attributes, this.#lastVaoId++)
        const attributesIdA = this.#vaoCache.get(a.attributes)
        const attributesIdB = this.#vaoCache.get(b.attributes)
        if (attributesIdA !== attributesIdB) return attributesIdA - attributesIdB

        if (!this.#objectState.has(a)) this.#objectState.set(a, getObjectStateId(a))
        if (!this.#objectState.has(b)) this.#objectState.set(b, getObjectStateId(b))
        const stateIdA = this.#objectState.get(a)
        const stateIdB = this.#objectState.get(b)
        if (stateIdA !== stateIdB) return attributesIdA - attributesIdB

        return 0
    }
}

function getObjectStateId(/** @type {Object3D} */ object) {
    let id = 0
    if (object.blending) id |= 0x0000_0001
    if (object.cullFace) id |= 0x0000_0010
    if (object.depthTest) id |= 0x0000_0100
    if (object.depthWrite) id |= 0x0000_1000
    return id
}

function sortTransparencyObjects(/** @type {Object3D[]} */ objects) {
    const opaque = []
    const transparent = []

    for (const object of objects) {
        if (object.blending) {
            transparent.push(object)
        } else {
            opaque.push(object)
        }
    }

    return [opaque, transparent]
}

function getNodesInFrustum(scene, frustum) {
    const nodes = []

    scene.traverse((node) => {
        const boundingBox = node.boundingBox

        if (!boundingBox
            || frustum.intersectsBox(
                _box3.copy(boundingBox).translate(node.position))
        ) {
            nodes.push(node)
        }
    })

    return nodes
}

function getObjectsInFrustum(/** @type {Node3D[]} */ nodes, frustum) {
    /** @type {Object3D[]} */
    const result = []

    for (const node of nodes) {
        for (const object of node.objects) {
            const boundingBox = object.boundingBox

            if (!boundingBox
                || frustum.intersectsBox(
                    _box3.copy(boundingBox).translate(node.position))
            ) {
                result.push(object)
            }
        }
    }

    return result
}
