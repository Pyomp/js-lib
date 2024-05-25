/**
 * @template T
 */
export class AssetLoader {
    ready = false
    disposed = false
    isLoading = false

    loader
    construct

    /**
     * @param {(...any)=>Promise<T> | T} loader 
     * @param {(loadResult: T)=> void} construct 
     * @param {()=> void} unload
     */
    constructor(loader, construct, unload) {
        this.loader = loader
        this.construct = construct
        this.unloader = unload
    }

    async load(...args) {
        this.disposed = false
        if (this.isLoading || this.ready) return
        this.isLoading = true

        const loadResult = await this.loader(...args)

        this.isLoading = false
        if (this.disposed) return

        this.construct(loadResult)

        this.ready = true
    }

    unload(){
        this.disposed = true
        this.ready = false
        
        this.unloader()
    }
}
