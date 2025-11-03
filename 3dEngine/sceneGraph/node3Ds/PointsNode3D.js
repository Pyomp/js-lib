import { GlRenderer } from "../../webgl/glRenderer/GlRenderer.js"
import { Node3D } from "../Node3D.js"
import { GlObjectPoints } from "../objects/GlObjectPoints.js"

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

        const pointsObject = new GlObjectPoints({
            positions,
            colors,
            sizes,
            worldMatrix: this.worldMatrix,
            deferredTextures
        })

        this.objects.add(pointsObject)
    }
}
