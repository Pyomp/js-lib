import { Box3 } from "../../math/Box3.js"
import { Matrix3 } from "../../math/Matrix3.js"
import { Matrix4 } from "../../math/Matrix4.js"
import { Quaternion } from "../../math/Quaternion.js"
import { Vector3 } from "../../math/Vector3.js"
import { GLSL_COMMON } from "../programs/chunks/glslCommon.js"
import { GLSL_SKINNED } from "../programs/chunks/glslSkinnedChunk.js"
import { GlObjectData } from "../webgl/glDescriptors/GlObjectData.js"
import { AmbientLight } from "./AmbientLight.js"
import { PointLight } from "./PointLight.js"
import { Mixer } from "./gltf/skinned/animation/Mixer.js"
import { Particle } from "./particle/Particle.js"

export class Node3D {
    name = 'no_name'

    position = new Vector3()
    quaternion = new Quaternion()
    scale = new Vector3(1, 1, 1)
    localMatrix = new Matrix4()
    localMatrixNeedsUpdate = true

    worldMatrix = new Matrix4()
    normalMatrix = new Matrix3()

    /** @type {Node3D | undefined} */
    parent

    /** @type {Set<Node3D>} */
    nodes = new Set()

    /** @type {Set<GlObjectData | PointLight | AmbientLight | Particle>} */
    objects = new Set()

    boundingBox = new Box3()

    /** @type {Mixer | undefined} */
    mixer

    /** @param {Node3D} node */
    addNode3D(node) {
        node.parent?.removeNode3D(node)
        node.parent = this
        this.nodes.add(node)
    }

    /** @param {Node3D} node */
    removeNode3D(node) {
        node.parent = undefined
        this.nodes.delete(node)
    }

    updateWorldMatrix(force = false) {
        if (this.localMatrixNeedsUpdate) {
            this.localMatrix.compose(this.position, this.quaternion, this.scale)
        }

        if (force || this.localMatrixNeedsUpdate) {
            if (this.parent) this.worldMatrix.multiplyMatrices(this.localMatrix, this.parent.worldMatrix)
            this.normalMatrix.setFromMatrix4(this.worldMatrix).invert().transpose()
        }

        for (const node of this.nodes) node.updateWorldMatrix(force || this.localMatrixNeedsUpdate)

        this.localMatrixNeedsUpdate = false
    }

    traverse(/** @type {(node: Node3D) => void} */ callback) {
        callback(this)
        for (const node of this.nodes) {
            node.traverse(callback)
        }
    }

    // updateBoundingBox() {
    //     this.boundingBox.makeEmpty()
    //     for (const object of this.objects) {
    //         this.boundingBox.union(object.geometry.boundingBox)
    //     }
    // }

    clone() {
        const node3d = new Node3D()
        node3d.name = this.name
        node3d.mixer = this.mixer?.clone()

        node3d.position.copy(this.position)
        node3d.quaternion.copy(this.quaternion)
        node3d.scale.copy(this.scale)

        node3d.boundingBox.copy(node3d.boundingBox)

        for (const object of this.objects) {
            if (object instanceof GlObjectData) {
                const clone = object.clone()
                clone.uniforms[GLSL_COMMON.worldMatrix] = node3d.worldMatrix
                if (node3d.mixer) clone.uniforms[GLSL_SKINNED.jointsTexture] = node3d.mixer.jointsTexture
                node3d.objects.add(clone)
            }
        }

        for (const node of this.nodes) {
            node3d.addNode3D(node.clone())
        }

        return node3d
    }

    dispose() {
        this.traverse((child) => {
            if (child.mixer) child.mixer.jointsTexture.needsDelete = true
            if (child.parent)
                child.parent.removeNode3D(this)
        })
    }
}
