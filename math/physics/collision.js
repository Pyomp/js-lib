import { Vector3 } from "../Vector3.js"
import { StaticBody } from "./StaticBody.js"

const trianglesSphereResult = {
    index: -1,
    point: new Vector3(),
    lengthSq: Infinity,
    direction: new Vector3(),
    isGrappled: false,
    isCollision: false
}

const closestPoint = new Vector3()
const direction = new Vector3()

/**
 * 
 * @param {StaticBody} staticBody 
 * @param {Sphere} boundingSphere 
 */
export function staticBodyEntity(staticBody, boundingSphere) {
    const boundingSphereRadiusSq = boundingSphere.radius * boundingSphere.radius
    let closest = boundingSphereRadiusSq
    trianglesSphereResult.index = -1
    for (let i = 0; i < staticBody.size; i++) {
        if (staticBody.boundingBoxes[i].intersectsSphere(boundingSphere)) {
            staticBody.triangles[i].closestPointToPoint(boundingSphere.center, closestPoint)
            if (direction.subVectors(closestPoint, boundingSphere.center).lengthSq() < closest) {
                closest = direction.lengthSq()

                trianglesSphereResult.point.copy(closestPoint)
                trianglesSphereResult.direction.copy(direction)
                trianglesSphereResult.lengthSq = closest
                trianglesSphereResult.index = i
            }
        }
    }

    trianglesSphereResult.isGrappled = trianglesSphereResult.index >= 0
    trianglesSphereResult.isCollision = boundingSphereRadiusSq > closest

    return trianglesSphereResult
}
