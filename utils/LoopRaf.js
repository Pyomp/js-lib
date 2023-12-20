const MAX_DT = 100

export class LoopRaf {
    dateNowMs = Date.now()
    dateNowSecond = this.dateNowMs / 1000
    perfNowMs = 0
    perfNowSecond = 0
    deltatimeMs = 10
    deltatimeSecond = 0.01

    #last = 0
    listeners = new Set()

    #rafUpdate = () => { }

    constructor() {
        requestAnimationFrame(this.#updateBound)
    }

    setUpdate(update) {
        this.#rafUpdate = update
    }

    #updateBound = this.#update.bind(this)
    #update(now) {
        this.dateNowMs = Date.now()
        this.dateNowSecond = this.dateNowMs / 1000
        this.perfNowMs = now
        this.perfNowSecond = now / 1000
        this.deltatimeMs = Math.min(this.perfNowMs - this.#last, MAX_DT)
        this.deltatimeSecond = this.deltatimeMs / 1000

        this.#last = this.perfNowMs

        this.#rafUpdate()

        requestAnimationFrame(this.#updateBound)
    }
}
