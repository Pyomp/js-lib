import { Attribute } from "../../sceneGraph/Attribute.js"
import { GlProgram } from "../../webgl/glContext/GlProgram.js"
import { GlTexture } from "../../webgl/glContext/GlTexture.js"
import { GlVao } from "../../webgl/glContext/GlVao.js"

export class SkyBoxRenderer {
    /** @type {HTMLImageElement[] | undefined} */ images
    /** @type {GlTexture} */ #glTexture
    isInitialized = false

    /** @type {WebGL2RenderingContext} */ #gl
    /** @type {{[uboName: string]: number}} */ #uboIndex

    initGl(gl, uboIndex) {
        this.#gl = gl
        this.#uboIndex = uboIndex
    }

    /** @type {GlProgram} */ #glProgram
    /** @type {GlVao} */ #glVao
    render() {
        if (!this.images) {
            if (this.isInitialized) this.dispose()
            return
        }
        if (!this.isInitialized) {
            this.isInitialized = true
            this.#glProgram = new GlProgram(this.#gl,
                `#version 300 es

in vec2 position;
out vec4 v_position;
void main() {
    v_position = vec4(position, 1.0, 1.0);
    gl_Position = v_position;
}`,

                `#version 300 es
precision highp float;

uniform samplerCube skyBox;
layout(std140) uniform cameraUbo {
    mat4 viewMatrix;
    mat4 projectionMatrix;
    mat4 projectionViewMatrix;
    mat4 projectionViewMatrixInverse;
    vec3 cameraPosition;
    float near;
    float far;
};

in vec4 v_position;

out vec4 outColor;

void main() {
    vec4 t = projectionViewMatrixInverse * v_position;
    outColor = texture(skyBox, normalize(t.xyz / t.w));
}`,
                { uboIndex: this.#uboIndex }
            )
            this.#glVao = new GlVao(this.#gl, this.#glProgram.program, {
                position: new Attribute(new Float32Array([
                    -1, -1,
                    1, -1,
                    -1, 1,
                    -1, 1,
                    1, -1,
                    1, 1
                ]))
            })
            this.#glTexture = new GlTexture({ gl: this.#gl, data: this.images })
        }

        this.#glProgram.useProgram()
        this.#glVao.bind()
        this.#glTexture.bindToUnit(this.#glProgram.textureUnit['skyBox'])

        this.#gl.depthFunc(WebGL2RenderingContext.LEQUAL)
        this.#gl.drawArrays(WebGL2RenderingContext.TRIANGLES, 0, 6)
    }

    dispose() {
        this.#glProgram?.dispose()
        this.#glVao?.dispose()
        this.#glTexture?.dispose()
        this.isInitialized = false
    }
}
