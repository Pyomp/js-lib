import { Matrix4 } from "../../math/Matrix4.js"
import { Quaternion } from "../../math/Quaternion.js"
import { Vector3 } from "../../math/Vector3.js"
import { Node3D } from "./Node3D.js"
import { Object3D } from "./Object3D.js"

export class Scene {
    position = new Vector3()
    quaternion = new Quaternion()
    scale = new Vector3()

    worldMatrix = new Matrix4()
    worldMatrixNeedsUpdate = true

    /** @type {Set<Node3D>} */
    nodes = new Set()

    /** @type {Set<Object3D>} */
    objects = new Set()

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

    updateWorldMatrix() {
        if (this.localMatrixNeedsUpdate) {
            this.localMatrixNeedsUpdate = false
            this.worldMatrix.compose(this.position, this.quaternion, this.scale)
            for (const child of this.nodes) child.updateWorldMatrix(true)
        } else {
            for (const child of this.nodes) child.updateWorldMatrix()
        }
    }

    traverse(callback) {
        for (const child of this.nodes) {
            callback(child)
            child.traverse(callback)
        }
    }
}
