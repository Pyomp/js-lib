/**
 * @template T
*/
export class AbortablePromise {
    #abortController = new AbortController()

    constructor(
        /** 
         * @type {(
         *      resolve: (value?: T) => void, 
         *      reject: (reason?: any) => void, 
         *      signal: AbortSignal
         * ) => Promise<any> | any} 
         */ callback,
        /** @type {number | undefined} */ timeout = undefined
    ) {
        const timeoutId =
            timeout !== undefined ?
                setTimeout(() => { this.abort() }, timeout)
                :
                undefined

        /** @type {Promise<T | undefined>} */
        this.promise = new Promise(async (resolve, reject) => {
            callback(resolve, reject, this.#abortController.signal)
        })

        this.promise.finally(() => { clearTimeout(timeoutId) })
    }

    abort() {
        this.#abortController.abort()
    }
}
