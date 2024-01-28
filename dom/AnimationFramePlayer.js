export class AnimationFramePlayer {
    static MAX_DELTA_TIME_MS = 100

    dateNowMs = Date.now()
    dateNowSecond = this.dateNowMs / 1000
    performanceNowMs = 0
    performanceNowSecond = 0
    deltatimeMs = 10
    deltatimeSecond = 0.01

    #nextCallbackCallLimitSecond = 0
    #deltaTimeLimitSecond = 1 / 240
    set fpsLimit(value) {
        this.#deltaTimeLimitSecond = 1 / value
    }
    get fpsLimit() { return 1 / this.#deltaTimeLimitSecond }

    #last = 0
    #requestAnimationFrameId
    #animationFrameCallback

    constructor(animationFrameCallback) {
        this.#animationFrameCallback = animationFrameCallback
    }

    #triggerFrameBound = this.#triggerFrame.bind(this)
    #triggerFrame(now) {
        this.dateNowMs = Date.now()
        this.dateNowSecond = this.dateNowMs / 1000
        this.performanceNowMs = now
        this.performanceNowSecond = now / 1000


        if (this.#nextCallbackCallLimitSecond <= this.performanceNowSecond) {
            this.deltatimeMs = Math.min(this.performanceNowMs - this.#last, AnimationFramePlayer.MAX_DELTA_TIME_MS)
            this.deltatimeSecond = this.deltatimeMs / 1000
            this.#last = this.performanceNowMs

            this.#nextCallbackCallLimitSecond = this.performanceNowSecond + this.#deltaTimeLimitSecond
            this.#animationFrameCallback()
        }

        this.#requestAnimationFrameId = requestAnimationFrame(this.#triggerFrameBound)
    }

    play() {
        this.#last = performance.now()
        cancelAnimationFrame(this.#requestAnimationFrameId)
        requestAnimationFrame(this.#triggerFrameBound)
    }

    stop() {
        cancelAnimationFrame(this.#requestAnimationFrameId)
    }
}
