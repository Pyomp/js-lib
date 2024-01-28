const position = 'position'
const intensity = 'intensity'
const color = 'color'
const shininess = 'shininess'
const specular = 'specular'

const uboName = 'pointLightUbo'

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
struct PointLight {
    vec3 ${position};
    float ${intensity};
    vec3 ${color};
    float forPad;
};

layout(std140) uniform ${uboName} {
    PointLight pointLights[${pointLightCount}];
};

in vec3 v_surfaceToView;
in vec3 v_worldPosition;

${shininessEnable ? `uniform float ${shininess};` : ''}
${shininessEnable ? `uniform vec3 ${specular};` : ''}

void calcPointLight(in vec3 normal, out vec3 color${shininessEnable ? ', out float specular' : ''}){
    for (int i = 0; i < ${pointLightCount}; i++) {
        PointLight pointLight = pointLights[i];
        
        vec3 eyeVec = normalize(v_surfaceToView);
        vec3 incidentVec = normalize(v_worldPosition - pointLight.position);
        vec3 lightVec = -incidentVec;
        
        float diffuse = max(dot(lightVec, normal), 0.0);
        color += diffuse * pointLight.${color} * pointLight.${intensity};

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
})

const uboByteLength = 8 * 4

export const GLSL_POINT_LIGHT = Object.freeze({
    uboName,
    uboOffset,
    uboByteLength,
    position,
    intensity,
    color,
    shininess,
    vertexDeclaration,
    computeVarying,
    fragmentDeclaration,
    computePointLight,
})
