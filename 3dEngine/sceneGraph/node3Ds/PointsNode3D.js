import { GlRenderer } from "../../webgl/glRenderer/GlRenderer.js"
import { Node3D } from "../Node3D.js"
import { PointsGlObject } from "../objects/PointsGlObject.js"

export class PointsNode3D extends Node3D {
    constructor(   /** 
         * @type {{
         *      positions: Float32Array
         *      colors: Float32Array
         *      sizes: Float32Array
         *      deferredTextures: GlRenderer['deferredTextures']
         * }}
        */
        {
            positions,
            colors,
            sizes,
            deferredTextures
        }) {
        super()

        const pointsObject = new PointsGlObject({
            positions,
            colors,
            sizes,
            worldMatrix: this.worldMatrix,
            deferredTextures
        })

        this.localMatrixNeedsUpdate

        this.objects.add(pointsObject)
    }
}
