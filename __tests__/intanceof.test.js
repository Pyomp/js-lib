class A {
    isA = true
}


describe('performance test of instanceof', () => {
    const length = 10e6
 

    test('instanceof', () => {
        const a = new A()
        let result = true

        const t0 = performance.now()

        for (let i = 0; i < length; i++) {
            result = a instanceof A
        }

        const t1 = performance.now()

        console.log(`intanceof performance: ${t1 - t0}`)
    })

   

    test('isA', () => {
        const a = new A()
        let result = true

        const t0 = performance.now()

        for (let i = 0; i < length; i++) {
            result = a.isA
        }

        const t1 = performance.now()

        console.log(`intanceof performance: ${t1 - t0}`)
    })
    
    test('constructor', () => {
        const a = new A()
        let result = true

        const t0 = performance.now()

        for (let i = 0; i < length; i++) {
            result = a.constructor === A
        }

        const t1 = performance.now()

        console.log(`intanceof performance: ${t1 - t0}`)
    })
    
    test('in', () => {
        const a = new A()
        let result = true
        const isA = 'isA'

        const t0 = performance.now()

        for (let i = 0; i < length; i++) {
            result = isA in a
        }

        const t1 = performance.now()
                        
        console.log(`intanceof performance: ${t1 - t0}`)
    })

    test('hasOwnProperty', () => {
        const a = new A()
        let result = true
        const isA = 'isA'

        const t0 = performance.now()

        for (let i = 0; i < length; i++) {
            result = a.hasOwnProperty('isA')
        }

        const t1 = performance.now()
                        
        console.log(`intanceof performance: ${t1 - t0}`)
    })
})
