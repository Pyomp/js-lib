import { Matrix4 } from "../../math/Matrix4.js"
import { Quaternion } from "../../math/Quaternion.js"
import { Vector3 } from "../../math/Vector3.js"
import { Node3D } from "./Node3D.js"

export class Scene {
    position = new Vector3()
    quaternion = new Quaternion()
    scale = new Vector3()

    worldMatrix = new Matrix4()
    worldMatrixNeedsUpdate = true

    /** @type {Set<Node3D>} */
    children = new Set()

    updateWorldMatrix() {
        if (this.localMatrixNeedsUpdate) {
            this.localMatrixNeedsUpdate = false
            this.worldMatrix.compose(this.position, this.quaternion, this.scale)
            for (const child of this.children) child.updateWorldMatrix(true)
        } else {
            for (const child of this.children) child.updateWorldMatrix()
        }
    }

    traverse(callback) {
        for (const child of this.children) {
            callback(child)
            child.traverse(callback)
        }
    }
}
