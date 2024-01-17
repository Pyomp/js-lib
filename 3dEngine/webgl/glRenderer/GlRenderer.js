import { Box3 } from "../../../math/Box3.js"
import { GLSL_CAMERA } from "../../programs/chunks/glslCamera.js"
import { Camera } from "../../sceneGraph/Camera.js"
import { Node3D } from "../../sceneGraph/Node3D.js"
import { Scene } from "../../sceneGraph/Scene.js"
import { GlContext } from "../glContext/GlContext.js"
import { GlObjectData } from "../glDescriptors/GlObjectData.js"
import { GlCameraUbo } from "./GlCameraUbo.js"

const _box3 = new Box3()

export class GlRenderer {
    htmlElement = document.createElement('div')

    scene = new Scene()

    camera = new Camera({})
    #cameraUbo = new GlCameraUbo(this.camera)

    constructor() {
        this.htmlElement.style.top = '0'
        this.htmlElement.style.left = '0'
        this.htmlElement.style.width = '100%'
        this.htmlElement.style.height = '100%'
        this.htmlElement.style.position = 'absolute'

        this.initGl()
    }

    onContextLost() {
        this.initGl()
    }

    initGl() {
        const canvas = document.createElement('canvas')
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.addEventListener("webglcontextlost", this.onContextLost.bind(this))

        this.htmlElement.innerHTML = ''
        this.htmlElement.appendChild(canvas)


        this.glContext = new GlContext(canvas, undefined, {
            [GLSL_CAMERA.uboName]: this.#cameraUbo.glUboData
        })
        this.glContext.resizeListeners.add(this.onResize.bind(this))
    }

    onResize(width, height) {
        this.camera.aspect = width / height
    }

    // #deleteToBeDeleted() {
    //     for (const [material, program] of this.#programMap) {
    //         if (material.needsDelete) {
    //             program.dispose()
    //             this.#programMap.delete(material)
    //         }
    //     }
    //     for (const [geometry, vao] of this.#vaoMap) {
    //         if (geometry.needsDelete) {
    //             vao.dispose()
    //             this.#vaoMap.delete(geometry)
    //         }
    //     }
    //     for (const [texture, glTexture] of this.#textureMap) {
    //         if (texture.needsDelete) {
    //             glTexture.dispose()
    //             this.#textureMap.delete(texture)
    //         }
    //     }
    // }

    resetGlStates() {
        this.glContext.freeAllGlProgram()
    }

    /** @param {Node3D[]} nodesToDraw  */
    getObjectsToDraw(nodesToDraw) {
        const objectsToDraw = getObjectsInFrustum(nodesToDraw, this.camera.frustum)

        for (const object of this.scene.objects) {
            // if (object.geometry.boundingBox.isEmpty() || this.camera.frustum.intersectsBox(_box3.copy(object.geometry.boundingBox))) {
            objectsToDraw.push(object)
            // }
        }

        const [opaque, transparent] = sortTransparencyObjects(objectsToDraw)

        opaque.sort(this.compareObjectDrawOptimizationBound)
        transparent.sort(this.compareObjectDrawOptimizationBound)

        return [opaque, transparent]
    }

    /**
     * 
     * @param {number} deltatimeSecond 
     */
    render(deltatimeSecond) {
        const gl = this.glContext.gl
        this.scene.updateWorldMatrix()

        this.camera.update()
        this.#cameraUbo.update()

        this.glContext.updateGlobalUbos()

        this.scene.traverse((node) => { if (node.mixer) node.mixer.updateTime(deltatimeSecond) })

        const nodesToDraw = getNodesInFrustum(this.scene, this.camera.frustum)
        for (const node of nodesToDraw) if (node.mixer) node.mixer.updateBuffer()

        const [opaqueObjects, transparentObjects] = this.getObjectsToDraw(nodesToDraw)

        gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT)

        for (const object of opaqueObjects) {
            this.glContext.drawObject(object)
        }

        // blit(gl, null, this.particles.depthFrameBuffer, this.windowInfoRenderer.width, this.windowInfoRenderer.height)
        // gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, null)

        for (const object of transparentObjects) {
            this.glContext.drawObject(object)
        }
    }

    #lastProgramId = 0
    #programCache = new WeakMap()
    #lastVaoId = 0
    #vaoCache = new WeakMap()
    #objectState = new WeakMap()

    compareObjectDrawOptimizationBound = this.compareObjectDrawOptimization.bind(this)
    /**
     * 
     * @param {GlObjectData} a 
     * @param {GlObjectData} b 
     * @returns 
     */
    compareObjectDrawOptimization(a, b) {
        if (!this.#programCache.has(a.glProgramData)) this.#programCache.set(a.glProgramData, this.#lastProgramId++)
        if (!this.#programCache.has(b.glProgramData)) this.#programCache.set(b.glProgramData, this.#lastProgramId++)
        const materialIdA = this.#programCache.get(a.glProgramData)
        const materialIdB = this.#programCache.get(b.glProgramData)
        if (materialIdA !== materialIdB) return materialIdA - materialIdB

        if (!this.#vaoCache.has(a.glVaoData)) this.#vaoCache.set(a.glVaoData, this.#lastVaoId++)
        if (!this.#vaoCache.has(b.glVaoData)) this.#vaoCache.set(b.glVaoData, this.#lastVaoId++)
        const geometryIdA = this.#vaoCache.get(a.glVaoData)
        const geometryIdB = this.#vaoCache.get(b.glVaoData)
        if (geometryIdA !== geometryIdB) return geometryIdA - geometryIdB

        if (!this.#objectState.has(a)) this.#objectState.set(a, getObjectStateId(a))
        if (!this.#objectState.has(b)) this.#objectState.set(b, getObjectStateId(b))
        const stateIdA = this.#objectState.get(a)
        const stateIdB = this.#objectState.get(b)
        if (stateIdA !== stateIdB) return stateIdA - stateIdB

        return 0
    }

    loseContext() {
        this.glContext.gl.getExtension("WEBGL_lose_context").loseContext()
    }
}

function getObjectStateId(/** @type {GlObjectData} */ object) {
    let id = 0

    if (object.additiveBlending) id |= 0x0000_0001
    if (object.cullFace) id |= 0x0000_0010
    if (object.depthTest) id |= 0x0000_0100
    if (object.depthWrite) id |= 0x0000_1000

    return id
}

function sortTransparencyObjects(/** @type {GlObjectData[]} */ objects) {
    const opaque = []
    const transparent = []

    for (const object of objects) {
        if (object.normalBlending || object.additiveBlending) {
            transparent.push(object)
        } else {
            opaque.push(object)
        }
    }

    return [opaque, transparent]
}

function getNodesInFrustum(scene, frustum) {
    /** @type {Node3D[]} */
    const nodes = []

    scene.traverse((node) => {
        const boundingBox = node.boundingBox

        if (boundingBox.isEmpty()
            || frustum.intersectsBox(
                _box3.copy(boundingBox).translate(node.position))
        ) {
            nodes.push(node)
        }
    })

    return nodes
}

function getObjectsInFrustum(/** @type {Node3D[]} */ nodes, frustum) {
    /** @type {GlObjectData[]} */
    const result = []

    for (const node of nodes) {
        for (const object of node.objects) {
            // const boundingBox = object.geometry.boundingBox

            // if (boundingBox.isEmpty()
            //     || frustum.intersectsBox(
            //         _box3.copy(boundingBox).translate(node.position))
            // ) {
            result.push(object)
            // }
        }
    }

    return result
}
