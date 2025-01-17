export class CssClass {
    /** @type {string} */ name
    css = ''

    constructor(
        /** @type {string} */ name,
        /** @type {string[]} */ css
    ) {
        this.name = name
        this.css = `.${name} { \n${css.join(';\n')} \n   }`
    }
}
