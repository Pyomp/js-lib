const MAX_DT = 100

let dateNowMs = Date.now()
let dateNowSecond = dateNowMs / 1000
let perfNowMs = 0
let perfNowSecond = 0
let deltatimeMs = 10
let deltatimeSecond = 0.01

let last = 0

/** @type {Set<()=>void>}} */
const updates = new Set()

function tick(now) {
    dateNowMs = Date.now()
    dateNowSecond = dateNowMs / 1000
    perfNowMs = now
    perfNowSecond = now / 1000
    deltatimeMs = Math.min(perfNowMs - last, MAX_DT)
    deltatimeSecond = deltatimeMs / 1000

    last = perfNowMs

    for (const update of updates) update()

    requestAnimationFrame(tick)
}

requestAnimationFrame(tick)

export const loopRaf = Object.freeze({
    get dateNowMs() { return dateNowMs },
    get dateNowSecond() { return dateNowSecond },
    get perfNowMs() { return perfNowMs },
    get perfNowSecond() { return perfNowSecond },
    get deltatimeMs() { return deltatimeMs },
    get deltatimeSecond() { return deltatimeSecond },
    updates
})
