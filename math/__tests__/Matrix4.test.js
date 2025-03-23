import { Matrix4 } from "../Matrix4.js"

describe('performance tests', () => {
    test('Matrix4 JS test', () => {
        const matrices = []
        const matrixResult = new Matrix4()
        for (let i = 0; i < 1000; i++) {
            matrices.push(new Matrix4())
        }

        const t0 = performance.now()

        for (let i = 0; i < 1000; i++) {
            for (let j = 0; j < 1000; j++) {
                matrixResult.premultiply(matrices[i])

            }
        }

        const t1 = performance.now()

        console.log(`Time multiplying matrices: ${t1 - t0}`)
    })

    test('DOMMatrix test', () => {
        const matrices = []
        const matrixResult = new DOMMatrix()
        for (let i = 0; i < 1000; i++) {
            matrices.push(new DOMMatrix())
        }

        const t0 = performance.now()

        for (let i = 0; i < 1000; i++) {
            for (let j = 0; j < 1000; j++) {
                matrixResult.preMultiplySelf(matrices[i])
            }
        }

        const t1 = performance.now()

        console.log(`Time multiplying matrices: ${t1 - t0}`)
    })
})
