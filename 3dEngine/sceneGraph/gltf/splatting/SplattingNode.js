import { Node3D } from "../../Node3D.js"
import { Uniform } from "../../Uniform.js"
import { SplattingObject } from "./SplattingObject.js"
import { SplattingTextures } from "./SplattingTextures.js"

export class SplattingNode extends Node3D {
    /**
    * 
    * @param {GltfNode} gltfNode
    * @param {SplattingTextures} splattingTextures
    */
    constructor(
        gltfNode,
        splattingTextures,
    ) {
        super()
        this.position.fromArray(gltfNode.translation || [0, 0, 0])
        this.quaternion.fromArray(gltfNode.rotation || [0, 0, 0, 1])
        this.scale.fromArray(gltfNode.scale || [1, 1, 1])

        const uniforms = {
            modelMatrix: new Uniform(this.worldMatrix),
            normalMatrix: new Uniform(this.normalMatrix),
            map1Scale: new Uniform(splattingTextures.map1Scale),
            map2Scale: new Uniform(splattingTextures.map2Scale),
            map3Scale: new Uniform(splattingTextures.map3Scale),
            map4Scale: new Uniform(splattingTextures.map4Scale),
        }

        const textures = {
            mapSplatting: splattingTextures.mapSplatting,
            map1: splattingTextures.map1,
            normalMap1: splattingTextures.normalMap1,
            map2: splattingTextures.map2,
            normalMap2: splattingTextures.normalMap2,
            map3: splattingTextures.map3,
            normalMap3: splattingTextures.normalMap3,
            map4: splattingTextures.map4,
            normalMap4: splattingTextures.normalMap4,
        }

        for (const primitive of gltfNode.mesh.primitives) {
            this.objects.add(new SplattingObject(primitive, uniforms, textures))
        }
    }
}
