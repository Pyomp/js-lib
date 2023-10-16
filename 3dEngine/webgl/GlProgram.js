import { Attribute } from "../sceneGraph/Attribute.js"
import { GlUbo } from "./GlUbo.js"
import { GlVao } from "./GlVao.js"

export class GlProgram {
    /** @type {{[uniformName: string]: ((data: number | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4) => void)}} */
    uniformUpdate = {}
    /** @type {{[textureName: string]: number}} */
    textureUnit = {}

    /** @type {WebGL2RenderingContext} */
    #gl
    /** @type {WebGLProgram} */
    #program

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {string} vertexShader 
     * @param {string} fragmentShader 
     * @param {{[UboName: string]: number}} uboIndex
     */
    constructor(gl, vertexShader, fragmentShader, uboIndex = {}) {
        this.#gl = gl

        const glVertexShader = createShader(gl, WebGL2RenderingContext.VERTEX_SHADER, vertexShader)
        const glFragmentShader = createShader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, fragmentShader)

        const program = createProgram(gl, glVertexShader, glFragmentShader)
        this.#program = program
        gl.detachShader(program, glVertexShader)
        gl.deleteShader(glVertexShader)
        gl.detachShader(program, glFragmentShader)
        gl.deleteShader(glFragmentShader)

        { // uniforms setup
            gl.useProgram(program)

            const activeUboCount = gl.getProgramParameter(program, WebGL2RenderingContext.ACTIVE_UNIFORM_BLOCKS)

            const uniformIndexFromUbo = []

            for (let i = 0; i < activeUboCount; i++) {
                const name = gl.getActiveUniformBlockName(program, i)
                if (uboIndex[name] !== undefined) {
                    gl.uniformBlockBinding(program, i, uboIndex[name])
                    uniformIndexFromUbo.push(...gl.getActiveUniformBlockParameter(program, i, WebGL2RenderingContext.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES))
                }
            }

            const activeUniformCount = gl.getProgramParameter(program, WebGL2RenderingContext.ACTIVE_UNIFORMS)

            let unit = 0

            for (let i = 0; i < activeUniformCount; i++) {
                if (uniformIndexFromUbo.includes(i)) continue

                const { type, name } = gl.getActiveUniform(program, i)
                if (type === WebGL2RenderingContext.SAMPLER_2D || type === WebGL2RenderingContext.SAMPLER_CUBE) {
                    gl.uniform1i(gl.getUniformLocation(program, name), unit)
                    this.textureUnit[name] = WebGL2RenderingContext[`TEXTURE${unit}`]
                    unit++
                } else {
                    this.uniformUpdate[name] = createUniformUpdateFunction[type](gl, gl.getUniformLocation(program, name))
                }
            }
        }
    }

    /**
     * 
     * @param {{[attributeName: string]: Attribute}} attributes 
     * @param {Uint16Array} indices 
     * @returns 
     */
    createVao(attributes, indices) {
        return new GlVao(this.#gl, this.#program, attributes, indices)
    }

    useProgram() {
        this.#gl.useProgram(this.#program)
    }

    dispose() {
        this.#gl.deleteProgram(this.#program)
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

const createUniformUpdateFunction = {
    [WebGL2RenderingContext.FLOAT]: (gl, location) => (data) => { gl.uniform1f(location, data) },
    [WebGL2RenderingContext.FLOAT_VEC2]: (gl, location) => (vector2) => { gl.uniform2f(location, vector2.x, vector2.y) },
    [WebGL2RenderingContext.FLOAT_VEC3]: (gl, location) => (vector3) => { gl.uniform3f(location, vector3.x, vector3.y, vector3.z) },
    [WebGL2RenderingContext.FLOAT_VEC4]: (gl, location) => (vector4) => { gl.uniform4f(location, vector4.x, vector4.y, vector4.z, vector4.w) },
    [WebGL2RenderingContext.INT]: (gl, location) => (data) => { gl.uniform1i(location, data) },
    [WebGL2RenderingContext.INT_VEC2]: (gl, location) => (vector2) => { gl.uniform2i(location, vector2.x, vector2.y) },
    [WebGL2RenderingContext.INT_VEC3]: (gl, location) => (vector3) => { gl.uniform3i(location, vector3.x, vector3.y, vector3.z) },
    [WebGL2RenderingContext.INT_VEC4]: (gl, location) => (vector4) => { gl.uniform4i(location, vector4.x, vector4.y, vector4.z, vector4.w) },
    [WebGL2RenderingContext.BOOL]: (gl, location) => (data) => { gl.uniform1i(location, data) },
    [WebGL2RenderingContext.BOOL_VEC2]: (gl, location) => (data) => { gl.uniform2iv(location, data) },
    [WebGL2RenderingContext.BOOL_VEC3]: (gl, location) => (data) => { gl.uniform3iv(location, data) },
    [WebGL2RenderingContext.BOOL_VEC4]: (gl, location) => (data) => { gl.uniform4iv(location, data) },
    [WebGL2RenderingContext.FLOAT_MAT2]: (gl, location) => (data) => { gl.uniformMatrix2fv(location, false, data) },
    [WebGL2RenderingContext.FLOAT_MAT3]: (gl, location) => (data) => { gl.uniformMatrix3fv(location, false, data.elements) },
    [WebGL2RenderingContext.FLOAT_MAT4]: (gl, location) => (data) => { gl.uniformMatrix4fv(location, false, data.elements) },
}

/** I keep it there for information, it is when data is an array (not a vector3 from math lib)*/
const createUniformUpdateFunctionByArray = {
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
}
