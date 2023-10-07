import { GlProgram } from "../../webgl/GlProgram.js"
import { GlTexture } from "../../webgl/GlTexture.js"
import { Node3D } from "../../webgl/engine/Node3D.js"
import { Matrix4 } from "../Matrix4.js"

const makeTextCanvas = (text, width, height, color) => {
    const ctx = document.createElement('canvas').getContext('2d')
    ctx.canvas.width = width
    ctx.canvas.height = height
    ctx.font = `bold ${height * 5 / 6 | 0}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color
    ctx.fillText(text, width / 2, height / 2)
    return ctx.canvas
}

export class Cubes {
    #gl

    constructor(gl){
        this.init(gl)
    }

    init(gl) {
        this.#gl = gl
        this.glProgram = new GlProgram(
            gl,
            `#version 300 es
            in vec3 position;
            in vec3 normal;
            in vec2 texcoord;
        
            uniform mat4 projection;
            uniform mat4 modelView;
        
            out vec3 v_normal;
            out vec2 v_texcoord;
        
            void main() {
                gl_Position = projection * modelView * vec4(position, 1.0);
                v_normal = mat3(modelView) * normal;
                v_texcoord = texcoord;
            }`,
            `#version 300 es
            precision highp float;
        
            in vec3 v_normal;
            in vec2 v_texcoord;
        
            uniform sampler2D diffuse;
            uniform sampler2D decal;
        
            uniform vec3 lightDir;
        
            out vec4 outColor;
        
            void main() {
                vec3 normal = normalize(v_normal);
                float light = dot(normal, lightDir) * 0.5 + 0.5;
                vec4 color = texture(diffuse, v_texcoord);
                vec4 decalColor = texture(decal, v_texcoord);
                decalColor.rgb *= decalColor.a;
                color = color * (1.0 - decalColor.a) + decalColor; 
                outColor = vec4(color.rgb * light, color.a);
                // outColor = vec4(1.0, 0., 0., 1.0);
            }`
        )

        const cubeVertexPositions = new Float32Array([
            1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1,
        ])
        const cubeVertexNormals = new Float32Array([
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        ])
        const cubeVertexUV = new Float32Array([
            1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
        ])
        const cubeVertexIndices = new Uint16Array([
            0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
        ])

        this.vao = this.glProgram.createVao(
            {
                position: { data: cubeVertexPositions, usage: 'STATIC_DRAW' },
                normal: { data: cubeVertexNormals },
                texcoord: { data: cubeVertexUV }
            },
            cubeVertexIndices
        )

        this.checkerTexture = new GlTexture({
            gl,
            minFilter: 'NEAREST',
            magFilter: 'NEAREST',
            internalformat: 'LUMINANCE',
            format: 'LUMINANCE',
            type: 'UNSIGNED_BYTE',
            width: 4,
            height: 4,
            data: new Uint8Array([
                192, 128, 192, 128,
                128, 192, 128, 192,
                192, 128, 192, 128,
                128, 192, 128, 192,
            ])
        })

        this.decalTexture = new GlTexture({
            gl,
            internalformat: 'RGBA',
            format: 'RGBA',
            type: 'UNSIGNED_BYTE',
            data: makeTextCanvas('F', 32, 32, 'red')
        })
    }

    #cubes = new Set()

    addCube(parent, color) {
        const cube = new Cube(color)
        this.#cubes.add(cube)
        return cube
    }

    deleteCube(cube) {
        this.#cubes.delete(cube)
    }

    draw() {
        this.glProgram.useProgram()
        this.vao.bind()
        this.checkerTexture.bindToUnit(this.glProgram.textureUnit['diffuse'])
        this.decalTexture.bindToUnit(this.glProgram.textureUnit['decal'])
        this.glProgram.uniformUpdate['lightDir'](lightDir)
        this.glProgram.uniformUpdate['projection'](camera.projectionViewMatrix)

        for (const cube of this.#cubes) {
            this.glProgram.uniformUpdate['modelView'](cube.worldMatrix)
            this.#gl.drawElements(
                WebGL2RenderingContext.TRIANGLES,
                36,
                WebGL2RenderingContext.UNSIGNED_SHORT,
                0,
            )
        }

    }
}

class Cube extends Node3D {
    constructor(parent, color) {
        super(parent)
        this.color = color
    }
}
