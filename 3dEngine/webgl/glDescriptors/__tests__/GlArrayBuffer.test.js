import { optimizeRanges } from "../GlArrayBuffer.js"

describe('optimizeRanges', () => {
    it('should return the few ranges possible', () => {
        const input = [[0, 32], [32, 99], [22, 44], [777, 999], [1000, 7777], [7777, 8888]]

        const output = optimizeRanges(input)

        expect(output).toEqual([[1000, 8888], [777, 999], [0, 99]])
    })
})

