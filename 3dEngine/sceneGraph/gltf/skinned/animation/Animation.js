import { Quaternion } from '../../../../../math/Quaternion.js'
import { Vector3 } from '../../../../../math/Vector3.js'
import { Vector4 } from '../../../../../math/Vector4.js'
import { GLSL_MORPH_TARGET } from '../../../../programs/chunks/glslMorphTarget.js'
import { GlTexture } from '../../../../webgl/glDescriptors/GlTexture.js'
import { GlTextureFloatRGB } from '../../../textures/GlTextureFloatRGB.js'
import { Bone } from './Bone.js'
import { KeyFrame } from './KeyFrame.js'
import { MorphController } from './MorphController.js'
import { Track } from './Track.js'

const vs_pars = () => `
in vec4 a_weights;
in uvec4 a_joints;

uniform sampler2D u_jointTexture;

mat4 getBoneMatrix(uint jointNdx) {
    return mat4(
      texelFetch(u_jointTexture, ivec2(0, jointNdx), 0),
      texelFetch(u_jointTexture, ivec2(1, jointNdx), 0),
      texelFetch(u_jointTexture, ivec2(2, jointNdx), 0),
      texelFetch(u_jointTexture, ivec2(3, jointNdx), 0));
}
`

const vs_main = () => `
mat4 skinMatrix = getBoneMatrix(a_joints[0]) * a_weights[0] +
                getBoneMatrix(a_joints[1]) * a_weights[1] +
                getBoneMatrix(a_joints[2]) * a_weights[2] +
                getBoneMatrix(a_joints[3]) * a_weights[3];
`

const _vector3 = new Vector3()
const _quaternion = new Quaternion()

export const LoopOnce = 0
export const LoopRepeat = 1
export const LoopPingpong = 2
export const LoopPongOnce = 3

export function morphFromGltf(
    /** @type {GltfTarget[]} */ targets
) {
    /** @type {Float32Array[]} */ const position = []
    /** @type {Float32Array[]} */ const normal = []
    /** @type {Float32Array[]} */ const tangent = []

    for (const target of targets) {
        if (target.POSITION?.buffer) position.push(target.POSITION.buffer)
        if (target.NORMAL?.buffer) normal.push(target.NORMAL.buffer)
        if (target.TANGENT?.buffer) tangent.push(target.TANGENT.buffer)
    }

    return { position, normal, tangent }
}

const EmptyMorph = Object.freeze({ indices: [0, 0, 0, 0], values: [0, 0, 0, 0] })

const QuaternionIdentity = new Quaternion().identity()

const boneRelativeResult = {
    position: new Vector3(),
    quaternion: new Quaternion(),
    scale: new Vector3(),
}

export class Animation {
    static vs_pars = vs_pars
    static vs_main = vs_main
    static morphFromGltf = morphFromGltf

    /** 
     * @type {{[boneName: string]: {
     *      position: Vector3
     *      quaternion: Quaternion
     *      scale: Vector3
     * }}}
     */
    initialPose = {}

    /** @type {{[trackName: string]: Track}} */
    tracks = {}

    #morphs

    #bonesCount
    #gltfSkinRootBone
    #inverseBindMatrices

    /**
     * @param {{
     *      gltfSkin: GltfSkin
     *      animationDictionary?: {[gltfAnimationName: string]: string | number}
     *      readonly morphs?: {
     *          readonly [morphTarget: string]:{
     *              readonly position: Float32Array[]
     *              readonly normal: Float32Array[]
     *          }
     *      }
     *  }} gltfSkin
     */
    constructor({
        gltfSkin,
        animationDictionary = {},
        morphs = {}
    }) {
        if (!gltfSkin.animations || !gltfSkin.inverseBindMatrices)
            throw new Error('no animation data in gltf')

        this.name = gltfSkin.name
        this.#bonesCount = gltfSkin.bonesCount
        this.#gltfSkinRootBone = gltfSkin.rootBones[0]
        this.#inverseBindMatrices = gltfSkin.inverseBindMatrices.buffer
        this.#morphs = morphs

        this.#initInitialPose(gltfSkin.rootBones[0])
        this.#initTracks(gltfSkin.animations, animationDictionary)
    }

    // NOT NEEDED ? TO BE DELETE NEXT TIME YOU SEE IT
    // createMorphs() {
    //     /** @type {{[targetName: string]: {activeMorphsTarget: Int32Array, morphWeightsTarget: Float32Array}}} */
    //     const morphs = {}

    //     for (const track of Object.values(this.tracks)) {
    //         for (const key in track.morphs) {
    //             if (!morphs[key]) {
    //                 morphs[key] = {
    //                     activeMorphsTarget: new Int32Array(4),
    //                     morphWeightsTarget: new Float32Array(4)
    //                 }
    //             }
    //         }
    //     }

    //     return morphs
    // }

    createArmature() {
        const buffer = new Float32Array(16 * this.#bonesCount)

        const jointsTexture = new GlTexture({
            name: `joints for skin ${this.name}`,
            data: buffer,

            wrapS: 'CLAMP_TO_EDGE',
            wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST',
            magFilter: 'NEAREST',

            internalformat: 'RGBA32F',
            width: 4, // 16 element (matrix 4x4)
            height: this.#bonesCount,
            border: 0,
            format: 'RGBA',
            type: 'FLOAT',

            needsMipmap: false,
        })

        const rootBone = new Bone(this.#gltfSkinRootBone, buffer, this.#inverseBindMatrices)

        rootBone.updateMatrix(true, true)

        return {
            rootBone,
            jointsTexture
        }
    }

    /**
     * @param {GltfBone} gltfBone 
     */
    #initInitialPose(gltfBone) {
        this.initialPose[gltfBone.name] = {
            position: new Vector3().fromArray(gltfBone.translation ?? [0, 0, 0]),
            quaternion: new Quaternion().fromArray(gltfBone.rotation ?? [0, 0, 0, 1]),
            scale: new Vector3().fromArray(gltfBone.scale ?? [1, 1, 1]),
        }
        if (gltfBone.children) {
            for (const bone of gltfBone.children) {
                this.#initInitialPose(bone)
            }
        }
    }

    #extractLoopFromName(
        /** @type {string} */ animationName
    ) {
        if (animationName.includes('pingpong')) {
            return LoopPingpong
        } else if (animationName.includes('repeat')) {
            return LoopRepeat
        } else if (animationName.includes('pongonce')){
            return LoopPongOnce
        } else {
            return LoopOnce
        }
    }

    #initTracks(
        /** @type {{[animationName: string]: GltfAnimation}} */ gltfAnimations,
        /** @type {{[gltfAnimationName: string]: string | number}} */ animationDictionary
    ) {
        for (const animationName in gltfAnimations) {
            const key = animationDictionary[animationName] ?? animationName
            const gltfAnimation = gltfAnimations[animationName]
            const loop = this.#extractLoopFromName(animationName)
            this.tracks[key] = new Track(gltfAnimation, loop)
        }
    }

    getBoneDelta(
        /** @type {number} */ time,
        /** @type {string | number} */ animationKey,
        /** @type {string} */ boneName
    ) {
        const boneTransformation = this.tracks[animationKey]?.bones[boneName]
        const initialBone = this.initialPose[boneName]

        if (boneTransformation?.position) {
            const absolute = getBonePosition(time, boneTransformation.position)
            boneRelativeResult.position.copy(absolute).sub(initialBone.position)
        } else {
            boneRelativeResult.position.set(0, 0, 0)
        }

        if (boneTransformation?.quaternion) {
            const absolute = getBoneQuaternion(time, boneTransformation.quaternion)
            boneRelativeResult.quaternion.copy(initialBone.quaternion).invert().multiply(absolute)
        } else {
            boneRelativeResult.quaternion.identity()
        }

        if (boneTransformation?.scale) {
            const absolute = getBoneScale(time, boneTransformation.scale)
            boneRelativeResult.scale.copy(absolute).sub(initialBone.scale)
        } else {
            boneRelativeResult.scale.set(0, 0, 0)
        }

        return boneRelativeResult
    }



    applyBoneTransformation(
        /** @type {{time: number, weight: number, animationKey: string | number}[]} */ animations,
        /** @type {Bone} */ boneTarget,
    ) {
        const initialBone = this.initialPose[boneTarget.name]
        boneTarget.position.copy(initialBone.position)
        boneTarget.quaternion.copy(initialBone.quaternion)
        boneTarget.scale.copy(initialBone.scale)

        for (const { time, weight, animationKey } of animations) {
            const boneRelativeTransformation = this.getBoneDelta(time, animationKey, boneTarget.name)
            boneTarget.position.add(boneRelativeTransformation.position.multiplyScalar(weight))
            boneTarget.quaternion.multiply(
                weight < 1 ?
                    boneRelativeTransformation.quaternion.slerp(QuaternionIdentity, 1 - weight)
                    : boneRelativeTransformation.quaternion
            )
            boneTarget.scale.add(boneRelativeTransformation.scale.multiplyScalar(weight))
        }
    }

    createMorphController(/** @type { string } */ targetName) {
        return new MorphController(this.#morphs[targetName], targetName)
    }

    getMorphs(
        /** @type {{time: number, weight: number, animationKey: string | number}[]} */ animations,
        /** @type { string } */ targetName,
    ) {
        /** @type {number[]} */
        const accumulator = []

        for (const { animationKey, time, weight } of animations) {
            const track = this.tracks[animationKey]
            if (!track) continue
            const morphs = track.morphs[targetName]
            if (!morphs) continue
            const weights = morphs.weights

            const result = getMorphWeights(time, weights.key, weights.frame)

            if (accumulator.length < result.length) {
                accumulator.length = result.length
                accumulator.fill(0, accumulator.length - result.length)
            }

            for (let i = 0; i < result.length; i++) {
                accumulator[i] += result[i] * weight
            }
        }

        return top4Indices(accumulator)
    }
}

function getAlpha(
   /** @type {number} */ time,
   /** @type {number} */ index,
   /** @type {number[] | Float32Array} */ keys
) {
    return (time - keys[index - 1]) / (keys[index] - keys[index - 1])
}

function getIndexFromKeysTime(
    /** @type {number} */ time,
    /** @type {number[] | Float32Array} */ keys
) {
    let i = 0
    while (time > keys[i]) i++
    return i
}

function lerpVector3(
  /** @type {number} */ time,
  /** @type {number} */ index,
  /** @type {number[] | Float32Array} */ keys,
  /** @type {Vector3[]} */ frames
) {
    if (index === 0) {
        _vector3.copy(frames[0])
    } else if (index >= keys.length) {
        _vector3.copy(frames[frames.length - 1])
    } else {
        const alpha = getAlpha(time, index, keys)
        _vector3.lerpVectors(frames[index - 1], frames[index], alpha)
    }
    return _vector3
}

function getMorphWeights(
   /** @type {number} */ time,
   /** @type {number[] | Float32Array} */ keys,
   /** @type {Float32Array[]} */ frames
) {
    const index = getIndexFromKeysTime(time, keys)

    if (index === 0) {
        return frames[0]
    } else if (index >= keys.length) {
        return frames[frames.length - 1]
    } else {
        const alpha = getAlpha(time, index, keys)
        const fromArray = frames[index - 1]
        const toArray = frames[index]
        return fromArray.map((from, index) => from + (toArray[index] - from) * alpha)
    }
}

const _indices = [0, 0, 0, 0]
const _values = [0, 0, 0, 0]
/** @type {{readonly indices: number[], readonly values: number[]}} */
const _top4IndicesResult = { indices: _indices, values: _values }
function top4Indices(
    /** @type {number[] | Float32Array} */ array
) {
    _indices.fill(0)
    _values.fill(0)

    function eachCallback(
        /** @type {number} */ v,
        /** @type {number} */ i
    ) {
        if (v > _values[0]) {
            _values[3] = _values[2]; _indices[2] = _indices[2]
            _values[2] = _values[1]; _indices[2] = _indices[1]
            _values[1] = _values[0]; _indices[1] = _indices[0]
            _values[0] = v; _indices[0] = i
        } else if (v > _values[1]) {
            _values[3] = _values[2]; _indices[3] = _indices[2]
            _values[2] = _values[1]; _indices[2] = _indices[1]
            _values[1] = v; _indices[1] = i
        } else if (v > _values[2]) {
            _values[3] = _values[2]; _indices[3] = _indices[2]
            _values[2] = v; _indices[2] = i
        } else if (v > _values[3]) {
            _values[3] = v; _indices[3] = i
        }
    }

    array.forEach(eachCallback)

    return _top4IndicesResult
}

function cubicVector3Interpolation(
    /** @type {number} */ time,
    /** @type {number} */ index,
    /** @type {number[] | Float32Array} */ keys,
    /** @type {Vector3[]} f*/ frames
) {
    if (index === 0) {
        _vector3.copy(frames[0])
    } else if (index >= keys.length) {
        if (keys.length < 3) _vector3.copy(frames[0])
        else _vector3.copy(frames[frames.length - 2])
    } else {
        const alpha = getAlpha(time, index, keys)
        _vector3.cubicSpline(
            frames[(index - 1) * 3 + 1], frames[(index - 1) * 3 + 2],
            frames[index * 3 + 1], frames[index * 3],
            alpha
        )
    }
    return _vector3
}

function getBonePosition(
    /** @type {number} */ time,
    /** @type {KeyFrame<Vector3[]>} */ bonePositionKeyFrame
) {
    const keys = bonePositionKeyFrame.key
    const frames = bonePositionKeyFrame.frame

    const index = getIndexFromKeysTime(time, keys)

    if (bonePositionKeyFrame.isLinear) {
        return lerpVector3(time, index, keys, frames)
    } else {
        return cubicVector3Interpolation(time, index, keys, frames)
    }
}

/**
 * @param { number } time
 * @param { KeyFrame<Vector3[]> } boneScaleKeyFrame
 */
function getBoneScale(time, boneScaleKeyFrame) {
    const keys = boneScaleKeyFrame.key
    const frames = boneScaleKeyFrame.frame

    const index = getIndexFromKeysTime(time, keys)

    if (boneScaleKeyFrame.isLinear) {
        return lerpVector3(time, index, keys, frames)
    } else {
        return cubicVector3Interpolation(time, index, keys, frames)
    }
}

function slerpQuaternion(
   /** @type {number} */ time,
   /** @type {number} */ index,
   /** @type {number[] | Float32Array} */ keys,
   /** @type {Quaternion[]} */ frames
) {
    if (index === 0) {
        _quaternion.copy(frames[0])
    } else if (index >= frames.length) {
        _quaternion.copy(frames[frames.length - 1])
    } else {
        const alpha = getAlpha(time, index, keys)
        _quaternion.slerpQuaternions(frames[index - 1], frames[index], alpha)
    }
    return _quaternion
}

function cubicQuaternion(
    /** @type {number} */ time,
    /** @type {number} */ index,
    /** @type {number[] | Float32Array} */ keys,
    /** @type {Quaternion[]} */ frames
) {
    if (index === 0) {
        _quaternion.copy(frames[1])
    } else if (index >= frames.length) {
        _quaternion.copy(frames[frames.length - 2])
    } else {
        const alpha = getAlpha(time, index, keys)

        _quaternion.cubicSpline(
            frames[(index - 1) * 3 + 1], frames[(index - 1) * 3 + 2],
            frames[index * 3 + 1], frames[index * 3],
            alpha)
    }
    return _quaternion
}

function getBoneQuaternion(
    /** @type {number} */ time,
    /** @type {KeyFrame<Quaternion[]>} */ quaternionKeyFrame
) {
    const keys = quaternionKeyFrame.key
    const frames = quaternionKeyFrame.frame

    const index = getIndexFromKeysTime(time, keys)

    if (quaternionKeyFrame.isLinear) {
        return slerpQuaternion(time, index, keys, frames)
    } else {
        return cubicQuaternion(time, index, keys, frames)
    }
}
