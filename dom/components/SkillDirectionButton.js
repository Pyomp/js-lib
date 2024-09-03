import { PI05, PI2 } from "../../math/MathUtils.js"
import { loopRaf } from "../../utils/loopRaf.js"

const xmlns = "http://www.w3.org/2000/svg"

export class SkillDirectionButton {
    htmlElement = document.createElementNS(xmlns, "svg")

    cooldown = 0.01
    maxCooldown = 10

    start = false
    ongoing = false
    end = false

    x = 0
    y = 0

    #pressed = false

    #direction = document.createElementNS(xmlns, 'line')

    #cd = document.createElementNS(xmlns, 'path')

    #text = document.createElementNS(xmlns, 'text')

    #middle

    #directionMaxLength
    #directionMaxLengthSq

    #absoluteCenterX = 0
    #absoluteCenterY = 0

    #updateAbsoluteCenter() {
        const { x, y, width, height } = this.htmlElement.getBoundingClientRect()
        this.#absoluteCenterX = x + width / 2
        this.#absoluteCenterY = y + height / 2

    }
    #resizeObserver = new ResizeObserver(this.#updateAbsoluteCenter.bind(this))

    setImage(imageUrl) {
        this.htmlElement.style.backgroundImage = `url(${imageUrl})`
    }

    constructor({
        parent = undefined,
        size = 40,
        directionColor = '#5555ff55',
        directionWidth = size * 0.5,
        directionMaxLength = size * 2,
        imageUrl = undefined,
        id,
    }) {
        this.id = id
        
        const m = size / 2
        this.#middle = m
        this.#directionMaxLength = directionMaxLength
        this.#directionMaxLengthSq = directionMaxLength ** 2

        this.htmlElement.style.borderRadius = '50%'
        this.htmlElement.style.backgroundSize = 'cover'
        this.htmlElement.setAttributeNS(null, 'height', size)
        this.htmlElement.setAttributeNS(null, 'width', size)
        this.htmlElement.setAttributeNS(null, 'overflow', 'visible')
        parent?.appendChild(this.htmlElement)
        if (imageUrl) this.setImage(imageUrl)

        this.#cd.setAttributeNS(null, 'fill', '#00000088')
        this.#cd.setAttributeNS(null, 'd', `M ${m} ${m} L ${m} 0 A ${m} ${m} 0 1 0 0 0`)
        this.htmlElement.appendChild(this.#cd)

        this.#text.setAttribute('fill', '#ffffff')
        this.#text.setAttribute('dominant-baseline', 'middle')
        this.#text.setAttribute('text-anchor', 'middle')
        this.#text.style.fontSize = `${m / 2}px`
        this.#text.setAttribute('x', m)
        this.#text.setAttribute('y', m)
        this.htmlElement.appendChild(this.#text)

        this.#direction.setAttribute('x1', m)
        this.#direction.setAttribute('y1', m)
        this.#direction.setAttribute('x2', m)
        this.#direction.setAttribute('y2', m)
        this.#direction.setAttribute('stroke', directionColor)
        this.#direction.setAttribute('stroke-width', directionWidth)
        this.#direction.setAttribute('stroke-linecap', 'round')

        this.#direction.setAttributeNS(null, 'x1', m)
        this.#direction.setAttributeNS(null, 'y1', m)
        this.#direction.setAttributeNS(null, 'x2', m + 10)
        this.#direction.setAttributeNS(null, 'y2', m + 10)

        this.htmlElement.onpointerdown = this.#onpointerdown.bind(this)
        this.htmlElement.onpointermove = this.#onpointermove.bind(this)
        this.htmlElement.onlostpointercapture = this.#onlostpointercapture.bind(this)

        this.#resizeObserver.observe(this.htmlElement)
    }

    dispose() {
        this.#resizeObserver.disconnect()
        this.htmlElement.remove()
    }

    #centerDirectionX
    #centerDirectionY

    #distanceDirectionX
    #distanceDirectionY

    #eventX
    #eventY

    #downX
    #downY

    #onpointerdown(event) {
        this.htmlElement.setPointerCapture(event.pointerId)
        this.#downX = event.clientX
        this.#downY = event.clientY
        this.#centerDirectionX = event.clientX - this.#absoluteCenterX
        this.#centerDirectionY = event.clientY - this.#absoluteCenterY
        this.#direction.setAttributeNS(null, 'x1', this.#centerDirectionX + this.#middle)
        this.#direction.setAttributeNS(null, 'y1', this.#centerDirectionY + this.#middle)
        this.htmlElement.appendChild(this.#direction)
        this.#direction.setAttributeNS(null, 'x2', this.#centerDirectionX + this.#middle)
        this.#direction.setAttributeNS(null, 'y2', this.#centerDirectionY + this.#middle)
        this.#pressed = true
    }

    #moveNeedsUpdate = false
    update = this.#updatePrototype.bind(this)
    #updatePrototype() {
        this.start = false
        this.end = false
        if (this.#pressed && !this.ongoing) {
            this.start = true
            this.ongoing = true
        } else if (!this.#pressed && this.ongoing) {
            this.end = true
            this.ongoing = false
        }

        if (this.cooldown > 0) {
            this.cooldown -= loopRaf.deltatimeSecond
            const cdNormalized = Math.max(this.cooldown / this.maxCooldown, 0)
            const angleCd = (1 - cdNormalized) * PI2 - PI05
            const s = Math.sin(angleCd)
            const c = Math.cos(angleCd)
            const m = (c < 0 ? 0 : 1) ^ (s < 1 ? 0 : 0)
            this.#cd.setAttributeNS(null, 'd', `M ${this.#middle} ${this.#middle} L ${this.#middle} 0 A ${this.#middle} ${this.#middle} 0 ${m} 0 ${this.#middle + this.#middle * c} ${this.#middle + this.#middle * s}`)

            if (cdNormalized > 0) this.#text.innerHTML = this.cooldown.toFixed(1)
            else this.#text.innerHTML = ''
        }

        if (this.#moveNeedsUpdate) {
            this.#moveNeedsUpdate = false
            this.#distanceDirectionX = this.#eventX - this.#downX
            this.#distanceDirectionY = this.#eventY - this.#downY

            const distanceSq = this.#distanceDirectionX ** 2 + this.#distanceDirectionY ** 2
            const distance = distanceSq ** 0.5
            this.x = this.#distanceDirectionX / distance
            this.y = this.#distanceDirectionY / distance

            if (distanceSq > this.#directionMaxLengthSq) {
                this.#distanceDirectionX = this.x * this.#directionMaxLength
                this.#distanceDirectionY = this.y * this.#directionMaxLength
            }

            this.#direction.setAttributeNS(null, 'x2', this.#downX + this.#distanceDirectionX - this.#absoluteCenterX + this.#middle)
            this.#direction.setAttributeNS(null, 'y2', this.#downY + this.#distanceDirectionY - this.#absoluteCenterY + this.#middle)

            this.theta = Math.atan2(this.#distanceDirectionY, this.#distanceDirectionX)
            this.force = distance / this.#directionMaxLength
        }
    }

    #onpointermove(event) {
        if (!this.htmlElement.hasPointerCapture(event.pointerId)) return
        this.#eventX = event.clientX
        this.#eventY = event.clientY
        this.#moveNeedsUpdate = true
    }



    #onlostpointercapture(event) {
        this.htmlElement.releasePointerCapture(event.pointerId)
        this.x = this.#distanceDirectionX / this.#directionMaxLength
        this.y = this.#distanceDirectionY / this.#directionMaxLength
        this.#direction.remove()
        this.#pressed = false
    }
}
