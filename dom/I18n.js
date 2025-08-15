/**
 * @example
 * i18n.register(divElement, 'hello') // hello  
 * await i18n.setLanguage('fr') // salut  
*/
export class I18n {
    /** @type {{[language: string]: (URL | string)[]}} */
    #urls = {}

    /** @type {string} */
    #language = 'en'

    /** @type {{[key: string]: string}[]} */
    #dictionaries = []

    /** @type {Set<string>} */
    #notImplemented = new Set()

    /** @type {Map<Element, {str: string, elementMap: {[key: string]: Element}}>} */
    #elementMap = new Map()

    async registerDictionary(
        /** @type {string} */ language,
        /** @type {URL | string} */ url
    ) {
        if (!this.#urls[language]) this.#urls[language] = []
        this.#urls[language].push(url)
        await this.#updateAllElement()
    }

    async unregisterDictionary(
        /** @type {string | URL} */ url
    ) {
        for (const key in this.#urls) {
            const index = this.#urls[key].findIndex((value) => value === url)
            if (index !== -1) {
                this.#urls[key].splice(index, 1)
                break
            }
        }
        await this.#updateAllElement()
    }

    /**
     * @returns {Promise<{[key: string]: string}[]> | []}
    */
    #getDictionaries(
        /** @type {string} */ language
    ) {
        if (!this.#urls[language]) return []
        return Promise.all(this.#urls[language].map(
            async (url) => (await fetch(url)).json()
        ))
    }

    async init() {
        const res = await this.setLanguage(localStorage.getItem('language') || navigator.language)
    }

    async #updateDictionaries() {
        this.#dictionaries = await this.#getDictionaries(this.#language)
    }

    async #updateAllElement() {
        await this.#updateDictionaries()
        for (const element of this.#elementMap.keys()) {
            this.#updateElement(element)
        }
    }


    async setLanguage(
        /** @type {string} */ language
    ) {
        localStorage.setItem('language', language)
        this.#language = language
        this.#dictionaries = await this.#getDictionaries(this.#language)
        await this.#updateAllElement()
    }


    #warningForNotImplementedKeys(
        /** @type {string} */ i18nKey
    ) {
        if (this.#notImplemented.has(i18nKey) === false) {
            this.#notImplemented.add(i18nKey)
            const trad = (i18nKey[0]?.toUpperCase() + i18nKey.substring(1)).replaceAll('_', ' ')
            console.warn(`'${i18nKey}': \`${trad}\`,`)
        }
    }

    #renderMarkdown(
        /** @type {string} */ markdown
    ) {
        return markdown
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
    }

    #renderElement(
        /** @type {Element} */ element,
        /** @type {string} */str,
        /** @type {{[key: string]: Element}} */ elementMap
    ) {
        element.innerHTML =
            str.replace(/\$([a-zA-Z_][\w-]*)/g, (_, name) => {
                return `<span data-placeholder="${name}"></span>`
            })

        for (const placeholder of element.querySelectorAll('[data-placeholder]')) {
            const placeholderName = placeholder.dataset.placeholder
            const replaceElement = elementMap[placeholderName]
            replaceElement.style.verticalAlign = 'middle'
            placeholder.replaceWith(replaceElement)
        }
    }

    /**
     * @returns { Promise<string> }
    */
    async #getTraduction(
        /** @type {string | Array<string>} */ i18nKey,
    ) {
        if (typeof i18nKey === 'string') {
            for (const dictionary of this.#dictionaries) {
                if (dictionary[i18nKey]) return dictionary[i18nKey]
            }
            this.#warningForNotImplementedKeys(i18nKey)
            return i18nKey
        } else if (Array.isArray(i18nKey)) {
            return (await Promise.all(i18nKey.map(s => this.#getTraduction(s)))).join(' ')
        } else {
            console.warn('i18n wrong use')
            return ''
        }
    }

    async register(
        /** @type {Element} */ element,
        /** @type {string} */ str,
        /** @type {{[key: string]: Element}} */ elementMap = {},
    ) {
        this.#elementMap.set(element, { str, elementMap })
        this.#updateElement(element)
    }

    async #updateElement(
    /** @type {Element} */ element
    ) {
        const { str, elementMap } = this.#elementMap.get(element)
        this.#renderElement(element, this.#renderMarkdown(await this.#getTraduction(str)), elementMap)
    }

    unregisterDeep(
        /** @type {Element} */ element
    ) {
        this.#elementMap.delete(element)
        for (const child of element.children) {
            this.unregisterDeep(child)
        }
    }

    async reset() {
        for (const key in this.#urls) delete this.#urls[key]
        this.#language = 'en'
        this.#notImplemented.clear()
        this.#elementMap.clear()

        await this.init()
    }
}

export const i18n = new I18n()

await i18n.init()
