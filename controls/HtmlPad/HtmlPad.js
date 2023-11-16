import { addPointerMoveListener } from "../../dom/eventUtils.js"

const HTML_CENTER_X = 120
const HTML_CENTER_Y = 120
const HTML_BACKGROUND_PAD_SIZE = 160
const HTML_PAD_SIZE = 80
const BACKGROUND_FOLLOW_DISTANCE = 60

export class HtmlPad {
    directionX = 0
    directionY = 0
    length = 0

    constructor() {
        let htmlCenterX = HTML_CENTER_X
        let htmlCenterY = HTML_CENTER_Y

        const padBg = new Image(HTML_BACKGROUND_PAD_SIZE, HTML_BACKGROUND_PAD_SIZE)
        padBg.src = new URL('./padBase.svg', import.meta.url).href

        const padBgStyle = padBg.style
        padBgStyle.width = `${HTML_BACKGROUND_PAD_SIZE}px`
        padBgStyle.height = `${HTML_BACKGROUND_PAD_SIZE}px`
        padBgStyle.position = 'absolute'
        padBgStyle.transform = 'translate(-50%, -50%)'
        padBgStyle.top = `${window.innerHeight - htmlCenterY}px`
        padBgStyle.left = `${htmlCenterX}px`
        padBgStyle.userSelect = 'none'
        padBg.oncontextmenu = (event) => { event.stopPropagation(); event.preventDefault() }
        document.body.appendChild(padBg)

        const pad = new Image(HTML_PAD_SIZE, HTML_PAD_SIZE)
        pad.src = new URL('./pad.svg', import.meta.url).href

        const padStyle = pad.style
        padStyle.width = `${HTML_PAD_SIZE}px`
        padStyle.position = 'absolute'
        padStyle.transform = 'translate(-50%, -50%)'
        padStyle.top = `${window.innerHeight - htmlCenterY}px`
        padStyle.left = `${htmlCenterX}px`
        padStyle.pointerEvents = 'none'
        padStyle.userSelect = 'none'
        pad.oncontextmenu = (event) => { event.stopPropagation(); event.preventDefault() }
        document.body.appendChild(pad)

        const onMove = (e) => {
            this.x = e.x - htmlCenterX
            this.directionY = -e.y + htmlCenterY
            let distPx = this.directionX ** 2 + this.directionY ** 2
            if (distPx) {
                distPx = distPx ** 0.5
                this.directionX /= distPx
                this.directionY /= distPx
            }

            if (distPx > BACKGROUND_FOLLOW_DISTANCE) {
                const r = distPx - BACKGROUND_FOLLOW_DISTANCE
                htmlCenterX += this.directionX * r
                htmlCenterY -= this.directionY * r
                padBgStyle.top = `${htmlCenterY}px`
                padBgStyle.left = `${htmlCenterX}px`
                this.length = 1
            } else {
                this.length = distPx / BACKGROUND_FOLLOW_DISTANCE
            }
            padStyle.top = `${e.y}px`
            padStyle.left = `${e.x}px`
        }

        addPointerMoveListener(padBg,
            onMove,
            (e) => {
                htmlCenterX = e.x
                htmlCenterY = e.y
                padBgStyle.top = `${htmlCenterY}px`
                padBgStyle.left = `${htmlCenterX}px`
                padStyle.top = `${htmlCenterY}px`
                padStyle.left = `${htmlCenterX}px`
            },
            () => {
                this.length = 0
                this.x = 0
                this.directionY = 0
                htmlCenterX = HTML_CENTER_X
                htmlCenterY = HTML_CENTER_Y
                padBgStyle.top = `${window.innerHeight - htmlCenterY}px`
                padBgStyle.left = `${htmlCenterX}px`
                padStyle.top = `${window.innerHeight - htmlCenterY}px`
                padStyle.left = `${htmlCenterX}px`
            }
        )

        addEventListener("resize", () => {
            padBgStyle.top = `${window.innerHeight - htmlCenterY}px`
            padBgStyle.left = `${htmlCenterX}px`
            padStyle.top = `${window.innerHeight - htmlCenterY}px`
            padStyle.left = `${htmlCenterX}px`
        })
    }
}
