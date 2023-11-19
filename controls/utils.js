import { PI, PI025, PI05, PI075 } from "../math/MathUtils.js"

export function getMoveFromKey(up, down, left, right) {
    let length = 0
    let theta = 0
    
    if (up === true) {
        if (left === true) theta = -PI075
        else if (right === true) theta = PI075
        else theta = -PI
        length = 1
    } else if (down === true) {
        if (left === true) theta = -PI025
        else if (right === true) theta = PI025
        length = 1
    } else {
        if (left === true) {
            theta = -PI05
            length = 1
        } else if (right === true) {
            theta = PI05
            length = 1
        }
    }

    return {
        theta,
        length
    }
}

export function rotateFromCameraTheta(x, y, cameraTheta) {
    const theta = Math.atan2(y, x) + cameraTheta
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    return {
        theta,
        x: x * s + y * c,
        y: x * c - y * s
    }
}
