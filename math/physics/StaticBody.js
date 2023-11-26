import { Box3 } from "../Box3.js"
import { Triangle } from "../Triangle.js"
import { Vector3 } from "../Vector3.js"

export class StaticBody {
    /** @type {Triangle[]} */ triangles = []
    /** @type {Box3[]} */ boundingBoxes = []
    /** @type {Vector3[]} */ normals = []
    size = 0

    /**
     * @param {GltfNode} gltfNode
     */
    constructor(gltfNode) {
        for (const primitive of gltfNode.mesh.primitives) {

            const indices = primitive.indices.buffer
            const position = primitive.attributes.POSITION.buffer

            for (let i = 0; i < indices.length; i += 3) {
                const aIndex = indices[i]
                const bIndex = indices[i + 1]
                const cIndex = indices[i + 2]

                const aVector = new Vector3(position[aIndex * 3], position[aIndex * 3 + 1], position[aIndex * 3 + 2])
                const bVector = new Vector3(position[bIndex * 3], position[bIndex * 3 + 1], position[bIndex * 3 + 2])
                const cVector = new Vector3(position[cIndex * 3], position[cIndex * 3 + 1], position[cIndex * 3 + 2])

                const triangle = new Triangle(aVector, bVector, cVector)

                this.triangles.push(triangle)

                const normalVector = new Vector3()
                triangle.getNormal(normalVector)
                this.normals.push(normalVector)

                const boundingBox = new Box3()

                boundingBox.setFromPoints([aVector, bVector, cVector])
                this.boundingBoxes.push(boundingBox)

                this.size += 1
            }
        }
    }
}
