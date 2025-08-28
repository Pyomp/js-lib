import { loadGLTF } from "../../3dEngine/sceneGraph/gltf/gltfLoader.js"
import { Node3D } from "../../3dEngine/sceneGraph/Node3D.js"
import { PointLight } from "../../3dEngine/sceneGraph/PointLight.js"
import { GltfNodeManager } from "../../3dEngine/sceneGraph/gltf/GltfNodeManager.js"
import { ParticleKeyframe } from "../../3dEngine/sceneGraph/particle/ParticleKeyframe.js"
import { GlObject } from "../../3dEngine/webgl/glDescriptors/GlObject.js"
import { GlProgram } from "../../3dEngine/webgl/glDescriptors/GlProgram.js"
import { GlTexture } from "../../3dEngine/webgl/glDescriptors/GlTexture.js"
import { Color } from "../../math/Color.js"
import { PI033, PI05 } from "../../math/MathUtils.js"
import { Spherical } from "../../math/Spherical.js"
import { Vector3, _up } from "../../math/Vector3.js"
import { loopRaf } from "../../utils/loopRaf.js"
import { GlRenderer } from "../../3dEngine/webgl/glRenderer/GlRenderer.js"
import { ParticleSystemObject } from "../../3dEngine/sceneGraph/objects/ParticleSystemObject.js"

const ParticleTimeCoef = 0.02

let disposed = false
let isLoading = false
/** @type {GlObject} */ let objectInner
/** @type {GlObject} */ let objectOuter
/** @type {GlTexture} */ let particleTextureCache
/** @type {ParticleKeyframe[]} */ let particleKeyFrames
/** @type {GlRenderer} */ let _renderer

// TODO use load class
async function load(
    /** @type {GlTexture} */ particleTexture,
    /** @type {GlProgram} */ glProgram,
    /** @type {GlRenderer} */ renderer,
) {
    disposed = false
    if (isLoading || BulBallNode3D.ready) return
    isLoading = true
    const nodes = await loadGLTF(new URL('./bul.glb', import.meta.url))
    isLoading = false
    if (disposed) return

    _renderer = renderer

    objectInner = GltfNodeManager.getGlObjectData(nodes['Sphere'].mesh.primitives[0], glProgram)
    objectInner.frontCullFace = false
    objectInner.backCullFace = false
    objectInner.normalBlending = true
    objectInner.depthWrite = false

    objectOuter = GltfNodeManager.getGlObjectData(nodes['SphereTop'].mesh.primitives[0], glProgram)
    objectOuter.frontCullFace = false
    objectOuter.backCullFace = false
    objectOuter.normalBlending = true
    objectOuter.depthWrite = false

    particleKeyFrames = [
        new ParticleKeyframe({ time: 0, color: new Color(1, .5, .5, 0.8), size: 4 }),
        new ParticleKeyframe({ time: 3, color: new Color(0, 0, 0.7, 0), size: 0.1 }),
    ]

    particleTexture = particleTexture

    BulBallNode3D.ready = true
}

function unload() {
    if (BulBallNode3D.instances.size > 0)
        return

    disposed = true

    GltfNodeManager.disposeDefaultGltfGlObject(objectInner)
    objectInner = undefined

    GltfNodeManager.disposeDefaultGltfGlObject(objectOuter)
    objectOuter = undefined

    particleTextureCache = undefined

    particleKeyFrames = undefined

    BulBallNode3D.ready = false
}
const _vector3 = new Vector3()
export class BulBallNode3D extends Node3D {
    static instances = new Set()
    static ready = false
    static load = load
    static unload = unload

    #particleSystemObject1 = new ParticleSystemObject({
        emitDeltaTime: 0.02,
        particleLifeTime: 3,
        keyframes: particleKeyFrames,
        deferredTextures: _renderer.deferredTextures,
    })

    #particleSystemObject2 = new ParticleSystemObject({
        emitDeltaTime: 0.02,
        particleLifeTime: 3,
        keyframes: particleKeyFrames,
        deferredTextures: _renderer.deferredTextures,
    })

    #particleSystemObject3 = new ParticleSystemObject({
        emitDeltaTime: 0.02,
        particleLifeTime: 3,
        keyframes: particleKeyFrames,
        deferredTextures: _renderer.deferredTextures,
    })

    constructor() {
        super()

        this.nodeBot = new Node3D()
        GltfNodeManager.linkObjectToNode(this.nodeBot, objectInner.clone())
        this.addNode3D(this.nodeBot)

        this.nodeTop = new Node3D()
        GltfNodeManager.linkObjectToNode(this.nodeTop, objectOuter.clone())
        this.addNode3D(this.nodeTop)

        this.pointLight = new PointLight({
            intensity: 2,
            color: new Color(1, 0.8, 0.8),
            incidence: 80
        })

        this.objects.add(this.pointLight)

        this.objects.add(this.#particleSystemObject1)
        this.objects.add(this.#particleSystemObject2)
        this.objects.add(this.#particleSystemObject3)
    }

    time = 0

    update() {
        this.time += loopRaf.deltatimeSecond
        this.nodeBot.quaternion.setFromAxisAngle(_up, this.time)
        this.nodeBot.localMatrixNeedsUpdate = true
        this.nodeTop.quaternion.setFromAxisAngle(_up, -this.time)
        this.nodeTop.localMatrixNeedsUpdate = true
        this.#particleSystemUpdate()
    }

    #s1 = new Spherical(0.7, PI05 - 0.5, 2 * PI033)
    #s2 = new Spherical(0.7, PI05, 0)
    #s3 = new Spherical(0.7, PI05 + 0.5, 2 * -PI033)

    #particleSystemUpdate() {
        const dt = loopRaf.deltatimeSecond

        this.#s1.theta += dt
        this.#s2.theta -= dt
        this.#s3.theta += dt

        this.#particleSystemObject1.emitterPosition
            .setFromSpherical(this.#s1)
            .multiply(this.scale)
            .add(this.position)
        this.#particleSystemObject2.emitterPosition
            .setFromSpherical(this.#s2)
            .multiply(this.scale)
            .add(this.position)
        this.#particleSystemObject3.emitterPosition
            .setFromSpherical(this.#s3)
            .multiply(this.scale)
            .add(this.position)

        this.#particleSystemObject1.update()
        this.#particleSystemObject2.update()
        this.#particleSystemObject3.update()
    }

    dispose() {
        BulBallNode3D.instances.delete(this)
        super.dispose()
    }
}
