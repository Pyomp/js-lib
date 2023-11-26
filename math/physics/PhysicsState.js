import { Vector3 } from "../Vector3.js"

export class PhysicsState {
    isOnGround = true
    isGrappled = false
    isRunning = false
    groundNormal = new Vector3(0, 1, 0)
    resistance = 0.1
    runSpeed = 0
}
