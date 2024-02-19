import { GLSL_CAMERA } from "../../programs/chunks/glslCamera.js"
import { GLSL_POINT_LIGHT } from "../../programs/chunks/glslPointLight.js"
import { createSparkleCanvas } from "../../textures/sparkle.js"
import { GlObject } from "../../webgl/glDescriptors/GlObject.js"
import { GlProgram } from "../../webgl/glDescriptors/GlProgram.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"
import { GlRenderer } from "../../webgl/glRenderer/GlRenderer.js"

export class LightParticleProgram extends GlProgram {
    /**
     * @param {GlRenderer} renderer 
     */
    constructor(renderer) {
        super(
            () => {
                return `#version 300 es
precision highp float;
${GLSL_CAMERA.declaration}
${GLSL_POINT_LIGHT.declaration(renderer.pointLightCount)}

out vec4 v_color;

void main() {
    PointLight pointLight = ${GLSL_POINT_LIGHT.pointLights}[gl_VertexID];
    
    gl_Position = ${GLSL_CAMERA.projectionViewMatrix} * vec4(pointLight.${GLSL_POINT_LIGHT.position}, 1.0);
    gl_PointSize = 300. / gl_Position.z;
    v_color = vec4(pointLight.${GLSL_POINT_LIGHT.color}, pointLight.${GLSL_POINT_LIGHT.intensity});
}`
            },
            () => {
                return `#version 300 es
precision highp float;

uniform sampler2D map;

in vec4 v_color;

out vec4 outColor;

void main() {
    outColor = texture(map, gl_PointCoord.xy) * v_color;
}`
            }
        )
    }
}

export class LightParticleObject extends GlObject {
    get count() { return this.#renderer.pointLightCount }
    set count(value) { }

    #renderer
    constructor(
        /** @type {GlRenderer} */ renderer,
    ) {
        super({
            drawMode: 'POINTS',
            additiveBlending: true,
            depthWrite: false,
            count: 0,
            glProgram: new LightParticleProgram(renderer),
            uniforms: {
                map: new GlTexture({ data: createSparkleCanvas() })
            }
        })
        this.#renderer = renderer
    }
}
