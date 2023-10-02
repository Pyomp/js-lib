let last_s = Date.now() / 1000
let last_m = last_s / 60
let last_h = last_m / 60
let last_d = last_h / 24

setInterval(update, 1000)

const secondListeners = new Set()
const minuteListeners = new Set()
const hourListeners = new Set()
const dayListeners = new Set()

export const timer = {
    secondListeners,
    minuteListeners,
    hourListeners,
    dayListeners,
}

function update() {
    const now = Date.now() / 1000

    if (now - last_s > 1) {
        last_s = Math.floor(now)
        for (const cb of secondListeners) cb(last_s % 60) === true

        const now_m = now / 60
        if (now_m - last_m > 1) {
            last_m = Math.floor(now_m)
            for (const cb of minuteListeners) cb(last_m % 60)

            const now_h = now_m / 60
            if (now_h - last_h > 1) {
                last_h = Math.floor(now_h)
                for (const cb of hourListeners) cb(last_h % 24)

                const now_d = now_h / 24
                if (now_d - last_d > 1) {
                    last_d = Math.floor(now_d)
                    for (const cb of dayListeners) cb((last_d + 3) % 7)
                }
            }
        }
    }
}
