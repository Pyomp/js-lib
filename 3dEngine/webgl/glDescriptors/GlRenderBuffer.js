export class GlRenderBuffer {
    needsDelete = false

    version = 0

    constructor(
        /**
         *  @type {{
         *  name?: string
         *  internalFormat?: WebGl.Texture.InternalFormat | number
         *  width?: GLsizei
         *  height?: GLsizei
         *  samples?: number
         * }} 
         */
        { internalFormat, width = 1, height = 1, samples = 1 }
    ) {
        this.internalFormat = internalFormat
        this.width = width
        this.height = height
        this.samples = samples
    }

    resize(
        /** @type {number} */ width,
        /** @type {number} */ height
    ) {
        this.width = width
        this.height = height
        this.version++
    }
}
