import { clamp, PI2 } from '../../math/MathUtils.js'
import { _down, Vector3 } from '../../math/Vector3.js'
import { isMobile } from '../../dom/browserInfo.js'
import { distanceRayMesh } from '../extras/raycasterUtils.js'
import { Spherical } from '../../math/Spherical.js'
import { Sphere } from '../../math/Sphere.js'
import { Ray } from '../../math/Ray.js'
import { Camera } from '../sceneGraph/Camera.js'

const MinPolarAngle = 0.1
const MaxPolarAngle = 3.05
const MinDistCam = 1
const MaxDistCam = 70
const MinDistCamToGround = 0.5

export class ThirdControls {
    offsetY = 0.5
    sensitivity = 8

    #targetOffset = new Vector3()
    target = new Vector3()
    enabled = true

    #isModeFollow = true

    spherical = new Spherical(MaxDistCam, 0.8, 0.8)
    #wantedSpherical = new Spherical().copy(this.spherical)

    #direction = new Vector3(5, 5, 5)

    #cameraPosition
    #camera
    #rayDown

    #boundingSphere = new Sphere(undefined, 2)

    #dx = 0
    #dy = 0
    #domElement
    /**
     * 
     * @param {Camera} camera
     * @param {HTMLElement} domElement
     */
    constructor(
        camera,
        domElement
    ) {
        this.#domElement = domElement
        domElement.style.touchAction = 'none'
        domElement.oncontextmenu = (event) => { event.stopPropagation(); event.preventDefault(); return }

        this.dispose = isMobile ? this.#initMobileEvent(domElement) : this.#initComputerEvent(domElement)

        this.#camera = camera
        this.#cameraPosition = camera.position
        this.#rayDown = new Ray(new Vector3(0, 1000, 0), _down)
        this.#boundingSphere.center = camera.position
    }

    /** @type {{positions: Float32Array, indices: Uint8Array | Uint16Array | Uint32Array}[]} */
    groundGeometries = []

    update() {
        if (!this.enabled) return

        if (this.#dx !== 0 || this.#dy !== 0) {
            const deltaTheta = this.#dx * this.sensitivity / this.#domElement.clientHeight // yes, height
            const deltaPhi = this.#dy * this.sensitivity / this.#domElement.clientHeight // rotate Up
            this.#wantedSpherical.theta = (this.#wantedSpherical.theta - deltaTheta) % PI2
            this.#wantedSpherical.phi = (this.#wantedSpherical.phi - deltaPhi) % PI2

            if (this.#wantedSpherical.phi < MinPolarAngle) this.#wantedSpherical.phi = MinPolarAngle
            else if (this.#wantedSpherical.phi > MaxPolarAngle) this.#wantedSpherical.phi = MaxPolarAngle

            this.#dx = 0
            this.#dy = 0
        }

        this.#targetOffset.copy(this.target)
        this.#targetOffset.y += this.offsetY + this.#wantedSpherical.radius * 0.1

        this.spherical.copy(this.#wantedSpherical)

        if (this.#isModeFollow === true) {
            this.#direction.subVectors(this.#cameraPosition, this.#targetOffset)
            this.spherical.theta = Math.atan2(this.#direction.x, this.#direction.z)
        }

        this.#direction.setFromSpherical(this.spherical)

        this.#cameraPosition.addVectors(this.#targetOffset, this.#direction)

        for (const geometry of this.groundGeometries) {
            const groundHeight = this.#rayDown.origin.y - distanceRayMesh(this.#rayDown, geometry.indices, geometry.positions)
            if (this.#cameraPosition.y < groundHeight + MinDistCamToGround) {
                this.#cameraPosition.y = groundHeight + MinDistCamToGround
            }
        }

        this.#camera.target.copy(this.#targetOffset)

        this.#camera.update()
    }

    #initMobileEvent(domElement) {
        let p1
        let p1X = 0, p1Y = 0
        let p2
        let p2X = 0, p2Y = 0
        let dist = 0

        const onPointerdown = (e) => {
            if (p1 === undefined) {
                this.#wantedSpherical.copy(this.spherical)
                this.#isModeFollow = false
                domElement.setPointerCapture(e.pointerId)
                p1 = e.pointerId; p1X = e.clientX; p1Y = e.clientY
            } else if (p2 === undefined) {
                domElement.setPointerCapture(e.pointerId)
                p2 = e.pointerId; p2X = e.clientX; p2Y = e.clientY
                dist = ((p1X - p2X) ** 2 + (p1Y - p2Y) ** 2) ** .5
            }
        }

        const onEnd = (e) => {
            const id = e.pointerId
            domElement.releasePointerCapture(id)
            if (p1 === id) {
                p1 = p2
                p1X = p2X
                p1Y = p2Y
                p2 = undefined
                this.#isModeFollow = !p1
            } else if (p2 === id) {
                p2 = undefined
            }
        }

        const onPointermove = (e) => {
            const id = e.pointerId
            if (p1 === id || p2 === id) {
                if (p2) { // zoom
                    if (p1 === id) { p1X = e.clientX; p1Y = e.clientY }
                    else if (p2 === id) { p2X = e.clientX; p2Y = e.clientY }

                    const newDist = ((p1X - p2X) ** 2 + (p1Y - p2Y) ** 2) ** .5
                    const delta = dist - newDist
                    dist = newDist

                    this.#wantedSpherical.phi = this.spherical.phi
                    this.#wantedSpherical.theta = this.spherical.theta
                    this.#wantedSpherical.radius = clamp(this.#wantedSpherical.radius + delta * 0.05, MinDistCam, MaxDistCam)

                    this.spherical.radius = this.#wantedSpherical.radius
                } else {
                    this.#dx += e.clientX - p1X
                    this.#dy += e.clientY - p1Y
                    p1X = e.clientX; p1Y = e.clientY // save last mouse position
                }
            }
        }

        domElement.addEventListener('pointerdown', onPointerdown)
        domElement.addEventListener('lostpointercapture', onEnd)
        domElement.addEventListener('pointermove', onPointermove)

        return () => {
            domElement.removeEventListener('pointerdown', onPointerdown)
            domElement.removeEventListener('lostpointercapture', onEnd)
            domElement.removeEventListener('pointermove', onPointermove)
        }
    }

    #initComputerEvent(domElement) {
        const onWheel = (e) => {
            if (e.target !== domElement) return

            const delta = (-e.wheelDelta * this.spherical.radius) / 1000

            this.#wantedSpherical.phi = this.spherical.phi
            this.#wantedSpherical.theta = this.spherical.theta
            this.#wantedSpherical.radius = clamp(this.#wantedSpherical.radius + delta, MinDistCam, MaxDistCam)

            this.spherical.radius = this.#wantedSpherical.radius
        }

        const onPointermove = (e) => {

            this.#dx += e.movementX
            this.#dy += e.movementY
        }

        domElement.addEventListener('pointerdown', (e) => {
            domElement.requestPointerLock()
        })

        const lockChangeAlert = () => {
            domElement.focus()
            if (document.pointerLockElement === null) {
                domElement.removeEventListener('mousemove', onPointermove)
                this.#isModeFollow = true
            } else {
                if (!this.enabled) return
                domElement.addEventListener('mousemove', onPointermove)
                this.#wantedSpherical.copy(this.spherical)
                this.#isModeFollow = false
            }
        }

        document.addEventListener('pointerlockchange', lockChangeAlert, false)
        document.addEventListener('mozpointerlockchange', lockChangeAlert, false)
        document.addEventListener('webkitpointerlockchange', lockChangeAlert, false)
        document.addEventListener('wheel', onWheel)

        return () => {
            document.removeEventListener('wheel', onWheel)
            document.removeEventListener('pointerlockchange', lockChangeAlert, false)
            document.removeEventListener('mozpointerlockchange', lockChangeAlert, false)
            document.removeEventListener('webkitpointerlockchange', lockChangeAlert, false)
        }
    }
}
