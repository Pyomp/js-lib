import { appTestUtils } from "./appTestUtils.js"
import { Expect, getValuableStack } from "../modules/Expect.js"


function runTest(test) {
    return new Promise(
        async (resolve) => {
            /** @type {TestConfig} */
            const config = await (await fetch('/test.config.json')).json()

            let iframeConsole = ''

            console.log = (...args) => { iframeConsole += 'console.log\n' + args.toString() }
            console.error = (...args) => { iframeConsole += 'console.error\n' + args.toString() }
            console.warn = (...args) => { iframeConsole += 'console.warn\n' + args.toString() }

            const timeout = setTimeout(() => {
                resolve({ success: false, error: new Error('timeout'), time: performance.now() - t0, console: iframeConsole })
            }, config.maxUnitTestDuration)

            const t0 = performance.now()

            try {
                await test()
                resolve({ success: true, time: performance.now() - t0, console: iframeConsole })
            } catch (error) {
                if (error instanceof Error) {
                    error.stack = getValuableStack(error.stack)
                }
                resolve({ success: false, error: error.stack ?? error.toString(), time: performance.now() - t0, console: iframeConsole })
            } finally {
                clearTimeout(timeout)
            }
        })
}

function init() {
    localStorage.clear()
    sessionStorage.clear()

    window.expect = (value) => {
        return new Expect(value).execute()
    }

    // @ts-ignore
    window._runTest = async (testUrl, testIndex) => {
        const tests = await appTestUtils.getTestCallbacks(testUrl)
        return runTest(tests[testIndex])
    }
}

init()
