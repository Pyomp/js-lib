import { loadGLTF } from "../../3dEngine/sceneGraph/gltf/gltfLoader.js"
import { Node3D } from "../../3dEngine/sceneGraph/Node3D.js"
import { PointLight } from "../../3dEngine/sceneGraph/PointLight.js"
import { GltfNodeManager } from "../../3dEngine/sceneGraph/gltf/GltfNodeManager.js"
import { Particle } from "../../3dEngine/sceneGraph/particle/Particle.js"
import { ParticleKeyframe } from "../../3dEngine/sceneGraph/particle/ParticleKeyframe.js"
import { GlObject } from "../../3dEngine/webgl/glDescriptors/GlObject.js"
import { GlProgram } from "../../3dEngine/webgl/glDescriptors/GlProgram.js"
import { GlTexture } from "../../3dEngine/webgl/glDescriptors/GlTexture.js"
import { Color } from "../../math/Color.js"
import { PI033, PI05 } from "../../math/MathUtils.js"
import { Spherical } from "../../math/Spherical.js"
import { Vector3, _up } from "../../math/Vector3.js"
import { loopRaf } from "../../utils/loopRaf.js"

const ParticleTimeCoef = 0.02

let disposed = false
let isLoading = false
/** @type {GlObject} */ let objectInner
/** @type {GlObject} */ let objectOuter
/** @type {GlTexture} */ let particleTextureCache
/** @type {ParticleKeyframe[]} */ let particleKeyFrames

async function load(/** @type {GlTexture} */ particleTexture, /** @type {GlProgram} */ glProgram) {
    disposed = false
    if (isLoading || BulBallNode3D.ready) return
    isLoading = true
    const nodes = await loadGLTF(new URL('./bul.glb', import.meta.url))
    isLoading = false
    if (disposed) return


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
        new ParticleKeyframe({ time: 0, color: new Color(1, .5, .5, 0.1), size: 5 }),
        new ParticleKeyframe({ time: 3, color: new Color(0, 0, 0.7, 0), size: 0 }),
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

export class BulBallNode3D extends Node3D {
    static instances = new Set()
    static ready = false
    static load = load
    static unload = unload

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
            // localPosition: this.position,
            incidence: 80
        })

        this.objects.add(this.pointLight)
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

    #particle1 = new Particle({ keyframes: particleKeyFrames, texture: particleTextureCache, position: new Vector3().setFromSpherical(this.#s1) })
    #particle2 = new Particle({ keyframes: particleKeyFrames, texture: particleTextureCache, position: new Vector3().setFromSpherical(this.#s2) })
    #particle3 = new Particle({ keyframes: particleKeyFrames, texture: particleTextureCache, position: new Vector3().setFromSpherical(this.#s3) })

    #time = 0

    #particleSystemUpdate() {
        this.#time += loopRaf.deltatimeSecond

        while (this.#time > 0) {
            this.#s1.theta += ParticleTimeCoef
            this.#s2.theta -= ParticleTimeCoef
            this.#s3.theta += ParticleTimeCoef

            this.#particle1.position.setFromSpherical(this.#s1).applyMatrix4(this.worldMatrix)
            this.#particle2.position.setFromSpherical(this.#s2).applyMatrix4(this.worldMatrix)
            this.#particle3.position.setFromSpherical(this.#s3).applyMatrix4(this.worldMatrix)

            this.objects.add(this.#particle1).add(this.#particle2).add(this.#particle3)

            this.#time -= ParticleTimeCoef
        }
    }

    dispose() {
        BulBallNode3D.instances.delete(this)
        super.dispose()
    }
}
