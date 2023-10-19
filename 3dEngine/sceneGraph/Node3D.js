import { Box3 } from "../../math/Box3.js"
import { Matrix4 } from "../../math/Matrix4.js"
import { Quaternion } from "../../math/Quaternion.js"
import { Vector3 } from "../../math/Vector3.js"
import { Object3D } from "./Object3D.js"
import { Scene } from "./Scene.js"

export class Node3D {
    position = new Vector3()
    quaternion = new Quaternion()
    scale = new Vector3(1, 1, 1)
    localMatrix = new Matrix4()
    localMatrixNeedsUpdate = true

    worldMatrix = new Matrix4()

    /** @type {Node3D | Scene | undefined} */
    parent

    /** @type {Set<Node3D>} */
    nodes = new Set()

    /** @type {Set<Object3D>} */
    objects = new Set()

    boundingBox = new Box3()

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
            this.localMatrixNeedsUpdate = false
            this.localMatrix.compose(this.position, this.quaternion, this.scale)
            this.worldMatrix.multiplyMatrices(this.localMatrix, this.parent.worldMatrix)
            for (const node of this.nodes) node.updateWorldMatrix(true)

        } else if (force) {
            this.worldMatrix.multiplyMatrices(this.localMatrix, this.parent.worldMatrix)
            for (const node of this.nodes) node.updateWorldMatrix(true)

        } else {
            for (const node of this.nodes) node.updateWorldMatrix()
        }
    }

    traverse(/** @type {(node: Node3D) => void} */ callback) {
        for (const node of this.nodes) {
            callback(node)
            node.traverse(callback)
        }
    }

    updateBoundingBox() {
        this.boundingBox.makeEmpty()
        for (const object of this.objects) {
            this.boundingBox.union(object.geometry.boundingBox)
        }
    }
}
