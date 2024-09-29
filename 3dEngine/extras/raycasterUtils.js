import { Box3 } from '../../math/Box3.js'
import { Matrix4 } from '../../math/Matrix4.js'
import { Ray } from '../../math/Ray.js'
import { Triangle } from '../../math/Triangle.js'
import { Vector2 } from '../../math/Vector2.js'
import { Vector3 } from '../../math/Vector3.js'
import { Node3D } from '../sceneGraph/Node3D.js'
import { GlObject } from '../webgl/glDescriptors/GlObject.js'

const _vector2 = new Vector2()
const _inverseMatrix = new Matrix4()
const _ray = new Ray()
const _vA = new Vector3()
const _vB = new Vector3()
const _vC = new Vector3()
const _triangle = new Triangle()
const Matrix4Identity = new Matrix4().identity()

export function getMiddle3DPosition(worldCameraMatrix, node3D, target) {
    _vector2.x = 0
    _vector2.y = 0

    _ray.fromPerspectiveCamera(
        worldCameraMatrix,
        Matrix4Identity,
        _vector2
    )

    const minDistance = distanceRayNode(_ray, node3D)

    console.log(minDistance)

    _ray.at(minDistance, target)
}

export function getPointer3DPosition(clientX, clientY, htmlElement, worldCameraMatrix, projectionMatrixInverse, node3D, target) {
    _vector2.x = (clientX / htmlElement.clientWidth) * 2 - 1
    _vector2.y = ((htmlElement.clientHeight - clientY) / htmlElement.clientHeight) * 2 - 1

    _ray.fromPerspectiveCamera(
        worldCameraMatrix,
        projectionMatrixInverse,
        _vector2
    )

    const minDistance = distanceRayNode(_ray, node3D)

    console.log(minDistance)

    _ray.at(minDistance, target)
}

/**
 * 
 * @param {Ray} ray 
 * @param {Node3D} node
 * @returns 
 */
export function distanceRayNode(
    ray,
    node,
) {
    let minDistance = Infinity

    node.traverse((childNode) => {
        for (const object of childNode.objects) {
            if (object instanceof GlObject) {
                const positionAttribute = object.glVao?.attributes.find((attribute) => attribute.name.toLowerCase() === 'position')
                if (positionAttribute) {
                    const positionArray = positionAttribute.glArrayBuffer.arrayBuffer
                    const indices = object.glVao.indicesUintArray
                    if (indices) {
                        if (object.frontCullFace) {
                            minDistance = Math.min(minDistance, distanceRayMesh(ray, indices, positionArray, object.glVao.boundingBox, undefined, childNode.worldMatrix, true))
                        }
                        if (object.backCullFace) {
                            minDistance = Math.min(minDistance, distanceRayMesh(ray, indices, positionArray, object.glVao.boundingBox, undefined, childNode.worldMatrix, false))
                        }
                    }
                }
            }
        }
    })

    return minDistance
}

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

    let minDistance = Infinity

    for (let i = 0; i < indices.length; i += 3) {

        _vA.fromArray(position, indices[i] * 3)
        _vB.fromArray(position, indices[i + 1] * 3)
        _vC.fromArray(position, indices[i + 2] * 3)

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
