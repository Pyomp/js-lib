import { EventSet } from "../../utils/EventSet.js"
import { styles } from "../styles/styles.js"

export class ModalDiv {
    htmlElement = document.createElement('div')

    content = document.createElement('div')

    /** @type {EventSet<()=>void>} */
    onClose = new EventSet()

    constructor() {
        this.htmlElement.style.position = 'absolute'
        this.htmlElement.style.top = '0'
        this.htmlElement.style.left = '0'

        this.htmlElement.style.width = '100%'
        this.htmlElement.style.height = '100%'

        this.htmlElement.style.display = 'flex'
        this.htmlElement.style.justifyContent = 'center'
        this.htmlElement.style.alignItems = 'center'

        this.htmlElement.style.background = styles.vars['--background-transparent05']

        this.htmlElement.appendChild(this.content)

        this.htmlElement.addEventListener('click', (event) => {
            if (!this.htmlElement.nextSibling) {
                event.stopPropagation()
                event.preventDefault()
                this.close()
            }
        })

        this.content.addEventListener('click', (event) => {
            event.stopPropagation()
        })
    }

    isDisplayed() {
        return !!this.htmlElement.parentNode
    }

    display() {
        if (!this.isDisplayed()) {
            addEventListener('keyup', this.#onEscapeKeyBound)
            document.body.appendChild(this.htmlElement)
        }
    }

    close() {
        removeEventListener('keyup', this.#onEscapeKeyBound)
        this.onClose.emit()
        this.htmlElement.remove()
    }

    #onEscapeKeyBound = this.#onEscapeKey.bind(this)
    #onEscapeKey(
        /** @type {KeyboardEvent} */ event
    ) {
        if (event.code === 'Escape' && !this.htmlElement.nextSibling) {
            event.stopPropagation()
            event.preventDefault()
            this.close()
        }
    }
}
