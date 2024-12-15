import { addPointerMoveListener } from "../../dom/eventUtils.js" 

const BG_SIZE = 160
const PAD_SIZE = 80
const BASE_LEFT = 120
const BASE_BOTTOM = 120
const BG_MAX_LENGTH_FOLLOW = 60

export class PadInput {
    theta = 0
    length = 0
    x = 0
    y = 0

    htmlElement = document.createElement('div')

    #bgPosX = BASE_LEFT
    #bgPosY = window.innerHeight - BASE_BOTTOM

    #eventX = this.#bgPosX
    #eventY = this.#bgPosY

    #padBg = document.createElement('div') //new Image(BG_SIZE, BG_SIZE)
    #padBgStyle = this.#padBg.style
    #pad = new Image(PAD_SIZE, PAD_SIZE)
    #padStyle = this.#pad.style

    #needsUpdate = true

    set display(value) {
        if (value) {
            this.htmlElement.appendChild(this.#padBg)
            this.htmlElement.appendChild(this.#pad)
        } else {
            this.#pad.remove()
            this.#padBg.remove()
        }
    }

    constructor() {
        this.htmlElement.style.position = 'absolute'
        this.htmlElement.style.top = '0'
        this.htmlElement.style.left = '0'
        this.htmlElement.style.width = '100%'
        this.htmlElement.style.height = '100%'
        this.htmlElement.style.overflow = 'none'
        this.htmlElement.style.userSelect = 'none'
        this.htmlElement.style.pointerEvents = 'none'

        this.#padBgStyle.backgroundImage = `url(${new URL('./padBase.svg', import.meta.url).href})`
        this.#padBgStyle.backgroundSize = 'cover'
        this.#padBgStyle.width = `${BG_SIZE}px`
        this.#padBgStyle.height = `${BG_SIZE}px`

        this.#padBgStyle.position = 'absolute'
        this.#padBgStyle.transform = 'translate(-50%, -50%)'
        this.#padBgStyle.top = `${window.innerHeight - this.#bgPosY}px`
        this.#padBgStyle.left = `${this.#bgPosX}px`
        this.#padBgStyle.userSelect = 'none'
        this.#padBgStyle.pointerEvents = 'auto'
        this.#padBg.oncontextmenu = (event) => { event.stopPropagation(); event.preventDefault() }
        this.htmlElement.appendChild(this.#padBg)

        this.#pad.src = new URL('./pad.svg', import.meta.url).href

        this.#padStyle.position = 'absolute'
        this.#padStyle.transform = 'translate(-50%, -50%)'
        this.#padStyle.top = `${window.innerHeight - this.#bgPosY}px`
        this.#padStyle.left = `${this.#bgPosX}px`
        this.#padStyle.pointerEvents = 'none'
        this.#padStyle.userSelect = 'none'
        this.#pad.oncontextmenu = (event) => { event.stopPropagation(); event.preventDefault() }
        this.htmlElement.appendChild(this.#pad)

        const onMove = (e) => {
            this.#eventX = e.x
            this.#eventY = e.y
            this.#needsUpdate = true
        }

        addPointerMoveListener(this.#padBg,
            onMove,
            (e) => {
                this.#bgPosX = e.x
                this.#bgPosY = e.y
                this.#padBgStyle.top = `${this.#bgPosY}px`
                this.#padBgStyle.left = `${this.#bgPosX}px`
                this.#padStyle.top = `${this.#bgPosY}px`
                this.#padStyle.left = `${this.#bgPosX}px`
            },
            this.#resetBound
        )

        this.#resizeObserver.observe(this.htmlElement)
    }

    #resetBound = this.reset.bind(this)
    reset() {
        this.length = 0
        this.x = 0
        this.y = 0
        this.#bgPosX = BASE_LEFT
        this.#bgPosY = this.htmlElement.clientHeight - BASE_BOTTOM
        this.#eventX = this.#bgPosX
        this.#eventY = this.#bgPosY
        this.#padBgStyle.top = `${this.#bgPosY}px`
        this.#padBgStyle.left = `${this.#bgPosX}px`
        this.#padStyle.top = `${this.#bgPosY}px`
        this.#padStyle.left = `${this.#bgPosX}px`
    }

    #resizeObserver = new ResizeObserver(this.#resetBound)

    update() {
        if (!this.#needsUpdate) return
        this.#needsUpdate = false

        this.#padStyle.left = `${this.#eventX}px`
        this.#padStyle.top = `${this.#eventY}px`

        const lengthPxX = this.#eventX - this.#bgPosX
        const lengthPxY = -this.#eventY + this.#bgPosY

        let distPx = lengthPxX ** 2 + lengthPxY ** 2
        if (distPx) {
            distPx = distPx ** 0.5
            this.x = lengthPxX / distPx
            this.y = lengthPxY / distPx
        }

        if (distPx > BG_MAX_LENGTH_FOLLOW) {
            const r = distPx - BG_MAX_LENGTH_FOLLOW
            this.#bgPosX += this.x * r
            this.#bgPosY -= this.y * r
            this.#padBgStyle.top = `${this.#bgPosY}px`
            this.#padBgStyle.left = `${this.#bgPosX}px`
            this.length = 1
        } else {
            this.length = distPx / BG_MAX_LENGTH_FOLLOW
        }
    }
}
