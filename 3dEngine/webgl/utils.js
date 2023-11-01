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
    gl.bindBuffer(WebGL2RenderingContext.COPY_READ_BUFFER, readTarget)
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, writeTarget)
    gl.copyBufferSubData(WebGL2RenderingContext.COPY_READ_BUFFER, WebGL2RenderingContext.ARRAY_BUFFER, readOffset, writeOffset, size)
}

export function printBuffer(gl, buffer, count = 4) {
    const f = new Float32Array(count)
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, buffer)
    gl.getBufferSubData(WebGL2RenderingContext.ARRAY_BUFFER, 0, f)
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
