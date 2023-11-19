import { Node3D } from "../../Node3D.js"
import { Texture } from "../../Texture.js"
import { Mixer } from "./animation/Mixer.js" 
import { SkinnedObject } from "./SkinnedObject.js"
import { Animation } from "./animation/Animation.js"

export class SkinnedNode extends Node3D {
    /**
    * 
    * @param {GltfNode} gltfNode
    * @param {Animation} animation
    */
    constructor(
        gltfNode,
        animation
    ) {
        super()
        this.position.fromArray(gltfNode.translation || [0, 0, 0])
        this.quaternion.fromArray(gltfNode.rotation || [0, 0, 0, 1])
        this.scale.fromArray(gltfNode.scale || [1, 1, 1])

        // this.animation = new Animation(gltfNode.skin, animationDictionary)
        this.mixer = new Mixer(animation)

        for (const primitive of gltfNode.mesh.primitives) {
            this.objects.add(new SkinnedObject(primitive, this.mixer.jointsTexture, this.worldMatrix))
        }
    }
}
