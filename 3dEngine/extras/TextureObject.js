import { Geometry } from "../sceneGraph/Geometry.js"
import { Material } from "../sceneGraph/MaterialOld.js"
import { Object3D } from "../sceneGraph/Object3D.js"

export class TextureObject extends Object3D {
    set count(/** @type {number} */ value) {
        this.geometry.count = value
    }
    /**
     * 
     * @param {Texture} texture 
     */
    constructor(texture) {
        super({
            drawMode: 'TRIANGLES',
            normalBlending: true,
            depthWrite: false,
            depthTest: false,
            geometry: new Geometry(6, {
                position: new Float32Array([
                    -1, -1,
                    1, -1,
                    -1, 1,
                    1, 1,
                ]),
                uv: new Float32Array([
                    0, 0,
                    1, 0,
                    0, 1,
                    1, 1,
                ]),
            }, new Uint16Array([0, 1, 2, 1, 3, 2])),
            material: new Material({
                vertexShader: () =>
                    `#version 300 es
                    precision highp float;
                
                    in vec2 position;
                    in vec2 uv;

                    out vec2 v_uv;

                    void main() {
                        v_uv = uv;
                        gl_Position = vec4(position, 0. ,1.);
                    }`,
                fragmentShader: () =>
                    `#version 300 es
                    precision highp float;
                    precision highp int;

                    in vec2 v_uv;

                    uniform sampler2D map;
                            

                    layout(std140) uniform windowUbo {
                        vec2 resolution;
                        vec2 mouse;
                    };

                    out vec4 outColor;
        
                    void main() {
                        float red = texture(map, v_uv).r;
                        float f = (0.01 * 2000.) / ((2000. - 0.01) * red - 2000.);
                        outColor = vec4(red, 0.,0., 1.);
                        outColor=texture(map, v_uv);
                        // outColor = vec4(gl_FragCoord.x/1000. ,0. ,0.,1.);
                    }`,
                textures: {
                    map: texture
                }
            })
        })
    }
}
