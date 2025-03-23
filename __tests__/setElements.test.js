function setElements(te, me) {
    te.set(me)
}

function setElementsMano(te, me) {
    te[0] = me[0]; te[1] = me[1]; te[2] = me[2]; te[3] = me[3]
    te[4] = me[4]; te[5] = me[5]; te[6] = me[6]; te[7] = me[7]
    te[8] = me[8]; te[9] = me[9]; te[10] = me[10]; te[11] = me[11]
    te[12] = me[12]; te[13] = me[13]; te[14] = me[14]; te[15] = me[15]
}

describe('performance test of instanceof', () => {
    const length = 10e6

    test('set', () => {
        const te = new Float32Array(16)
        const me = new Float32Array(16)

        const t0 = performance.now()

        for (let i = 0; i < length; i++) {
            te[0] = me[0]; te[1] = me[1]; te[2] = me[2]; te[3] = me[3]
            te[4] = me[4]; te[5] = me[5]; te[6] = me[6]; te[7] = me[7]
            te[8] = me[8]; te[9] = me[9]; te[10] = me[10]; te[11] = me[11]
            te[12] = me[12]; te[13] = me[13]; te[14] = me[14]; te[15] = me[15]
        }

        const t1 = performance.now()

        console.log(`performance: ${t1 - t0}`)
    })

    test('set for', () => {
        const te = new Float32Array(16)
        const me = new Float32Array(16)

        const t0 = performance.now()

        for (let i = 0; i < length; i++) {
            for (let i = 0; i < 16; i++) {

                te[i] = me[i]

            }

        }

        const t1 = performance.now()

        console.log(`performance: ${t1 - t0}`)
    })


    test('set', () => {
        const a = new Float32Array(16)
        const b = new Float32Array(16)

        const t0 = performance.now()

        for (let i = 0; i < length; i++) {
            a.set(b)
        }

        const t1 = performance.now()

        console.log(`performance: ${t1 - t0}`)
    })
})
