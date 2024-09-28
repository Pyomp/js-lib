import { Box3 } from "../../../math/Box3.js"
import { Vector3 } from "../../../math/Vector3.js"
import { TextureObject } from "../../extras/TextureObject.js"
import { GLSL_AMBIENT_LIGHT } from "../../programs/chunks/glslAmbient.js"
import { GLSL_CAMERA } from "../../programs/chunks/glslCamera.js"
import { GLSL_POINT_LIGHT } from "../../programs/chunks/glslPointLight.js"
import { GLSL_WINDOW } from "../../programs/chunks/glslWindow.js"
import { AmbientLight } from "../../sceneGraph/AmbientLight.js"
import { Camera } from "../../sceneGraph/Camera.js"
import { Node3D } from "../../sceneGraph/Node3D.js"
import { PointLight } from "../../sceneGraph/PointLight.js"
import { Particle } from "../../sceneGraph/particle/Particle.js"
import { GlDepthTextureData } from "../../textures/DepthTexture.js"
import { GlContextRenderer } from "../glContext/GlContextRenderer.js"
import { GlFrameBuffer } from "../glDescriptors/GlFrameBuffer.js"
import { GlObject } from "../glDescriptors/GlObject.js"
import { GlAmbientLightRenderer } from "./GlAmbientLightRenderer.js"
import { GlCameraUbo } from "./GlCameraUbo.js"
import { GlPointLightRenderer } from "./GlPointLightRenderer.js"
import { GlWindowInfo } from "./GlWindowInfo.js"
import { GlParticleRenderer } from "./ParticlesRenderer/GlParticleRenderer.js"

const _box3 = new Box3()

export class GlRenderer {
    htmlElement = document.createElement('div')

    scene = new Node3D()

    camera = new Camera({})
    #cameraUbo = new GlCameraUbo(this.camera)

    windowInfo = new GlWindowInfo()
    depthTexture = new GlDepthTextureData()
    depthFrameBuffer = new GlFrameBuffer({ [WebGL2RenderingContext.DEPTH_ATTACHMENT]: this.depthTexture })

    pointLightRenderer = new GlPointLightRenderer()
    get pointLightCount() { return this.pointLightRenderer.uboPointLightCount }

    ambientLightRenderer = new GlAmbientLightRenderer()

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

        this.glContext = new GlContextRenderer(
            canvas,
            undefined,
            {
                [GLSL_CAMERA.uboName]: this.#cameraUbo.glUboData,
                [GLSL_AMBIENT_LIGHT.uboName]: this.ambientLightRenderer.glUboData,
                [GLSL_POINT_LIGHT.uboName]: this.pointLightRenderer.glUboData,
                [GLSL_WINDOW.uboName]: this.windowInfo.glUboData
            },
        )
        // TODO dispose previous windowInfo 
        this.windowInfo.initGl(this.glContext)

        this.particleRenderer = new GlParticleRenderer({ glContext: this.glContext, glDepthTextureData: this.depthTexture, maxParticleCount: 100_000 })
        this.glContext.resizeListeners.add(this.onResize.bind(this))
    }

    onResize(width, height) {
        this.camera.aspect = width / height

        this.depthTexture.width = width
        this.depthTexture.height = height
        this.depthTexture.paramsVersion++
    }

    resetGlStates() {
        this.glContext.freeAllGlProgram()
    }

    /** @param {Node3D[]} nodesToDraw  */
    getObjectsToDraw(nodesToDraw) {
        const objectsToDraw = getObjectsInFrustum(nodesToDraw, this.camera.frustum)

        const [opaque, transparent] = sortTransparencyObjects(objectsToDraw)

        opaque.sort(this.compareObjectDrawOptimizationBound)
        transparent.sort(this.compareObjectDrawOptimizationBound)

        return [opaque, transparent]
    }

    render() {
        this.glContext.updateCache()
        const gl = this.glContext.gl
        this.scene.updateWorldMatrix()

        this.camera.update()
        this.#cameraUbo.update()

        /** @type {PointLight[]} */
        const pointLights = []
        /** @type {AmbientLight[]} */
        const ambientLights = []
        /** @type {Particle[]} */
        const particlesToAdd = []
        /** @type {GlObject[]} */
        const gpgpuObjects = []
        /** @type {Set<Node3D>} */
        const node3Ds = new Set()

        this.scene.traverse((node) => {
            if (node.mixer) node.mixer.updateTime()
            for (const object of node.objects) {
                if (object instanceof PointLight) {
                    object.updateWorldPosition(node.worldMatrix)
                    pointLights.push(object)
                } else if (object instanceof AmbientLight) {
                    ambientLights.push(object)
                } else if (object instanceof Particle) {
                    particlesToAdd.push(object)
                    node.objects.delete(object)
                } else if (object instanceof GlObject) {
                    if (object.glProgram.glTransformFeedback) {
                        gpgpuObjects.push(object)
                    } else {
                        node3Ds.add(node)
                    }
                }
            }
        })

        this.ambientLightRenderer.updateUbo(ambientLights)
        this.pointLightRenderer.updateUbo(pointLights)

        this.glContext.updateGlobalUbos()

        for (const particle of particlesToAdd) {
            this.particleRenderer.addParticle(particle)
        }

        this.glContext.discardRasterizer()

        this.particleRenderer.update()

        this.glContext.drawObject(this.particleRenderer.particlePhysicsGlObject)

        for (const object of gpgpuObjects) {
            this.glContext.drawObject(object)
        }
        this.glContext.enableRasterizer()

        const nodesInFrustum = getNodesInFrustum(node3Ds, this.camera.frustum)
        for (const node of nodesInFrustum) if (node.mixer) node.mixer.updateJointsTexture()

        const [opaqueObjects, transparentObjects] = this.getObjectsToDraw(nodesInFrustum)

        gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT)

        for (const object of opaqueObjects) {
            this.glContext.drawObject(object)
        }

        this.glContext.getGlFrameBuffer(this.depthFrameBuffer).blit(null, this.windowInfo.width, this.windowInfo.height)

        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, null)

        for (const object of transparentObjects) {
            this.glContext.drawObject(object)
        }

        this.glContext.drawObject(this.particleRenderer.particleRenderObject)
    }

    #lastProgramId = 0
    #programCache = new WeakMap()
    #lastVaoId = 0
    #vaoCache = new WeakMap()
    #objectState = new WeakMap()

    compareObjectDrawOptimizationBound = this.compareObjectDrawOptimization.bind(this)

    /**
     * 
     * @param {GlObject} a 
     * @param {GlObject} b 
     * @returns 
     */
    compareObjectDrawOptimization(a, b) {
        if (!this.#programCache.has(a.glProgram)) this.#programCache.set(a.glProgram, this.#lastProgramId++)
        if (!this.#programCache.has(b.glProgram)) this.#programCache.set(b.glProgram, this.#lastProgramId++)
        const materialIdA = this.#programCache.get(a.glProgram)
        const materialIdB = this.#programCache.get(b.glProgram)
        if (materialIdA !== materialIdB) return materialIdA - materialIdB

        if (!this.#vaoCache.has(a.glVao)) this.#vaoCache.set(a.glVao, this.#lastVaoId++)
        if (!this.#vaoCache.has(b.glVao)) this.#vaoCache.set(b.glVao, this.#lastVaoId++)
        const geometryIdA = this.#vaoCache.get(a.glVao)
        const geometryIdB = this.#vaoCache.get(b.glVao)
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

function getObjectStateId(/** @type {GlObject} */ object) {
    let id = 0

    if (object.additiveBlending) id |= 0x0000_0001
    if (object.frontCullFace) id |= 0x0000_0010
    if (object.depthTest) id |= 0x0000_0100
    if (object.depthWrite) id |= 0x0000_1000
    if (object.backCullFace) id |= 0x0001_0000

    return id
}

function sortTransparencyObjects(/** @type {GlObject[]} */ objects) {
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

function getNodesInFrustum(node3Ds, frustum) {
    /** @type {Node3D[]} */
    const nodes = []

    for (const node of node3Ds) {
        const boundingBox = node.boundingBox

        if (boundingBox.isEmpty()
            || frustum.intersectsBox(
                _box3.copy(boundingBox).translate(node.position))
        ) {
            nodes.push(node)
        }
    }

    return nodes
}

function getObjectsInFrustum(/** @type {Node3D[]} */ nodes, frustum) {
    /** @type {GlObject[]} */
    const result = []

    for (const node of nodes) {
        for (const object of node.objects) {
            if (object instanceof GlObject && !object.glProgram.glTransformFeedback) {
                if (object.glVao) {
                    const boundingBox = object.glVao.boundingBox

                    if (
                        boundingBox.isEmpty()
                        || frustum.intersectsBox(
                            _box3.copy(boundingBox).translate(node.position))
                    ) {
                        result.push(object)
                    }
                } else {
                    result.push(object)
                }
            }
        }
    }

    return result
}
