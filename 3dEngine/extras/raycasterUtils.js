import { Box3 } from '../../math/Box3.js'
import { Matrix4 } from '../../math/Matrix4.js'
import { Ray } from '../../math/Ray.js'
import { Triangle } from '../../math/Triangle.js'
import { Vector3 } from '../../math/Vector3.js'

const _inverseMatrix = new Matrix4()
const _ray = new Ray()
const _vA = new Vector3()
const _vB = new Vector3()
const _vC = new Vector3()
const _triangle = new Triangle()

/**
 * 
 * @param {Ray} ray 
 * @param {Uint8Array | Uint16Array | Uint32Array} indices 
 * @param {Float32Array} position 
 * @param {Box3} boundingBox 
 * @param {Vector3} normalTarget 
 * @param {Matrix4} matrixWorld 
 * @param {boolean} isFrontSide 
 * @returns 
 */
export function distanceRayMesh(
    ray,
    indices,
    position,
    boundingBox = undefined,
    normalTarget = undefined,
    matrixWorld = undefined,
    isFrontSide = true,
) {
    _ray.copy(ray)

    if (matrixWorld) {
        _inverseMatrix.copy(matrixWorld).invert()
        _ray.applyMatrix4(_inverseMatrix)
    }

    if (boundingBox) {
        if (_ray.intersectsBox(boundingBox) === false) return Infinity
    }

    const count = indices.length / 3

    let minDistance = Infinity

    for (let i = 0; i < count; i += 3) {

        _vA.fromArray(position, indices[i * 3] * 3)
        _vB.fromArray(position, indices[i * 3 + 1] * 3)
        _vC.fromArray(position, indices[i * 3 + 2] * 3)

        const distance = _ray.distanceFromTriangle(_vA, _vB, _vC, isFrontSide)

        if (distance < minDistance) {
            minDistance = distance
            if (normalTarget) {
                _triangle.a.copy(_vA)
                _triangle.b.copy(_vB)
                _triangle.c.copy(_vC)
            }
        }
    }

    if (normalTarget && minDistance < Infinity) { _triangle.getNormal(normalTarget) }

    return minDistance
}

const _boundingBox = new Box3()
const _vector3 = new Vector3()
const _vector3_2 = new Vector3()
/**
 * 
 * @param {Sphere} boundingSphere
 * @param {Uint8Array |Uint16Array | Uint32Array} indices
 * @param {Float32Array} position
 */
export function distanceSphereMesh(boundingSphere, indices, position, pointTarget = new Vector3()) {
    boundingSphere.getBoundingBox(_boundingBox)

    const boundingSphereRadiusSq = boundingSphere.radius ** 2
    let closestDistanceSq = boundingSphereRadiusSq

    const count = indices.length

    for (let i = 0; i < count; i += 3) {
        _triangle.a.fromArray(position, indices[i] * 3)
        _triangle.b.fromArray(position, indices[i + 1] * 3)
        _triangle.c.fromArray(position, indices[i + 2] * 3)

        if (_boundingBox.intersectsTriangle(_triangle)) {
            _triangle.closestPointToPoint(boundingSphere.center, _vector3)

            const lengthSq = _vector3_2.subVectors(boundingSphere.center, _vector3).lengthSq()
            if (lengthSq < closestDistanceSq) {
                closestDistanceSq = lengthSq
                pointTarget.copy(_vector3)
            }
        }
    }

    return closestDistanceSq === boundingSphereRadiusSq ? Infinity : closestDistanceSq ** 0.5
}
