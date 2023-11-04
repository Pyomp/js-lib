import { Node3D } from "../../Node3D.js"
import { StaticGltfObject } from "./StaticGltfObject.js"

export class StaticGltfNode extends Node3D {
    /**
    * 
    * @param {GltfNode} gltfNode
    * @param {{[animationName: string]: number | string }} animationDictionary 
    */
    constructor(
        gltfNode,
        animationDictionary = {}
    ) {
        super()
        this.position.fromArray(gltfNode.translation || [0, 0, 0])
        this.quaternion.fromArray(gltfNode.rotation || [0, 0, 0, 1])
        this.scale.fromArray(gltfNode.scale || [1, 1, 1])

        for (const primitive of gltfNode.mesh.primitives) {
            this.objects.add(new StaticGltfObject(primitive, this.worldMatrix))
        }
    }
}
