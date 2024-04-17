import { loadGLTF } from "../../3dEngine/loaders/gltfLoader.js"
import { Node3D } from "../../3dEngine/sceneGraph/Node3D.js"
import { PointLight } from "../../3dEngine/sceneGraph/PointLight.js"
import { GltfNodeManager } from "../../3dEngine/sceneGraph/gltf/GltfNodeManager.js"
import { Particle } from "../../3dEngine/sceneGraph/particle/Particle.js"
import { ParticleKeyframe } from "../../3dEngine/sceneGraph/particle/ParticleKeyframe.js"
import { GlTexture } from "../../3dEngine/webgl/glDescriptors/GlTexture.js"
import { Color } from "../../math/Color.js"
import { PI033, PI05 } from "../../math/MathUtils.js"
import { Spherical } from "../../math/Spherical.js"
import { Vector3, _up } from "../../math/Vector3.js"
import { loopRaf } from "../../utils/loopRaf.js"

const ParticleTimeCoef = 0.02

/** @type {GlTexture} */ let particleTextureCache
/** @type {ParticleKeyframe[]} */ let particleKeyFrames

async function load(/** @type {GlTexture} */ particleTexture) {
    particleKeyFrames = [
        new ParticleKeyframe({ time: 0, color: new Color(1, .5, .5, 0.1), size: 5 }),
        new ParticleKeyframe({ time: 3, color: new Color(0, 0, 0.7, 0), size: 0 }),
    ]

    particleTexture = particleTexture

    FireBallNode3D.ready = true
}

function unload() {
    if (FireBallNode3D.instances.size > 0)
        return

    particleTextureCache = undefined

    particleKeyFrames = undefined

    FireBallNode3D.ready = false
}

export class FireBallNode3D extends Node3D {
    static instances = new Set()
    static ready = false
    static load = load
    static unload = unload

    constructor() {
        super()

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
        FireBallNode3D.instances.delete(this)
        super.dispose()
    }
}
