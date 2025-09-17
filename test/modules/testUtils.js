import fakeTimer from "./fakeTimer.js"

export const testUtils = {
    mock(
        /** @type {{[key: string]: any}} */ object
    ) {
        for (const key in object) {
            if (typeof object[key] === 'function') {
                try {
                    const initialFunction = object[key].bind(object)
                    object[key] = function (/** @type {any[]} */ ...args) {
                        object[key].callArgs.push(structuredClone(args))

                        initialFunction(...args)
                    }
                    object[key].callArgs = []
                    Object.defineProperty(object[key], 'callCount', {
                        get() { return object[key].callArgs.length }
                    })
                } catch (error) {
                    console.warn(error)
                }
            }
        }
        return object
    },
    fakeTimer,
}
