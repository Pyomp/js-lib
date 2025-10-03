/**
 * @template T
*/
export class AssetManager {

    /** @type {T | undefined} */
    #cache

    #isLoading = false

    /** @type {()=>Promise<T>} */
    #loadFunction

    /** @type {boolean} */
    #disposed = false

    constructor(
        /** @type {()=>Promise<T>} */ load
    ) {
        this.#loadFunction = load
    }

    async load() {
        if (this.#isLoading === false) {
            this.#isLoading = true
            this.#disposed = false

            const asset = await this.#loadFunction()

            if (this.#disposed === false) {
                this.#cache = asset
            }

            this.#isLoading = false
        }
    }

    /** @return {T | undefined} */
    getAsset() {
        if (this.#cache === undefined) {
            this.load()
        }

        return this.#cache
    }

    dispose() {
        this.#disposed = true
        this.#cache = undefined
    }
}
