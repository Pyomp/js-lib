let dateNowMs = Date.now()
let dateNowSecond = dateNowMs / 1000
let perfNowMs = 0
let perfNowSecond = 0
let deltatimeMs = 10
let deltatimeSecond = 0.01

const MAX_DT = 100
let last = 0

const listeners = new Set()

function update(now) {
    dateNowMs = Date.now()
    dateNowSecond = dateNowMs / 1000
    perfNowMs = now
    perfNowSecond = now / 1000
    deltatimeMs = Math.min(perfNowMs - last, MAX_DT)
    deltatimeSecond = deltatimeMs / 1000

    last = perfNowMs

    for (const cb of listeners) cb()

    requestAnimationFrame(update)
}

requestAnimationFrame(update)

export const loopRaf = {
    get dateNowMs() { return dateNowMs },
    get dateNowSecond() { return dateNowSecond },
    get perfNowMs() { return perfNowMs },
    get perfNowSecond() { return perfNowSecond },
    get deltatimeSecond() { return deltatimeSecond },
    listeners,
}
