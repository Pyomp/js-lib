import { loadGLTF } from "../../3dEngine/loaders/gltfLoader.js"
import { Node3D } from "../../3dEngine/sceneGraph/Node3D.js"
import { PointLight } from "../../3dEngine/sceneGraph/PointLight.js"
import { GltfNodeManager } from "../../3dEngine/sceneGraph/gltf/GltfNodeManager.js"
import { Particle } from "../../3dEngine/sceneGraph/particle/Particle.js"
import { ParticleKeyframe } from "../../3dEngine/sceneGraph/particle/ParticleKeyframe.js"
import { GlProgram } from "../../3dEngine/webgl/glDescriptors/GlProgram.js"
import { GlTexture } from "../../3dEngine/webgl/glDescriptors/GlTexture.js"
import { Color } from "../../math/Color.js"
import { PI033, PI05 } from "../../math/MathUtils.js"
import { Spherical } from "../../math/Spherical.js"
import { Vector3, _up } from "../../math/Vector3.js"
import { loopRaf } from "../../utils/loopRaf.js"

const ParticleTimeCoef = 0.02

/** 
 * @type {{
 * gltfPrimitive: GltfPrimitive
 * gltfPrimitiveTop: GltfPrimitive
 * keyframes: ParticleKeyframe[]
 * particleTexture: GlTexture
 * glProgram: GlProgram
 * } | undefined} 
 */
let cache

async function init(particleTexture, glProgram) {
    const nodes = await loadGLTF(new URL('./bul.glb', import.meta.url))
    cache = {
        gltfPrimitive: nodes['Sphere'].mesh.primitives[0],
        gltfPrimitiveTop: nodes['SphereTop'].mesh.primitives[0],
        keyframes: [
            new ParticleKeyframe({ time: 0, color: new Color(0.5, .5, 1, 0.1), size: 5 }),
            new ParticleKeyframe({ time: 3, color: new Color(0, 0, 0.7, 0), size: 0 }),
        ],
        particleTexture: particleTexture,
        glProgram: glProgram
    }
}

export class BulBall extends Node3D {
    static init = init
    static free = () => { cache = undefined }

    constructor() {
        super()

        this.nodeBot = new Node3D()
        const [object] = GltfNodeManager.getGlObjectsData([cache.gltfPrimitive], cache.glProgram)
        object.cullFace = false
        object.normalBlending = true
        object.depthTest = false
        GltfNodeManager.linkObjectsToNode(this.nodeBot, [object])
        this.addNode3D(this.nodeBot)

        this.nodeTop = new Node3D()
        const [objectTop] = GltfNodeManager.getGlObjectsData([cache.gltfPrimitiveTop], cache.glProgram)
        objectTop.cullFace = false
        objectTop.normalBlending = true
        objectTop.depthTest = false
        GltfNodeManager.linkObjectsToNode(this.nodeTop, [objectTop])
        this.addNode3D(this.nodeTop)

        this.pointLight = new PointLight({
            intensity: 1,
            color: new Color(1, 1, 1),
            localPosition: this.position,
            incidence: 20
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

    #particle1 = new Particle({ keyframes: cache.keyframes, texture: cache.particleTexture, position: new Vector3().setFromSpherical(this.#s1) })
    #particle2 = new Particle({ keyframes: cache.keyframes, texture: cache.particleTexture, position: new Vector3().setFromSpherical(this.#s2) })
    #particle3 = new Particle({ keyframes: cache.keyframes, texture: cache.particleTexture, position: new Vector3().setFromSpherical(this.#s3) })

    #time = 0

    #particleSystemUpdate() {
        this.#time += loopRaf.deltatimeSecond

        while (this.#time > 0) {
            this.#s1.theta += ParticleTimeCoef
            this.#s2.theta -= ParticleTimeCoef
            this.#s3.theta += ParticleTimeCoef

            this.#particle1.position.setFromSpherical(this.#s1)
            this.#particle2.position.setFromSpherical(this.#s2)
            this.#particle3.position.setFromSpherical(this.#s3)

            this.objects.add(this.#particle1).add(this.#particle2).add(this.#particle3)

            this.#time -= ParticleTimeCoef
        }
    }
}
