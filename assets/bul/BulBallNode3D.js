import { loadGLTF } from "../../3dEngine/sceneGraph/gltf/gltfLoader.js"
import { Node3D } from "../../3dEngine/sceneGraph/Node3D.js"
import { PointLight } from "../../3dEngine/sceneGraph/PointLight.js"
import { ParticleKeyframe } from "../../3dEngine/sceneGraph/particle/ParticleKeyframe.js"
import { Color } from "../../math/Color.js"
import { PI033, PI05 } from "../../math/MathUtils.js"
import { Spherical } from "../../math/Spherical.js"
import {  _up } from "../../math/Vector3.js"
import { loopRaf } from "../../utils/loopRaf.js"
import { GlRenderer } from "../../3dEngine/webgl/glRenderer/GlRenderer.js"
import { GlObjectParticleSystem } from "../../3dEngine/sceneGraph/objects/GlObjectParticleSystem.js"
import { AssetManager } from "../../utils/AssetManager.js"
import { getDefinedOrThrow } from "../../utils/utils.js"
import { GlTextureRGBA } from "../../3dEngine/textures/GlTextureRGBA.js"
import { TransparentBasicGlObject } from "../../3dEngine/sceneGraph/objects/TransparentBasicGlObject.js"
import { BasicGlVao } from "../../3dEngine/sceneGraph/vao/BasicGlVao.js"

const particleKeyFrames = [
    new ParticleKeyframe({ time: 0, color: new Color(1, .5, .5, 0.8), size: 4 }),
    new ParticleKeyframe({ time: 3, color: new Color(0, 0, 0.7, 0), size: 0.1 }),
]

const assetLoader = new AssetManager(async () => {
    const gltf = await loadGLTF(new URL('./bul.glb', import.meta.url))

    const innerSphereNode = gltf['Sphere']
    const outerSphereNode = gltf['SphereTop']

    const innerSphereVao = BasicGlVao.fromGltfPrimitive(getDefinedOrThrow(innerSphereNode.mesh?.primitives[0]))
    const outerSphereVao = BasicGlVao.fromGltfPrimitive(getDefinedOrThrow(outerSphereNode.mesh?.primitives[0]))

    const baseColorTexture = new GlTextureRGBA(
        getDefinedOrThrow(innerSphereNode.mesh?.primitives[0].material?.pbrMetallicRoughness?.baseColorTexture?.source.htmlImageElement)
    )

    return {
        innerSphereVao,
        outerSphereVao,
        baseColorTexture,
    }
})

export class BulBallNode3D extends Node3D {
    static asset = assetLoader
    static instances = new Set()
    static ready = false

    #particleSystemObject1
    #particleSystemObject2
    #particleSystemObject3

    #innerSphereNode = new Node3D()
    #outerSphereNode = new Node3D()

    constructor(
        /** @type {GlRenderer['deferredTextures']} */ deferredTextures
    ) {
        super()

        this.#particleSystemObject1 = new GlObjectParticleSystem({
            emitDeltaTime: 0.02,
            particleLifeTime: 3,
            keyframes: particleKeyFrames,
            deferredTextures: deferredTextures,
        })

        this.#particleSystemObject2 = new GlObjectParticleSystem({
            emitDeltaTime: 0.02,
            particleLifeTime: 3,
            keyframes: particleKeyFrames,
            deferredTextures: deferredTextures,
        })

        this.#particleSystemObject3 = new GlObjectParticleSystem({
            emitDeltaTime: 0.02,
            particleLifeTime: 3,
            keyframes: particleKeyFrames,
            deferredTextures: deferredTextures,
        })

        const pointLight = new PointLight({
            intensity: 2,
            color: new Color(1, 0.8, 0.8),
            incidence: 80
        })

        this.objects.add(pointLight)
        this.objects.add(this.#particleSystemObject1)
        this.objects.add(this.#particleSystemObject2)
        this.objects.add(this.#particleSystemObject3)
        this.addNode3D(this.#innerSphereNode)
        this.addNode3D(this.#outerSphereNode)
    }

    #isInit = false
    #init() {
        if (this.#isInit) return
        const assets = assetLoader.getAsset()
        if (assets) {
            this.#isInit = true

            const innerSphere = new TransparentBasicGlObject({
                worldMatrix: this.#innerSphereNode.worldMatrix,
                baseTexture: assets.baseColorTexture,
                glVao: assets.innerSphereVao,
            })
            this.#innerSphereNode.objects.add(innerSphere)

            const outerSphere = new TransparentBasicGlObject({
                worldMatrix: this.#outerSphereNode.worldMatrix,
                baseTexture: assets.baseColorTexture,
                glVao: assets.outerSphereVao,
            })
            this.#outerSphereNode.objects.add(outerSphere)
        }
    }

    #time = 0
    update() {
        this.#init()

        this.#time += loopRaf.deltatimeSecond
        this.#innerSphereNode.quaternion.setFromAxisAngle(_up, this.#time)
        this.#innerSphereNode.localMatrixNeedsUpdate = true
        this.#outerSphereNode.quaternion.setFromAxisAngle(_up, -this.#time)
        this.#outerSphereNode.localMatrixNeedsUpdate = true
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
