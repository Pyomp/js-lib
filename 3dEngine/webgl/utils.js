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
