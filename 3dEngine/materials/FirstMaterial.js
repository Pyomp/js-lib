import { Vector3 } from "../../math/Vector3.js"
import { Material } from "../sceneGraph/Material.js"
import { Texture } from "../sceneGraph/Texture.js"
import { Uniform } from "../sceneGraph/Uniform.js"

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

export class FirstMaterial extends Material {
    constructor(projectionViewMatrix) {
        super({
            vertexShader:
                `#version 300 es
                in vec3 position;
                in vec3 normal;
                in vec2 uv;

                uniform mat4 projection;
                
                uniform mat4 modelView;

                out vec3 v_normal;
                out vec2 v_uv;

                void main() {
                    gl_Position = projection * modelView * vec4(position, 1.0);
                    v_normal = mat3(modelView) * normal;
                    v_uv = uv;
            }`,
            fragmentShader:
                `#version 300 es
                precision highp float;
            
                in vec3 v_normal;
                in vec2 v_uv;
            
                uniform sampler2D diffuse;
                uniform sampler2D decal;
            
                uniform vec3 lightDir;
            
                out vec4 outColor;
            
                void main() {
                    vec3 normal = normalize(v_normal);
                    float light = dot(normal, lightDir) * 0.5 + 0.5;
                    vec4 color = texture(diffuse, v_uv);
                    vec4 decalColor = texture(decal, v_uv);
                    decalColor.rgb *= decalColor.a;
                    color = color * (1.0 - decalColor.a) + decalColor; 
                    outColor = vec4(color.rgb * light, color.a);
                    // outColor = vec4(1.0, 0., 0., 1.0);
                }`,
            uniforms: {
                lightDir: new Uniform(new Vector3(1, 5, 8).normalize()),
                projection: new Uniform(projectionViewMatrix)
            },
            textures: {
                diffuse: new Texture({
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
                }),
                decal: new Texture({
                    internalformat: 'RGBA',
                    format: 'RGBA',
                    type: 'UNSIGNED_BYTE',
                    data: makeTextCanvas('F', 32, 32, 'red')
                })
            }
        })
    }
}