import { Vector2 } from "../../../math/Vector2.js"
import { GlArrayBuffer } from "../../webgl/glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../../webgl/glDescriptors/GlAttribute.js"
import { GlTexture } from "../../webgl/glDescriptors/GlTexture.js"

const splattingTexture = 'splattingTexture'
const textureColor1 = 'splattingColorTexture1'
const textureNormal1 = 'splattingNormalTexture1'
const textureScale1 = 'textureScale1'
const textureColor2 = 'splattingColorTexture2'
const textureNormal2 = 'splattingNormalTexture2'
const textureScale2 = 'textureScale2'
const textureColor3 = 'splattingColorTexture3'
const textureNormal3 = 'splattingNormalTexture3'
const textureScale3 = 'textureScale3'
const textureColor4 = 'splattingColorTexture4'
const textureNormal4 = 'splattingNormalTexture4'
const textureScale4 = 'textureScale4'

const declaration = `
uniform sampler2D ${splattingTexture};

uniform sampler2D ${textureColor1};
uniform sampler2D ${textureNormal1};
uniform vec2 ${textureScale1};

uniform sampler2D ${textureColor2};
uniform sampler2D ${textureNormal2};
uniform vec2 ${textureScale2};

uniform sampler2D ${textureColor3};
uniform sampler2D ${textureNormal3};
uniform vec2 ${textureScale3};  

uniform sampler2D ${textureColor4};
uniform sampler2D ${textureNormal4};
uniform vec2 ${textureScale4};

vec4 getSplatting(vec2 uv){
    vec4 splatting = texture(${splattingTexture}, uv);
    splatting.a = 1. - splatting.a;
    return normalize(splatting);
    
}

vec4 getSplattingColor(vec2 uv, vec4 splatting){
    return texture(${textureColor1}, uv * ${textureScale1}) * splatting.r + 
            texture(${textureColor2}, uv * ${textureScale2}) * splatting.g + 
            texture(${textureColor3}, uv * ${textureScale3}) * splatting.b + 
            texture(${textureColor4}, uv * ${textureScale4}) * splatting.a;
}

vec3 getSplattingNormal(vec3 inNormal, vec3 viewTangent, vec3 viewBitangent, vec2 uv, vec4 splatting){
    vec3 normal = normalize(inNormal);

    mat3 tbn = mat3( normalize( viewTangent ), normalize( viewBitangent ), normal );

    vec3 normalMap = texture(${textureNormal1}, uv * ${textureScale1}).xyz * splatting.r + 
                    texture(${textureNormal2}, uv * ${textureScale2}).xyz * splatting.g + 
                    texture(${textureNormal3}, uv * ${textureScale3}).xyz * splatting.b + 
                    texture(${textureNormal4}, uv * ${textureScale4}).xyz * splatting.a;
    // return normalMap;
    normalMap = normalize(normalMap) * 2.0 - 1.0;
    return normalize( tbn * normalMap );
}
`

/** 
 * @typedef {{
 *      textureColorUrl: URL
 *      textureNormalUrl: URL
 *      scale: Vector2
 * }} splattingTextureParameters
 */

function createUniforms(
    /** @type {URL} */ splattingTextureUrl,
    /** @type {splattingTextureParameters} */ splatting1,
    /** @type {splattingTextureParameters} */ splatting2,
    /** @type {splattingTextureParameters} */ splatting3,
    /** @type {splattingTextureParameters} */ splatting4,
) {
    return {
        [splattingTexture]: new GlTexture({ data: splattingTextureUrl }),

        [textureColor1]: new GlTexture({ data: splatting1.textureColorUrl, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
        [textureNormal1]: new GlTexture({ data: splatting1.textureNormalUrl, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
        [textureScale1]: splatting1.scale,

        [textureColor2]: new GlTexture({ data: splatting2.textureColorUrl, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
        [textureNormal2]: new GlTexture({ data: splatting2.textureNormalUrl, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
        [textureScale2]: splatting2.scale,

        [textureColor3]: new GlTexture({ data: splatting3.textureColorUrl, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
        [textureNormal3]: new GlTexture({ data: splatting3.textureNormalUrl, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
        [textureScale3]: splatting3.scale,

        [textureColor4]: new GlTexture({ data: splatting4.textureColorUrl, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
        [textureNormal4]: new GlTexture({ data: splatting4.textureNormalUrl, wrapS: 'REPEAT', wrapT: 'REPEAT' }),
        [textureScale4]: splatting4.scale,
    }
}

function getSplatting(/** @type {string} */ uv) {
    return `getSplatting(${uv})`
}

function getColor(
    /** @type {string} */ uv,
    /** @type {string} */ splatting
) {
    return `getSplattingColor(${uv}, ${splatting})`
}

function getNormal(
    /** @type {string} */ normal,
    /** @type {string} */ viewTangent,
    /** @type {string} */ viewBitangent,
    /** @type {string} */ uv,
    /** @type {string} */ splatting
) {
    return `getSplattingNormal(${normal}, ${viewTangent}, ${viewBitangent}, ${uv}, ${splatting})`
}

export const GLSL_SPLATTING = Object.freeze({
    declaration,
    getSplatting,
    getColor,
    getNormal,
    splattingTexture,
    textureColor1,
    textureNormal1,
    textureScale1,
    textureColor2,
    textureNormal2,
    textureScale2,
    textureColor3,
    textureNormal3,
    textureScale3,
    textureColor4,
    textureNormal4,
    textureScale4,
    createUniforms,
})
