import { GlRenderBuffer } from "../glDescriptors/GlRenderBuffer.js"
import { GlContextRenderer } from "./GlContextRenderer.js"

export class GlRenderBufferRenderer {
    #gl
    #descriptor
    #glRenderBuffer
    #version = -1

    constructor(
        /** @type {GlContextRenderer} */ glContext,
        /** @type {GlRenderBuffer} */ descriptor
    ) {
        this.#gl = glContext.gl
        this.#descriptor = descriptor

        this.#glRenderBuffer = this.#gl.createRenderbuffer()
        this.#update()
    }

    #update() {
        if (this.#descriptor.version !== this.#version) {
            const gl = this.#gl
            const { samples, internalFormat, width, height, version } = this.#descriptor
            this.#version = version

            gl.bindRenderbuffer(gl.RENDERBUFFER, this.#glRenderBuffer)

            if (samples > 1) {
                gl.renderbufferStorageMultisample(
                    gl.RENDERBUFFER,
                    samples,
                    WebGL2RenderingContext[internalFormat] ?? internalFormat,
                    width, height
                )
            } else {
                gl.renderbufferStorage(
                    gl.RENDERBUFFER,
                    WebGL2RenderingContext[internalFormat] ?? internalFormat,
                    width, height
                )
            }
        }
    }


    attachToBoundFrameBuffer(
        /** @type {number} */ attachment
    ) {
        this.#update()
        this.#gl.framebufferRenderbuffer(
            WebGL2RenderingContext.FRAMEBUFFER,
            attachment,
            WebGL2RenderingContext.RENDERBUFFER,
            this.#glRenderBuffer
        )
    }

    dispose() {
        this.#gl.deleteRenderbuffer(this.#glRenderBuffer)
    }
}
