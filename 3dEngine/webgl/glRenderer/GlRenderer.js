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
import { GlObjectParticleSystem } from "../../sceneGraph/objects/GlObjectParticleSystem.js"
import { GlContextRenderer } from "../glContext/GlContextRenderer.js"
import { GlObject } from "../glDescriptors/GlObject.js"
import { GlAmbientLightRenderer } from "./GlAmbientLightRenderer.js"
import { GlCameraUbo } from "./GlCameraUbo.js"
import { GlDeferredOpaqueFB } from "./GlDeferredOpaqueFB.js"
import { GlPointLightRenderer } from "./GlPointLightRenderer.js"
import { GlWindowInfo } from "./GlWindowInfo.js"
import { OpaqueLightingPostprocessingObject } from "./OpaqueLightingPostprocessingObject.js"

const _box3 = new Box3()
const _vector3 = new Vector3()

export class GlRenderer {
    htmlElement = document.createElement('div')

    // @ts-ignore
    /** @type {GlContextRenderer} */ glContext

    scene = new Node3D()

    camera = new Camera({})
    #cameraUbo = new GlCameraUbo(this.camera)

    windowInfo = new GlWindowInfo()

    deferredOpaqueFB = new GlDeferredOpaqueFB()

    pointLightRenderer = new GlPointLightRenderer()
    get pointLightCount() { return this.pointLightRenderer.uboPointLightCount }

    ambientLightRenderer = new GlAmbientLightRenderer()

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

    // TODO right handle context lost https://registry.khronos.org/webgl/specs/latest/1.0/#5.15.3
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
            this
        )
        // TODO dispose previous windowInfo 
        this.windowInfo.initGl(this.glContext)
        this.deferredOpaqueFB.initGl(this.glContext)

        this.glContext.resizeListeners.add(this.onResize.bind(this))
    }

    onResize(
        /** @type {number} */ width,
        /** @type {number} */  height
    ) {
        this.camera.aspect = width / height

        this.opaqueLightingPostprocessingObject.resize(width, height)
    }

    resetGlStates() {
        this.glContext.freeAllGlProgram()
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


        const deferredOpaqueObjects = []
        const transparentObjects = []
        let skyBox
        for (const node of nodesInFrustum) {
            const objectsToDraw = getObjectsInFrustumFromNode(node, this.camera.frustum)
            for (const object of objectsToDraw) {
                if (object.glProgram.isDeferred) {
                    deferredOpaqueObjects.push(object)
                } else if (object.glProgram.isSkyBox) {
                    skyBox = object
                } else {
                    transparentObjects.push(object)
                    this.#cameraDistanceCache.set(object, this.#getCameraDistanceSq(this.camera, node, object))
                }
            }
        }

        deferredOpaqueObjects.sort(this.compareObjectDrawOptimizationBound)

        transparentObjects.sort(this.#compareCameraDistanceBound)
        this.#cameraDistanceCache.clear()

        this.deferredOpaqueFB.render(deferredOpaqueObjects)

        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, null)

        gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT)

        this.deferredOpaqueFB.blitDepthBufferTo(null)

        this.glContext.drawObject(this.opaqueLightingPostprocessingObject)

        if (skyBox) this.glContext.drawObject(skyBox)

        for (const object of transparentObjects) {
            this.glContext.drawObject(object)
        }
    }

    #getCameraDistanceSq(
        /** @type {Camera} */ camera,
        /** @type {Node3D} */ node,
        /** @type {GlObject} */ object
    ) {
        if (object.glVao) {
            _box3.copy(object.glVao.boundingBox)
                .applyMatrix4(node.worldMatrix)
                .clampPoint(camera.position, _vector3)
            return _vector3.distanceToSquared(this.camera.position)
        } else {
            return 0
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
                    || (object instanceof GlObjectParticleSystem && frustum.intersectsBox(_box3.copy(boundingBox)))
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
