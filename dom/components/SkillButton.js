import { PI05, PI2 } from "../../math/MathUtils.js"
import { loopRaf } from "../../utils/loopRaf.js"

const xmlns = "http://www.w3.org/2000/svg"

export class SkillButton {
    htmlElement = document.createElement('div')

    svg = document.createElementNS(xmlns, "svg")
    
    cooldown = 0.001 // for 1st update in constructor
    maxCooldown = 1

    start = false
    ongoing = false
    end = false

    x = 0
    y = 0

    #pressed = false

    #cd = document.createElementNS(xmlns, 'path')

    #text = document.createElementNS(xmlns, 'text')

    #middle

    setImage(imageUrl) {
        this.svg.style.backgroundImage = `url(${imageUrl})`
    }

    constructor({
        parent = undefined,
        size = 44,
        padding = 3,
        imageUrl = undefined,
        id,
    }) {
        this.id = id

        const m = size / 2
        this.#middle = m

        this.htmlElement.appendChild(this.svg)
        this.htmlElement.style.padding = `${padding}px`
        this.htmlElement.style.height = `${padding}px`
        this.htmlElement.style.width = `${padding * 2 + size}px`
        this.htmlElement.style.height = `${padding * 2 + size}px`

        this.svg.style.backgroundSize = `${size}px ${size}px`

        this.svg.style.borderRadius = '50%'
        this.svg.setAttributeNS(null, 'height', size)
        this.svg.setAttributeNS(null, 'width', size)
        this.svg.setAttributeNS(null, 'overflow', 'visible')

        parent?.appendChild(this.svg)
        if (imageUrl) this.setImage(imageUrl)

        this.#cd.setAttributeNS(null, 'fill', '#00000088')
        this.#cd.setAttributeNS(null, 'd', `M ${m} ${m} L ${m} 0 A ${m} ${m} 0 1 0 0 0`)
        this.svg.appendChild(this.#cd)

        this.#text.setAttribute('fill', '#ffffff')
        this.#text.setAttribute('dominant-baseline', 'middle')
        this.#text.setAttribute('text-anchor', 'middle')
        this.#text.style.fontSize = `${m / 2}px`
        this.#text.setAttribute('x', m)
        this.#text.setAttribute('y', m)
        this.svg.appendChild(this.#text)

        this.htmlElement.onpointerdown = this.#onpointerdown.bind(this)
        this.htmlElement.onlostpointercapture = this.#onlostpointercapture.bind(this)

        this.update()
    }

    dispose() {
        this.svg.remove()
    }

    #onpointerdown(event) {
        this.svg.setPointerCapture(event.pointerId)
        this.#pressed = true
    }

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
    }

    #onlostpointercapture(event) {
        this.svg.releasePointerCapture(event.pointerId)
        this.#pressed = false
    }
}
