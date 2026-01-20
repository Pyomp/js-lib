import { appTestUtils } from "../front/appTestUtils.js"

let stdinBusy = false

export const consoleUtils = {
    pprintResult(
        /** @type {string} */ testFileUrl,
        /** @type { UnitTestWebsocketNode[] } */ result,
        /** @type {number} */ t0
    ) {
        // consoleUtils.clearStdout()
        const time = performance.now() - t0
        console.group(`${testFileUrl} (${time.toFixed()} ms)`)
        for (const line of result) {
            if (line.type === 'test') {
                line.result.error = line.result.error?.replaceAll(/http:\/\/localhost:\d*\//gm, './')
            }
        }
        appTestUtils.pprint(result)
        console.groupEnd()
    },
    clearStdout() {
        process.stdout.write('\x1Bc')
    },
    /** @type {{[command: string]: (args: string) => Promise<void> | void}} */
    stdinDispatcher: {
        ['clear']: () => { console.clear(); consoleUtils.displayInput() }
    },
    initStdinInput() {
        process.stdin.on('data', async (entry) => {
            if (stdinBusy) return
            stdinBusy = true
            const line = entry.toString().slice(0, -1)
            const [command, args] = line.split(' ', 2)
            const callback = consoleUtils.stdinDispatcher[command]
            if (callback) await callback(args)
            else consoleUtils.displayInput()
            stdinBusy = false
        })
    },
    displayInput() {
        process.stdout.write('> ')
    },
    log(
        /** @type {string[]} */ ...args
    ) {
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        console.log(...args)
        consoleUtils.displayInput()
    }
}
