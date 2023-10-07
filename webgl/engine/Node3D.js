import { Matrix4 } from "../../math/Matrix4.js"
import { Quaternion } from "../../math/Quaternion.js"
import { Vector3 } from "../../math/Vector3.js"

export class Node3D {
    position = new Vector3()
    quaternion = new Quaternion()
    scale = new Vector3()
    localMatrix = new Matrix4()
    localMatrixNeedsUpdate = true

    worldMatrix = new Matrix4()
    worldMatrixNeedsUpdate = true

    parent
    children = new Set()

    constructor(parent = new Node3D()) {
        this.parent = parent
    }

    updateLocalMatrix() {
        if (this.localMatrixNeedsUpdate) {
            this.localMatrix.compose(this.position, this.quaternion, this.scale)
        }
    }

    updateWorldMatrix() {
        if (this.worldMatrixNeedsUpdate) {
            this.worldMatrix.multiply(this.localMatrix, this.parent.worldMatrix)
            for (const child of this.children) {
                child.updateWorldMatrix()
            }
            this.worldMatrixNeedsUpdate = false
        }
    }
}
