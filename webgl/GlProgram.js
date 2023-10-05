export class GlProgram {
    /** @type {WebGLProgram} */ program
    /** @type {{[uniformName: string]: (data: number | number[]) => void}} */ uniforms

    /** @type {WebGL2RenderingContext} */ #gl

    constructor(gl, vertexShader, fragmentShader) {
        const glVertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShader)
        const glFragmentShader = createShader(gl, gl.VERTEX_SHADER, fragmentShader)

        this.program = createProgram(gl, glVertexShader, glFragmentShader)

        gl.detachShader(this.program, glVertexShader)
        gl.deleteShader(glVertexShader)
        gl.detachShader(this.program, glFragmentShader)
        gl.deleteShader(glFragmentShader)

        this.#gl = gl

        this.uniforms = createUniformUpdates(gl, this.program)
    }

    useProgram() {
        this.#gl.useProgram(this.program)
    }

    dispose() {
        this.#gl.deleteProgram(this.program)
    }
}

/////////////////////// Program /////////////////////////////

/**
 * @param {WebGL2RenderingContext} gl 
 * @param {WebGLShader} vertexShader 
 * @param {WebGLShader} fragmentShader 
 */
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program
    } else {
        console.warn(gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
    }
}

/**
 * @param {WebGL2RenderingContext} gl 
 * @param {number} type 
 * @param {string} source 
 */
function createShader(gl, type, source) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader
    } else {
        console.warn(('\n' + source).split('\n').map((glslLine, lineNumber) => `${lineNumber} ${glslLine}`).join('\n'))
        const error = gl.getShaderInfoLog(shader)
        console.warn(error)
        gl.deleteShader(shader)
        throw error
    }
}

/////////////////////// Uniforms /////////////////////////////

const createUniformUpdateFunction = {
    [WebGL2RenderingContext.FLOAT]: (gl, location) => (data) => { gl.uniform1f(location, data) },
    [WebGL2RenderingContext.FLOAT_VEC2]: (gl, location) => (data) => { gl.uniform2fv(location, data) },
    [WebGL2RenderingContext.FLOAT_VEC3]: (gl, location) => (data) => { gl.uniform3fv(location, data) },
    [WebGL2RenderingContext.FLOAT_VEC4]: (gl, location) => (data) => { gl.uniform4fv(location, data) },
    [WebGL2RenderingContext.INT]: (gl, location) => (data) => { gl.uniform1i(location, data) },
    [WebGL2RenderingContext.INT_VEC2]: (gl, location) => (data) => { gl.uniform2iv(location, data) },
    [WebGL2RenderingContext.INT_VEC3]: (gl, location) => (data) => { gl.uniform3iv(location, data) },
    [WebGL2RenderingContext.INT_VEC4]: (gl, location) => (data) => { gl.uniform4iv(location, data) },
    [WebGL2RenderingContext.BOOL]: (gl, location) => (data) => { gl.uniform1i(location, data) },
    [WebGL2RenderingContext.BOOL_VEC2]: (gl, location) => (data) => { gl.uniform2iv(location, data) },
    [WebGL2RenderingContext.BOOL_VEC3]: (gl, location) => (data) => { gl.uniform3iv(location, data) },
    [WebGL2RenderingContext.BOOL_VEC4]: (gl, location) => (data) => { gl.uniform4iv(location, data) },
    [WebGL2RenderingContext.FLOAT_MAT2]: (gl, location) => (data) => { gl.uniformMatrix2fv(location, false, data) },
    [WebGL2RenderingContext.FLOAT_MAT3]: (gl, location) => (data) => { gl.uniformMatrix3fv(location, false, data) },
    [WebGL2RenderingContext.FLOAT_MAT4]: (gl, location) => (data) => { gl.uniformMatrix4fv(location, false, data) },
    [WebGL2RenderingContext.SAMPLER_2D]: (gl, location) => (unit) => { gl.uniform1i(location, unit) },
    [WebGL2RenderingContext.SAMPLER_CUBE]: (gl, location) => (unit) => { gl.uniform1i(location, unit) },
}

/**
    * 
    * @param {WebGL2RenderingContext} gl 
    * @param {WebGLProgram} program 
    */
export function createUniformUpdates(gl, program) {
    const activeUniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)

    /** @type {{[uniformName: string]: (data: number | number[]) => void}} */
    const uniforms = {}

    for (let i = 0; i < activeUniformCount; i++) {
        const { type, name } = gl.getActiveUniform(program, i)
        const location = gl.getUniformLocation(program, name)
        uniforms[name] = createUniformUpdateFunction[type](gl, location)
    }

    return uniforms
}
