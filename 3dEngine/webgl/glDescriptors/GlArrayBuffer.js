


export function optimizeRanges(/** @type {[number, number][]} */ ranges) {
    const result = []

    while (ranges.length > 0) {
        /** @type {[number, number]} */
        // @ts-ignore
        const a = ranges.pop()

        let isMerged = false

        for (let i = 0; i < ranges.length; i++) {
            const b = ranges[i]

            if (a[0] <= b[1] && a[1] >= b[0]) {
                if (b[1] < a[1]) b[1] = a[1]
                if (b[0] > a[0]) b[0] = a[0]
                isMerged = true
                break
            }
        }

        if (!isMerged) result.push(a)
    }

    return result
}

export class GlArrayBuffer {
    version = -1
    // startToUpdate = Infinity
    // endToUpdate = 0

    /** @type {[number, number][]} */ updateRanges = []

    setNeedsUpdate(
        /** @type {number} */ start,
        /** @type {number} */ end
    ) {
        this.updateRanges.push([start, end])
        this.version++
    }

    needsDelete = false

    /**
     * 
     * @param {WebGl.Attribute.data} arrayBuffer
     * @param {WebGl.Attribute.usage | number} usage
     */
    constructor(
        arrayBuffer,
        usage = 'STATIC_DRAW'
    ) {
        this.arrayBuffer = arrayBuffer
        this.usage = WebGL2RenderingContext[usage] ?? usage
    }
}
