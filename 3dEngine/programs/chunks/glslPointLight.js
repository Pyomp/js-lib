const position = 'position'
const intensity = 'intensity'
const color = 'color'
const shininess = 'shininess'
const specular = 'specular'
const incidence = 'incidence'
const pointLights = 'pointLights'
const uboName = 'pointLightUbo'

function declaration(pointLightCount) {
    return pointLightCount > 0 ? `
struct PointLight {
    vec3 ${position};
    float ${intensity};
    vec3 ${color};
    float ${incidence};
};

layout(std140) uniform ${uboName} {
    PointLight ${pointLights}[${pointLightCount}];
};
`: ''
}

function vertexDeclaration(pointLightCount = 0) {
    return pointLightCount > 0 ? `
out vec3 v_surfaceToView;
out vec3 v_worldPosition;
`: ''
}

function computeVarying(modelWorldPosition, cameraPosition, pointLightCount = 0) {
    return pointLightCount > 0 ? `
v_worldPosition = ${modelWorldPosition}.xyz / ${modelWorldPosition}.w;
v_surfaceToView = ${cameraPosition} - v_worldPosition;
`: ''
}

function fragmentDeclaration(pointLightCount = 0, shininessEnable = false) {
    return pointLightCount > 0 ? `
${declaration(pointLightCount)}

in vec3 v_surfaceToView;
in vec3 v_worldPosition;

${shininessEnable ? `uniform float ${shininess};` : ''}
${shininessEnable ? `uniform vec3 ${specular};` : ''}

void calcPointLight(in vec3 normal, out vec3 color${shininessEnable ? ', out float specular' : ''}){
    for (int i = 0; i < ${pointLightCount}; i++) {
        PointLight pointLight = ${pointLights}[i];
        
        vec3 eyeVec = normalize(v_surfaceToView);
        vec3 incidentVec = v_worldPosition - pointLight.position;
        float incidentLength = length(incidentVec);
        incidentVec = incidentVec / incidentLength;
        vec3 lightVec = -incidentVec;
        
        float intensityDistance = max(0., (pointLight.${incidence} - incidentLength) / pointLight.${incidence});

        float diffuse = max(dot(lightVec, normal), 0.0);
        color += diffuse * pointLight.${color} * pointLight.${intensity} * intensityDistance;

        ${shininessEnable ? `
        float highlight = pow(max(dot(eyeVec, reflect(incidentVec, normal)), 0.0), ${shininess});
        specular += highlight * pointLight.${intensity};`
            : ''}
    }
}
` : ''
}

function computePointLight(normal, outColor, outSpecular) {
    return outSpecular ? `
calcPointLight(${normal}, ${outColor}, ${outSpecular});
`: `
calcPointLight(${normal}, ${outColor});
`
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
    pointLights,
    position,
    intensity,
    color,
    shininess,
    declaration,
    vertexDeclaration,
    computeVarying,
    fragmentDeclaration,
    computePointLight,
})
