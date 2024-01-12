import { GlProgram } from "../../../webgl/glContext/GlProgram.js"

export class ParticlePhysicsGlProgram extends GlProgram {
    constructor(gl, uboIndex, frameCount) {
        super(
            gl,
            `#version 300 es
            in vec3 initVelocity;
            in vec3 initPosition;

            in vec4 velocity; // .w is time
            in vec4 position; // .w is size
        
            uniform float deltatimeSecond;
            uniform mat4 worldMatrix;
            uniform bool stopRequest;

            struct Frame {
                float time;
                float size;
                vec4 color;
            };

            layout(std140) uniform systemUBO {
                float particleLifeTime;
                Frame frames[${frameCount}];
            };

            out vec4 outVelocity; // .w is time
            out vec4 outPosition; // .w is size
            out vec4 outColor;  

            int getFrameIndex(float currentTime){
                int index = 0;

                while (frames[index].time < currentTime && index < ${frameCount} ) {
                    index++;
                }
                
                return index;
            }

            float getAlpha(float start, float end, float current){
                return (current - start) / (end - start);
            }

            void main() {
                outVelocity.w = velocity.w + deltatimeSecond;

                float dt;

                if(outVelocity.w > particleLifeTime && !stopRequest){
                    outVelocity.w = mod(outVelocity.w, particleLifeTime);
                    outVelocity.xyz = initVelocity;
                    outPosition = worldMatrix * vec4(initPosition, 1.0);
                    dt = outVelocity.w;
                } else {
                    outVelocity.xyz = velocity.xyz;
                    outPosition.xyz = position.xyz;
                    dt = deltatimeSecond;
                }

                float t = outVelocity.w;
                
                outPosition.xyz += outVelocity.xyz * dt;

                int frameIndex = getFrameIndex(t);

                if(frameIndex >= ${frameCount}) {
                    outColor.w = 0.;
                } else if( frameIndex == 0 ) {
                    Frame frame = frames[0];
                    outColor = frame.color;
                    outPosition.w = frame.size;
                } else {
                    Frame previousFrame = frames[frameIndex - 1];
                    Frame frame = frames[frameIndex];
                    float alpha = getAlpha(previousFrame.time, frame.time, t);
                    outColor = mix(previousFrame.color, frame.color, alpha);
                    outPosition.w = mix(previousFrame.size, frame.size, alpha);
                }
            }
            `,
            `#version 300 es
            void main() {
                discard;
            }
            `,
            { uboIndex, outVaryings: ['outVelocity', 'outPosition', 'outColor'] }
        )
    }
}
