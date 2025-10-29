const position = 'position'
const intensity = 'intensity'
const color = 'color'
const shininess = 'shininess'
const specular = 'specular'
const incidence = 'incidence'
const pointLights = 'pointLights'
const uboName = 'pointLightUbo'
const PointLight = 'PointLight'

function uboDeclaration(
    /** @type {number} */ pointLightCount
) {
    return pointLightCount > 0 ? `
struct ${PointLight} {
    vec3 ${position};
    float ${intensity};
    vec3 ${color};
    float ${incidence};
};

layout(std140) uniform ${uboName} {
    ${PointLight} ${pointLights}[${pointLightCount}];
};
`: ''
}

function vertexDeclaration() {
    return`
out vec3 v_surfaceToView;
out vec3 v_worldPosition;
`
}

function computeVarying(
    /** @type {string} */ modelWorldPosition,
    /** @type {string} */ cameraPosition,
) {
    return `
v_worldPosition = ${modelWorldPosition}.xyz / ${modelWorldPosition}.w;
v_surfaceToView = ${cameraPosition} - v_worldPosition;
`
}

function calcPointLightsDeclaration(
    /** @type {number} */ pointLightCount,
    /** @type {string} */ cameraPosition,
) {
    return `
void calcPointLight(in vec3 worldPosition, in vec3 normal, in float shininess, out vec3 color, out float specular){
    for (int i = 0; i < ${pointLightCount}; i++) {
        ${PointLight} pointLight = ${pointLights}[i];
        
        vec3 eyeVec = normalize(${cameraPosition} - worldPosition);
        vec3 incidentVec = worldPosition - pointLight.position;
        float incidentLength = length(incidentVec);
        incidentVec = incidentVec / incidentLength;
        vec3 lightVec = -incidentVec;
        
        float intensityDistance = max(0., (pointLight.${incidence} - incidentLength) / pointLight.${incidence});

        float diffuse = max(dot(lightVec, normal), 0.0);
        color += diffuse * pointLight.${color} * pointLight.${intensity} * intensityDistance;

        float highlight = pow(max(dot(eyeVec, reflect(incidentVec, normal)), 0.0), ${shininess});
        specular += highlight * pointLight.${intensity};
    }
}`
}

function fragmentDeclaration(pointLightCount = 0) {
    return pointLightCount > 0 ? `
${uboDeclaration(pointLightCount)}

in vec3 v_surfaceToView;
in vec3 v_worldPosition;

uniform float ${shininess};
uniform vec3 ${specular};

${calcPointLightsDeclaration(pointLightCount, 'v_worldPosition')}
` : ''
}

function computePointLight(
    /** @type {string} */ worldPosition = 'v_worldPosition',
    /** @type {string} */ normal,
    /** @type {string} */ shininess,
    /** @type {string} */ outColor,
    /** @type {string} */ outSpecular
) {
    return `calcPointLight(${worldPosition}, ${normal}, ${shininess}, ${outColor}, ${outSpecular});`
}

const uboOffset = Object.freeze({
    position: 0,
    intensity: 3,
    color: 4,
    incidence: 7
})

const uboByteLength = 8 * 4

export const GLSL_POINT_LIGHT = Object.freeze({
    uboName,
    uboOffset,
    uboByteLength,
    PointLight,
    pointLights,
    position,
    intensity,
    color,
    incidence,
    shininess,
    uboDeclaration,

    calcPointLightsDeclaration,

    vertexDeclaration,
    computeVarying,
    fragmentDeclaration,
    computePointLight,
})
