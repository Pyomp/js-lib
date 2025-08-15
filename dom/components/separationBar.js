export const createSeparationBar = (
    /** @type {HTMLElement | undefined} */ parent = undefined
) => {
    const separationBar = document.createElement('div')
    {
        const s = separationBar.style
        s.width = '80%'
        s.maxWidth = '80%'
        s.margin = '3px auto'
        s.height = '1px'
        s.background = 'hsla(0, 0%, 50%, 0.5)'
    }
    parent?.appendChild(separationBar)
    return separationBar
}

export const createSeparationBarNoMargin = (
    /** @type {HTMLElement | undefined} */ parent = undefined
) => {
    const separationBar = document.createElement('div')
    {
        const s = separationBar.style
        s.width = '80%'
        s.margin = '0 auto'
        s.height = '1px'
        s.background = '#444444'
    }
    parent?.appendChild(separationBar)
    return separationBar
}
