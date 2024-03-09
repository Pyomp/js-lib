export class TimerEvent {
    #last_s = Date.now() / 1000
    #last_m = this.#last_s / 60
    #last_h = this.#last_m / 60
    #last_d = this.#last_h / 24

    secondListeners = new Set()
    minuteListeners = new Set()
    hourListeners = new Set()
    dayListeners = new Set()

    update() {
        const now = Date.now() / 1000

        if (now - this.#last_s > 1) {
            this.#last_s = Math.floor(now)
            for (const cb of this.secondListeners) cb(this.#last_s % 60) === true

            const now_m = now / 60
            if (now_m - this.#last_m > 1) {
                this.#last_m = Math.floor(now_m)
                for (const cb of this.minuteListeners) cb(this.#last_m % 60)

                const now_h = now_m / 60
                if (now_h - this.#last_h > 1) {
                    this.#last_h = Math.floor(now_h)
                    for (const cb of this.hourListeners) cb(this.#last_h % 24)

                    const now_d = now_h / 24
                    if (now_d - this.#last_d > 1) {
                        this.#last_d = Math.floor(now_d)
                        for (const cb of this.dayListeners) cb((this.#last_d + 3) % 7)
                    }
                }
            }
        }
    }
}
