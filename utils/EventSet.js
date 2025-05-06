export class EventSet extends Set {
    emit(
        /** @type {any[]} */ ...data
    ) {
        for (const cb of this) cb(...data)
    }

    addOnce(
        /** @type {Function} */ callback
    ) {
        const wrap = () => {
            callback()
            this.delete(wrap)
        }
        this.add(wrap)
    }

    addUntilTrue(
        /** @type {Function} */ callback
    ) {
        const wrap = () => {
            if (callback() === true) this.delete(wrap)
        }
        this.add(wrap)
    }

    addImmediate(
        /** @type {Function} */ callback
    ) {
        callback()
        this.add(callback)
    }
}
