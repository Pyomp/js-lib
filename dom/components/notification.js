import { visibility } from "../visibility.js"

const FADE = 0.5
const MAX_INFO = 5
const TIME_ALIVE = 5_000

/** @type {SVGTextElement[]} */
const texts = []

const xmlns = "http://www.w3.org/2000/svg"

const svg = document.createElementNS(xmlns, "svg")
svg.setAttribute("width", '100%')
svg.setAttribute("height", '100%')
svg.style.position = 'fixed'
svg.style.zIndex = '9999'
svg.style.overflow = 'hidden'
svg.style.pointerEvents = 'none'
svg.style.userSelect = 'none'

function createNotificationText() {
    const text = document.createElementNS(xmlns, 'text')

    text.setAttribute('font-weight', '500')
    text.setAttribute("x", "50%")
    text.setAttribute("y", "15%")
    text.setAttribute('stroke', 'black')
    text.setAttribute('stroke-width', '4')
    text.setAttribute('stroke-linecap', 'round')
    text.setAttribute('stroke-linejoin', 'round')
    text.setAttribute('paint-order', "stroke")
    text.setAttribute("text-anchor", "middle")
    text.setAttribute("dominant-baseline", "text-after-edge")
    text.style.transition = `opacity ${FADE}s, transform ${FADE}s`
    text.style.opacity = '0'

    svg.appendChild(text)

    return text
}


let baseBottom = 0
function computeBaseBottom() {
    baseBottom = Math.floor(window.innerHeight * 0.85)
}
computeBaseBottom()
window.addEventListener('resize', computeBaseBottom)

const loadingSpinner = document.createElement('div')

loadingSpinner.style.position = 'fixed'
loadingSpinner.style.top = '5px'
loadingSpinner.style.right = '5px'
loadingSpinner.style.zIndex = '999'
loadingSpinner.style.width = '20px'
loadingSpinner.style.height = '20px'
loadingSpinner.style.border = '5px solid hsl(250, 100%, 70%)'
loadingSpinner.style.borderTopColor = 'hsl(250, 100%, 85%)'
loadingSpinner.style.borderRadius = '50%'
loadingSpinner.style.animation = 'spin 0.8s linear infinite'

let loadingRequestCount = 0

export const notification = {
    htmlElement: svg,
    displayLoadingSpinner() {
        loadingRequestCount++
        document.body.appendChild(loadingSpinner)
    },
    removeLoadingSpinner() {
        loadingRequestCount--
        if (loadingRequestCount == 0) loadingSpinner.remove()
    },
    push(
        /** @type {string} */ str,
        /** @type {string} */ color = 'hsl(200, 100%, 60%)'
    ) {
        if (!visibility.isVisible) return
        /** @type {SVGTextElement} */
        const text = createNotificationText()

        texts.unshift(text)

        function onEnd() {
            if (text.style.opacity === '0') {
                text.remove()
                const index = texts.indexOf(text)
                if (index !== -1) texts.splice(index, 1)
            }
        }
        text.ontransitionend = onEnd
        text.ontransitioncancel = onEnd

        setTimeout(() => {
            if (text.style.opacity !== '0') {
                text.style.transform += ' translateY(-40px)'
                text.style.opacity = '0'
            }
        }, TIME_ALIVE)

        text.setAttribute('fill', color)
        text.textContent = str
        text.style.transform = `translateY(-${text.getBBox().height})`

        requestAnimationFrame(() => {
            text.style.opacity = '1'
            let height = 0
            for (let i = 0; i < MAX_INFO; i++) {
                const element = texts[i]
                if (!element) break
                element.style.transform = `translateY(${height}px)`
                height -= element.getBBox().height
            }

            while (texts.length > MAX_INFO) {
                const element = texts.pop()
                if (element) {
                    element.style.transform = `translateY(${height}px)`
                    height -= element.getBBox().height
                    element.style.opacity = '0'
                    console.log(element.textContent, text.style.transform)
                }
            }
        })
    }
}
