/*
It was a test to create shadow.
It fails due to missing depth information in a deferred rendering setup
*/
const declaration = 
/* glsl */`

#define SAMPLES 128
#define EPSILON 0.01
#define DEPTH_REVERSED false
#define SHADOW_INTENSITY 5.
#define SOFT_SHADOWS .1
#define DEPTH_SCALE 1.0

float calculateLight(vec3 lightPosition, vec2 uv){
    vec3 pixelPosition = getPosition(uv);
    vec3 lightDir = pixelPosition - lightPosition;
    vec3 pixelScreenPosition = vec3(uv, getScreenDepth(uv));
    vec3 lightScreenPosition = getScreenPosition(lightPosition);                        
    vec3 lightScreenDir = pixelScreenPosition - lightScreenPosition;
    vec3 lightScreenPos = lightScreenPosition; // TODO calculate the bound of the screen
    
    float lightResult = 1.;

    for(int j=0; j<128; j++) {
        lightScreenPos += LIGHT_SAMPLE_DIST * lightScreenDir;

        vec3 normal = getNormal(lightScreenPos.xy);

        lightResult += min(0., dot(lightDir, normal)*0.01);

        if(lightResult <= 0.) return 0.;

        // check lightScreenPos go beyond the current pixel point
        vec3 currentDir = pixelScreenPosition - lightScreenPosition;
        if(dot(currentDir, lightScreenDir) < 0.9) return lightResult;
    }

    return lightResult;
}
`
