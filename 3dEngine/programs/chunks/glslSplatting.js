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

function getSplatting(uv) {
    return `getSplatting(${uv})`
}

function getColor(uv, splatting) {
    return `getSplattingColor(${uv}, ${splatting})`
}

function getNormal(normal, viewTangent, viewBitangent, uv, splatting) {
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
})
