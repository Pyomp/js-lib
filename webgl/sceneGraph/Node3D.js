import { Box3 } from "../../math/Box3.js"
import { Matrix4 } from "../../math/Matrix4.js"
import { Quaternion } from "../../math/Quaternion.js"
import { Vector3 } from "../../math/Vector3.js"
import { Object3D } from "./Object3D.js"

export class Node3D {
    position = new Vector3()
    quaternion = new Quaternion()
    scale = new Vector3()
    localMatrix = new Matrix4()
    localMatrixNeedsUpdate = true

    worldMatrix = new Matrix4()

    parent

    /** @type {Set<Node3D>} */
    children = new Set()

    /** @type {Set<Object3D>} */
    objects = new Set()

    boundingBox = new Box3()

    constructor(parent = null) {
        this.parent = parent
    }

    updateWorldMatrix(force = false) {
        if (this.localMatrixNeedsUpdate) {
            this.localMatrixNeedsUpdate = false
            this.localMatrix.compose(this.position, this.quaternion, this.scale)
            this.worldMatrix.multiply(this.localMatrix, this.parent.worldMatrix)
            for (const child of this.children) child.updateWorldMatrix(true)

        } else if (force) {
            this.worldMatrix.multiply(this.localMatrix, this.parent.worldMatrix)
            for (const child of this.children) child.updateWorldMatrix(true)

        } else {
            for (const child of this.children) child.updateWorldMatrix()
        }
    }

    traverse(/** @type {(node: Node3D) => void} */ callback) {
        for (const child of this.children) {
            callback(child)
            child.traverse(callback)
        }
    }

    updateBoundingBox() {
        this.boundingBox.makeEmpty()
        for (const object of this.objects) {
            this.boundingBox.union(object.boundingBox)
        }
    }
}
