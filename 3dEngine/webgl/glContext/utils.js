/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {WebGLBuffer} readTarget 
 * @param {WebGLBuffer} writeTarget 
 * @param {number} size 
 * @param {number} readOffset 
 * @param {number} writeOffset 
 */
export function copyBuffer(gl, readTarget, writeTarget, size, readOffset = 0, writeOffset = 0) {
    gl.bindBuffer(WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, readTarget)
    gl.bindBuffer(WebGL2RenderingContext.COPY_WRITE_BUFFER, writeTarget)
    gl.copyBufferSubData(WebGL2RenderingContext.TRANSFORM_FEEDBACK_BUFFER, WebGL2RenderingContext.COPY_WRITE_BUFFER, readOffset, writeOffset, size)
}

export function printBuffer(gl, buffer, target = WebGL2RenderingContext.ARRAY_BUFFER, count = 4) {
    const f = new Float32Array(count)
    gl.bindBuffer(target, buffer)
    gl.getBufferSubData(target, 0, f)
    gl.bindBuffer(target, null)
    console.log(...f)
}

export function checkFrameBufferStatus(/** @type {WebGL2RenderingContext} */ gl) {
    const result = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (result === WebGL2RenderingContext.FRAMEBUFFER_COMPLETE) {
        console.info(`The framebuffer is ready to display.`)
    } else if (result === WebGL2RenderingContext.FRAMEBUFFER_INCOMPLETE_ATTACHMENT) {
        console.warn('The attachment types are mismatched or not all framebuffer attachment points are framebuffer attachment complete.')
    } else if (result === WebGL2RenderingContext.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT) {
        console.warn('There is no attachment.')
    } else if (result === WebGL2RenderingContext.FRAMEBUFFER_INCOMPLETE_DIMENSIONS) {
        console.warn('Height and width of the attachment are not the same.')
    } else if (result === WebGL2RenderingContext.FRAMEBUFFER_UNSUPPORTED) {
        console.warn('The format of the attachment is not supported or if depth and stencil attachments are not the same renderbuffer.')
    } else if (result === WebGL2RenderingContext.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE) {
        console.warn('The values of gl.RENDERBUFFER_SAMPLES are different among attached renderbuffers, or are non-zero if the attached images are a mix of renderbuffers and textures.')
    }
}

/**
 * 
 * @param {WebGL2RenderingContext} gl 
 * @param {WebGLFramebuffer | null} src 
 * @param {WebGLFramebuffer | null} target 
 * @param {number} width 
 * @param {number} height 
 * @param {number} mask 
 * @param {number} filter 
 */
export function blit(gl, src, target, width, height, mask = WebGL2RenderingContext.DEPTH_BUFFER_BIT, filter = WebGL2RenderingContext.NEAREST) {
    gl.bindFramebuffer(WebGL2RenderingContext.READ_FRAMEBUFFER, src)
    gl.bindFramebuffer(WebGL2RenderingContext.DRAW_FRAMEBUFFER, target)
    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, mask, filter)
}

export const typedArrayToType = new Map()
typedArrayToType.set(Uint32Array, WebGL2RenderingContext.UNSIGNED_INT)
typedArrayToType.set(Uint16Array, WebGL2RenderingContext.UNSIGNED_SHORT)
typedArrayToType.set(Uint8Array, WebGL2RenderingContext.UNSIGNED_BYTE)
typedArrayToType.set(Uint8ClampedArray, WebGL2RenderingContext.UNSIGNED_BYTE)
typedArrayToType.set(Int8Array, WebGL2RenderingContext.BYTE)
typedArrayToType.set(Int16Array, WebGL2RenderingContext.SHORT)
typedArrayToType.set(Int32Array, WebGL2RenderingContext.INT)
