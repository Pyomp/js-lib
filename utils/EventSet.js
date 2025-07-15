/**
 * @template {Function} T
 * @extends {Set<T>}
*/
export class EventSet extends Set {
    emit(
        /** @type {Parameters<T>} */ ...data
    ) {
        for (const cb of this) cb(...data)
    }

    addOnce(
        /** @type {T} */ callback
    ) {
        const wrap = (
            /** @type {Parameters<T>} */ ...data
        ) => {
            callback(...data)
            this.delete(wrap)
        }
        this.add(wrap)
    }

    addUntilTrue(
        /** @type {T} */ callback
    ) {
        const wrap = (
              /** @type {Parameters<T>} */ ...data
        ) => {
            if (callback(...data) === true) this.delete(wrap)
        }
        this.add(wrap)
    }

    addImmediate(
        /** @type {T} */ callback
    ) {
        callback()
        this.add(callback)
    }
}

/**
 * @template T
*/
export class EventValue {
    /** @type {T} */ #value
    onChange = new EventSet()
    get value() { return this.#value }
    set value(v) { if (this.#value !== v) { this.#value = v; this.onChange.emit() } }

    constructor(
        /** @type {T} */ value
    ) {
        this.#value = value
        this.value = value
    }
}
