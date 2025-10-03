import { Box3 } from "../../../math/Box3.js"
import { Frustum } from "../../../math/Frustum.js"
import { Vector3 } from "../../../math/Vector3.js"
import { GLSL_AMBIENT_LIGHT } from "../../programs/chunks/glslAmbient.js"
import { GLSL_CAMERA } from "../../programs/chunks/glslCamera.js"
import { GLSL_POINT_LIGHT } from "../../programs/chunks/glslPointLight.js"
import { GLSL_WINDOW } from "../../programs/chunks/glslWindow.js"
import { AmbientLight } from "../../sceneGraph/AmbientLight.js"
import { Camera } from "../../sceneGraph/Camera.js"
import { Node3D } from "../../sceneGraph/Node3D.js"
import { PointLight } from "../../sceneGraph/PointLight.js"
import { ParticleSystemObject } from "../../sceneGraph/objects/ParticleSystemObject.js"
import { Particle } from "../../sceneGraph/particle/Particle.js"
import { GlDepthTextureData } from "../../textures/DepthTexture.js"
import { GlContextRenderer } from "../glContext/GlContextRenderer.js"
import { GlFrameBuffer } from "../glDescriptors/GlFrameBuffer.js"
import { GlObject } from "../glDescriptors/GlObject.js"
import { GlTexture } from "../glDescriptors/GlTexture.js"
import { GlAmbientLightRenderer } from "./GlAmbientLightRenderer.js"
import { GlCameraUbo } from "./GlCameraUbo.js"
import { GlPointLightRenderer } from "./GlPointLightRenderer.js"
import { GlWindowInfo } from "./GlWindowInfo.js"
import { OpaqueLightingPostprocessingObject } from "./OpaqueLightingPostprocessingObject.js"

const _box3 = new Box3()
const _vector3 = new Vector3()

export class GlRenderer {
    htmlElement = document.createElement('div')

    /** @type {GlContextRenderer} */ glContext

    scene = new Node3D()

    camera = new Camera({})
    #cameraUbo = new GlCameraUbo(this.camera)

    windowInfo = new GlWindowInfo()
    depthTexture = new GlDepthTextureData()

    pointLightRenderer = new GlPointLightRenderer()
    get pointLightCount() { return this.pointLightRenderer.uboPointLightCount }

    ambientLightRenderer = new GlAmbientLightRenderer()

    deferredTextures = {
        color: new GlTexture({
            name: 'objectColorTexture',
            wrapS: 'CLAMP_TO_EDGE', wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST', magFilter: 'NEAREST',
            internalformat: 'RGB8',
            width: 1, height: 1, border: 0,
            format: 'RGB', type: 'UNSIGNED_BYTE',
            data: null,
            needsMipmap: false
        }),
        positionDepth: new GlTexture({
            name: 'objectPositionTexture',
            wrapS: 'CLAMP_TO_EDGE', wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST', magFilter: 'NEAREST',
            internalformat: 'RGBA32I',
            width: 1, height: 1, border: 0,
            format: 'RGBA_INTEGER', type: 'INT',
            data: null,
            needsMipmap: false
        }),
        normal: new GlTexture({
            name: 'objectPositionTexture',
            wrapS: 'CLAMP_TO_EDGE', wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST', magFilter: 'NEAREST',
            internalformat: 'RGBA32I',
            width: 1, height: 1, border: 0,
            format: 'RGBA_INTEGER', type: 'INT',
            data: null,
            needsMipmap: false
        })
    }

    opaqueFrameBuffer = new GlFrameBuffer({
        [WebGL2RenderingContext.COLOR_ATTACHMENT0]: this.deferredTextures.color,
        [WebGL2RenderingContext.COLOR_ATTACHMENT1]: this.deferredTextures.positionDepth,
        [WebGL2RenderingContext.COLOR_ATTACHMENT2]: this.deferredTextures.normal,
        [WebGL2RenderingContext.DEPTH_ATTACHMENT]: this.depthTexture
    })

    opaqueLightingPostprocessingObject = new OpaqueLightingPostprocessingObject({
        renderer: this,
    })

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
            {
                alpha: true,
                antialias: false,
                depth: true,
                failIfMajorPerformanceCaveat: false,
                powerPreference: 'default',
                premultipliedAlpha: true,
                preserveDrawingBuffer: false,
                stencil: false
            },
            {
                [GLSL_CAMERA.uboName]: this.#cameraUbo.glUboData,
                [GLSL_AMBIENT_LIGHT.uboName]: this.ambientLightRenderer.glUboData,
                [GLSL_POINT_LIGHT.uboName]: this.pointLightRenderer.glUboData,
                [GLSL_WINDOW.uboName]: this.windowInfo.glUboData
            },
        )
        // TODO dispose previous windowInfo 
        this.windowInfo.initGl(this.glContext)

        this.glContext.resizeListeners.add(this.onResize.bind(this))
    }

    onResize(
        /** @type {number} */ width,
        /** @type {number} */  height
    ) {
        this.camera.aspect = width / height

        this.depthTexture.resize(width, height)

        this.deferredTextures.color.resize(width, height)
        this.deferredTextures.positionDepth.resize(width, height)
        this.deferredTextures.normal.resize(width, height)

        this.opaqueLightingPostprocessingObject.resize(width, height)
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
        /** @type {GlObject[]} */
        const gpgpuObjects = []
        /** @type {Node3D[]} */
        const node3Ds = []

        this.scene.traverse((node) => {
            if (node.mixer) node.mixer.updateTime()
            for (const object of node.objects) {
                if (object instanceof PointLight) {
                    object.updateWorldPosition(node.worldMatrix)
                    pointLights.push(object)
                } else if (object instanceof AmbientLight) {
                    ambientLights.push(object)
                } else if (object instanceof GlObject) {
                    if (object.glProgram.glTransformFeedback) {
                        gpgpuObjects.push(object)
                    } else {
                        node3Ds.push(node)
                    }
                }
            }
        })

        this.ambientLightRenderer.updateUbo(ambientLights)
        this.pointLightRenderer.updateUbo(pointLights)

        this.glContext.updateGlobalUbos()

        // # GPGPU
        if (gpgpuObjects.length > 0) {
            this.glContext.discardRasterizer()

            for (const object of gpgpuObjects) {
                this.glContext.drawObject(object)
            }

            this.glContext.enableRasterizer()
        }

        // # Render

        const nodesInFrustum = getNodesInFrustum(node3Ds, this.camera.frustum)
        for (const node of nodesInFrustum) {
            if (node.mixer) {
                node.mixer.updateJointsTexture()
                node.mixer.updateMorphs()
            }
            for (const hairSystem of node.hairSkins) {
                hairSystem.update()
            }
        }

        const opaqueObjects = []
        const transparentObjects = []
        const cameraPosition = this.camera.position
        for (const node of nodesInFrustum) {
            const objectsToDraw = getObjectsInFrustumFromNode(node, this.camera.frustum)
            if (objectsToDraw.length > 0) {
                for (const object of objectsToDraw) {


                    if (
                        object.normalBlending ||
                        object.additiveBlending ||
                        object.multiplyBlending
                    ) {
                        transparentObjects.push(object)

                        if (object.glVao) {
                            _box3.copy(object.glVao.boundingBox)
                                .applyMatrix4(node.worldMatrix)
                                .clampPoint(cameraPosition, _vector3)

                            const distanceSq = _vector3.distanceToSquared(this.camera.position)

                            this.#cameraDistanceCache.set(object, distanceSq)
                        } else {
                            this.#cameraDistanceCache.set(object, 0)
                        }
                    } else {
                        opaqueObjects.push(object)
                    }
                }
            }
        }

        opaqueObjects.sort(this.compareObjectDrawOptimizationBound)

        transparentObjects.sort(this.#compareCameraDistanceBound)
        this.#cameraDistanceCache.clear()
        // ## Opaque

        const glOpaqueFrameBuffer = this.glContext.getGlFrameBuffer(this.opaqueFrameBuffer)
        glOpaqueFrameBuffer.bind()

        gl.enable(WebGL2RenderingContext.CULL_FACE)
        this.glContext.glCapabilities.setFrontFace()
        gl.enable(WebGL2RenderingContext.DEPTH_TEST)
        gl.depthMask(true)
        gl.disable(WebGL2RenderingContext.BLEND)
        this.glContext.glCapabilities.setNormalBlending()

        gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0.0, 0.0, 0.0, 0.0]))
        gl.clearBufferiv(gl.COLOR, 1, new Int32Array([0, 0, 0, 2147483647]))
        gl.clearBufferiv(gl.COLOR, 2, new Int32Array([0, 0, 0, 0]))
        gl.clearBufferfi(gl.DEPTH_STENCIL, 0, 1.0, 0)

        for (const object of opaqueObjects) this.glContext.drawObject(object)

        // ## Transparent

        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, null)

        gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT)

        glOpaqueFrameBuffer.blitTo(null, this.windowInfo.width, this.windowInfo.height, WebGL2RenderingContext.DEPTH_BUFFER_BIT)

        this.glContext.drawObject(this.opaqueLightingPostprocessingObject)

        for (const object of transparentObjects) {
            this.glContext.drawObject(object)
        }
    }

    #lastProgramId = 0
    #programCache = new WeakMap()
    #lastVaoId = 0
    #vaoCache = new WeakMap()
    #objectState = new WeakMap()


    #cameraDistanceCache = new Map()

    #compareCameraDistanceBound = this.#compareCameraDistance.bind(this)
    #compareCameraDistance(
        /** @type {GlObject} */ a,
        /** @type {GlObject} */ b
    ) {
        return this.#cameraDistanceCache.get(b) - this.#cameraDistanceCache.get(a)
    }

    compareObjectDrawOptimizationBound = this.compareObjectDrawOptimization.bind(this)
    compareObjectDrawOptimization(
        /** @type {GlObject} */ a,
        /** @type {GlObject} */ b
    ) {
        if (!this.#programCache.has(a.glProgram)) this.#programCache.set(a.glProgram, this.#lastProgramId++)
        if (!this.#programCache.has(b.glProgram)) this.#programCache.set(b.glProgram, this.#lastProgramId++)
        const materialIdA = this.#programCache.get(a.glProgram)
        const materialIdB = this.#programCache.get(b.glProgram)
        if (materialIdA !== materialIdB) return materialIdA - materialIdB

        if (a.glVao && b.glVao) {
            if (!this.#vaoCache.has(a.glVao)) this.#vaoCache.set(a.glVao, this.#lastVaoId++)
            if (!this.#vaoCache.has(b.glVao)) this.#vaoCache.set(b.glVao, this.#lastVaoId++)
            const geometryIdA = this.#vaoCache.get(a.glVao)
            const geometryIdB = this.#vaoCache.get(b.glVao)
            if (geometryIdA !== geometryIdB) return geometryIdA - geometryIdB
        }

        if (!this.#objectState.has(a)) this.#objectState.set(a, getObjectStateId(a))
        if (!this.#objectState.has(b)) this.#objectState.set(b, getObjectStateId(b))
        const stateIdA = this.#objectState.get(a)
        const stateIdB = this.#objectState.get(b)
        if (stateIdA !== stateIdB) return stateIdA - stateIdB

        return 0
    }

    loseContext() {
        this.glContext.gl.getExtension("WEBGL_lose_context")?.loseContext()
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
        if (object.normalBlending || object.additiveBlending || object.multiplyBlending) {
            transparent.push(object)
        } else {
            opaque.push(object)
        }
    }

    return [opaque, transparent]
}

function getNodesInFrustum(
    /** @type {Node3D[]} */ node3Ds,
    /** @type {Frustum} */ frustum
) {
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

function getObjectsInFrustum(
    /** @type {Node3D[]} */ nodes,
    /** @type {Frustum} */ frustum
) {
    /** @type {GlObject[]} */
    const result = []

    for (const node of nodes) {
        result.push(...getObjectsInFrustumFromNode(node, frustum))
    }

    return result
}

function getObjectsInFrustumFromNode(
    /** @type {Node3D} */ node,
    /** @type {Frustum} */ frustum
) {
    /** @type {GlObject[]} */
    const result = []

    for (const object of node.objects) {
        if (object instanceof GlObject && !object.glProgram.glTransformFeedback) {
            if (object.glVao) {
                const boundingBox = object.glVao.boundingBox

                if (
                    boundingBox.isEmpty()
                    || (object instanceof ParticleSystemObject && frustum.intersectsBox(_box3.copy(boundingBox)))
                    || frustum.intersectsBox(_box3.copy(boundingBox).applyMatrix4(node.worldMatrix))
                ) {
                    result.push(object)
                }
            } else {
                result.push(object)
            }
        }
    }

    return result
}
