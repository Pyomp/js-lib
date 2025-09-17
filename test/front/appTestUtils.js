export const appTestUtils = {
    async getTestTree(
        /** @type {string} */ url
    ) {
        /** @type {UnitTestWebsocketNode[]} */
        const tree = []

        const describe = (
            /** @type {string} */ title,
            /** @type {()=>void} */ callback
        ) => {
            tree.push({ type: 'describe', title })
            callback()
            tree.push({ type: 'end_describe' })
        }
        window.describe = describe

        const test = (
            /** @type {string} */ title
        ) => {
            tree.push({ type: 'test', title })
        }
        window.it = test
        window.test = test

        await import('/' + url)

        return tree
    },
    getTests(
        /** @type {  UnitTestWebsocketNode[] } */ tree
    ) {
        return tree.filter((value) => value.type === 'test')
    },
    async getTestCallbacks(
        /** @type {string} */ url
    ) {
        /** @type {(()=>void)[]} */
        const callbacks = []
        const describe = (
            /** @type {string} */ title,
            /** @type {()=>void} */ callback
        ) => {
            callback()
        }
        window.describe = describe

        const test = (
            /** @type {string} */ title,
            /** @type {()=>void} */ callback
        ) => {
            callbacks.push(callback)
        }
        window.it = test
        window.test = test

        await import('/' + url)

        return callbacks
    },
    pprint(
        /** @type { UnitTestWebsocketNode[] } */ tree
    ) {
        for (const line of tree) {
            if (line.type === 'describe') console.group(line.title)
            if (line.type === 'test') {
                const result = line.result
                if (result.success === true) {
                    console.log(`✅ ${line.title} (${result.time.toFixed(1)} ms)`)
                    if (result.console) console.log(result.console)
                } else {
                    console.log(`❌ ${line.title} (${result.time.toFixed(1)} ms)`)
                    console.log(result.error)
                }
            }
            if (line.type === 'end_describe') console.groupEnd()
        }
    },
    async runIframeFunction(
        /** @type {string} */ url,
        /** @type {string} */ functionName,
        ...args
    ) {
        const iframe = document.createElement('iframe')
        iframe.src = url
        iframe.allow = "display-capture"
        iframe.style.display = 'none'

        document.body.append(iframe)

        const waitForRunTestLoaded = () => new Promise((resolve) => {
            // @ts-ignore
            if (!iframe.contentWindow[functionName]) {
                setTimeout(() => { resolve(waitForRunTestLoaded()) })
            } else {
                resolve(undefined)
            }
        })

        const waitForLoad = () => new Promise(resolve => { if (iframe.contentWindow) iframe.contentWindow.onload = resolve })


        await waitForLoad()
        await waitForRunTestLoaded()
        // @ts-ignore
        const result = await iframe.contentWindow[functionName](...args)

        iframe.remove()
        return result
    }
}
