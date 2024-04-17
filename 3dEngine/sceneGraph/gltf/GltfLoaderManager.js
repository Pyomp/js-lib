import { loadGLTF } from "../../loaders/gltfLoader.js"
import { GlProgram } from "../../webgl/glDescriptors/GlProgram.js"
import { Node3D } from "../Node3D.js"
import { GltfNodeManager } from "./GltfNodeManager.js"

export class GltfNodeLoader {
    #url
    #nodeName
    #glProgramData
    #uniforms
    #animationDictionary

    /** @type {GltfNodeManager} */ #gltfNodeManager

    /**
     * 
     * @param {{
     *      gltfUrl: URL | string
     *      nodeName: string
     *      glProgramData?: GlProgram
     *      uniforms?: {[name: string]: WebGl.UniformData}
     *      animationDictionary?: {[gltfAnimationName: string]: string | number}
     * }} params
     */
    constructor({
        gltfUrl,
        nodeName,
        glProgramData = undefined,
        uniforms = {},
        animationDictionary = {}
    }) {
        this.#url = gltfUrl
        this.#nodeName = nodeName
        this.#glProgramData = glProgramData
        this.#uniforms = uniforms
        this.#animationDictionary = animationDictionary
    }

    isLoading = false
    disposed = false
    async load() {
        this.disposed = false
        if (this.isLoading) return
        this.isLoading = true
        const gltf = await loadGLTF(this.#url)
        this.isLoading = false
        if (this.disposed) return
        this.#gltfNodeManager = new GltfNodeManager({
            gltfNode: gltf[this.#nodeName],
            extraUniforms: this.#uniforms,
            animationDictionary: this.#animationDictionary,
            glProgramData: this.#glProgramData,
        })
    }

    free() {
        this.disposed = true
        this.#gltfNodeManager?.dispose()
        this.#gltfNodeManager = undefined
    }

    getNode() {
        if (!this.#gltfNodeManager) {
            this.load()
            return null
        }

        const node3D = this.#gltfNodeManager.getNode()

        return node3D
    }
}
