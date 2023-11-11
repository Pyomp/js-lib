import { Node3D } from "../../Node3D.js"
import { Texture } from "../../Texture.js"
import { SkinnedObject } from "./SkinnedObject.js"
import { Animation } from "./animation/Animation.js"

export class SkinnedNode extends Node3D {
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
            this.objects.add(new SkinnedObject(primitive, this.jointsTexture, this.worldMatrix))
        }
        
        this.animation = new Animation(gltfNode.skin, animationDictionary, this.worldMatrix)

        this.jointsTexture = new Texture({
            data: this.animation.buffer,

            wrapS: 'CLAMP_TO_EDGE',
            wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST',
            magFilter: 'NEAREST',

            target: 'TEXTURE_2D',
            internalformat: 'RGBA32F',
            width: 4, // 16 element (matrix 4x4)
            height: gltfNode.skin.bonesCount,
            border: 0,
            format: 'RGBA',
            type: 'FLOAT',

            needsMipmap: false,
        })

    }
}
