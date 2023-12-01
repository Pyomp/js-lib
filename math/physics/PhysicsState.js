import { PI05 } from "../MathUtils.js"
import { Sphere } from "../Sphere.js"
import { Vector3 } from "../Vector3.js"
import { StaticBody } from "./StaticBody.js"
import { staticBodyEntity } from "./collision.js"

export class PhysicsState {
    isOnGround = true
    isGrappled = false
    isRunning = false
    groundNormal = new Vector3(0, 1, 0)
    resistance = 0.1
    runSpeed = 0

    velocity = new Vector3()
    position

    /**
     * @param {Vector3} position 
     */
    constructor(position) {
        this.position = position
        this.boundingSphere = new Sphere()
    }

    /** 
     * @param {StaticBody} terrain 
     */
    updateGroundCollision(terrain) {
        const result = staticBodyEntity(terrain, this.boundingSphere)

        this.resistance = 1.05
        this.isOnGround = false
        this.isGrappled = result.isGrappled

        if (result.isGrappled) {
            targetDirection.copy(terrain.normals[result.index])
            if (result.isCollision) {
                _vector3.copy(this.velocity).normalize()

                const angleDifference = _vector3.angleTo(targetDirection)

                if (angleDifference > PI05) {
                    if (targetDirection.y > 0.8) this.velocity.y += 0.08

                    this.groundNormal.copy(targetDirection)

                    const targetLength = result.lengthSq ** 0.5

                    targetDirection.negate()

                    this.velocity.projectOnPlane(targetDirection)

                    this.position.add(
                        targetDirection.multiplyScalar(targetLength - this.boundingSphere.radius + 0.01)
                    )

                    this.resistance = terrain.resistances[result.index];
                    this.isOnGround = true
                }
            }
        }
    }


}

const targetDirection = new Vector3()
const _vector3 = new Vector3()

/**
 * 
 * @param {StaticBody} terrain 
 * @param {{
 *  position: Vector3
 *  velocity: Vector3
 *  physicsState: PhysicsState
 *  boundingSphere: Sphere
 * }} entity 
 */
export function updateStaticCollision(terrain, entity) {
    const result = staticBodyEntity(terrain, entity.boundingSphere)

    entity.physicsState.resistance = 1.05
    entity.physicsState.isOnGround = false
    entity.physicsState.isGrappled = result.isGrappled

    if (result.isGrappled) {
        targetDirection.copy(terrain.normals[result.index])
        if (result.isCollision) {
            _vector3.copy(entity.velocity).normalize()

            const angleDifference = _vector3.angleTo(targetDirection)

            if (angleDifference > PI05) {
                if (targetDirection.y > 0.8) entity.velocity.y += 0.08

                entity.physicsState.groundNormal.copy(targetDirection)

                const targetLength = result.lengthSq ** 0.5

                targetDirection.negate()

                entity.velocity.projectOnPlane(targetDirection)

                entity.position.add(
                    targetDirection.multiplyScalar(targetLength - entity.boundingSphere.radius + 0.01)
                )

                // entity.physicsState.resistance = terrain.resistances[result.index];
                entity.physicsState.isOnGround = true
            }
        }
    }
}

/**
 * 
 * @param {{
 *  position: Vector3
 *  velocity: Vector3
 *  physicsState: PhysicsState
 * }} entity
 */
export function updatePhysics(entity, dt_s) {
    entity.velocity.y -= 0.08
    entity.velocity.divideScalar(entity.physicsState.resistance)

    entity.position.x += entity.velocity.x * dt_s
    entity.position.y += entity.velocity.y * dt_s
    entity.position.z += entity.velocity.z * dt_s

    if (entity.position.y < -100) {
        entity.position.x = 0
        entity.position.y = 100
        entity.position.z = 0
    }
}

/**
 * 
 * @param {{
 *      velocity: Vector3
 *      physicsState: PhysicsState        
 * }} entity 
 * @param {Vector3} runAcceleration 
 */
export function updateRun(entity, runAcceleration, dt) {

    _vector3
        .copy(runAcceleration)
        // .multiplyScalar(((entity.physicsState.resistance - 1) * 20) * entity.actions.runSpeed)
        .multiplyScalar(((0 - 1) * 20) * dt * entity.physicsState.runSpeed)

    entity.velocity.add(_vector3)
    entity.physicsState.isRunning = _vector3.lengthSq() > 0.001
    entity.physicsState.runSpeed = 1
}
