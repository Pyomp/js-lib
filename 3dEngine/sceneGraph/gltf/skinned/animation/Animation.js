import { Quaternion } from '../../../../../math/Quaternion.js'
import { Vector3 } from '../../../../../math/Vector3.js'
import { Texture } from '../../../Texture.js'
import { Bone } from './Bone.js'
import { KeyFrame } from './KeyFrame.js'
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

export class Animation {
    static vs_pars = vs_pars
    static vs_main = vs_main

    initialPose = {}

    /** @type {{[trackName: string]: Track}} */
    tracks = {}

    #bonesCount
    #gltfSkinRootBone
    #inverseBindMatrices
    /**
     * @param {GltfSkin} gltfSkin
     * @param {{[gltfAnimationName: string]: string | number}} animationDictionary
     */
    constructor(gltfSkin, animationDictionary = {}) {
        this.#bonesCount = gltfSkin.bonesCount
        this.#gltfSkinRootBone = gltfSkin.root
        this.#inverseBindMatrices = gltfSkin.inverseBindMatrices.buffer

        this.#initInitialPose(gltfSkin.root)
        this.#initTracks(gltfSkin.animations, animationDictionary)
    }

    createArmature() {
        const buffer = new Float32Array(16 * this.#bonesCount)
        const jointsTexture = new Texture({
            data: buffer,

            wrapS: 'CLAMP_TO_EDGE',
            wrapT: 'CLAMP_TO_EDGE',
            minFilter: 'NEAREST',
            magFilter: 'NEAREST',

            target: 'TEXTURE_2D',
            internalformat: 'RGBA32F',
            width: 4, // 16 element (matrix 4x4)
            height: this.#bonesCount,
            border: 0,
            format: 'RGBA',
            type: 'FLOAT',

            needsMipmap: false,
        })
        return {
            rootBone: new Bone(this.#gltfSkinRootBone, buffer, this.#inverseBindMatrices),
            jointsTexture
        }
    }

    /**
     * @param {GltfBone} gltfBone 
     */
    #initInitialPose(gltfBone) {
        this.initialPose[gltfBone.name] = {
            position: gltfBone.translation ? new Vector3().fromArray(gltfBone.translation) : null,
            quaternion: gltfBone.rotation ? new Quaternion().fromArray(gltfBone.rotation) : null,
            scale: gltfBone.scale ? new Vector3().fromArray(gltfBone.scale) : null,
        }
        if (gltfBone.children) {
            for (const bone of gltfBone.children) {
                this.#initInitialPose(bone)
            }
        }
    }

    #extractLoopFromName(animationName) {
        if (animationName.includes('pingpong')) {
            return LoopPingpong
        } else if (animationName.includes('repeat')) {
            return LoopRepeat
        } else {
            return LoopOnce
        }
    }

    #initTracks(gltfAnimations, animationDictionary) {
        for (const animationName in gltfAnimations) {
            const reference = animationDictionary[animationName] ?? animationName
            const gltfAnimation = gltfAnimations[animationName]
            const loop = this.#extractLoopFromName(animationName)
            this.tracks[reference] = new Track(gltfAnimation, loop)
        }
    }

    /**
     * @param {number} time 
     * @param {Track} track 
     * @param {Bone} boneTarget 
     * @returns 
     */
    applyBoneTransformation(time, track, boneTarget) {
        const boneTransformation = track.bones[boneTarget.name]
        boneTarget.position.copy(boneTransformation?.position ? getBonePosition(time, boneTransformation.position) : this.initialPose[boneTarget.name].position)
        boneTarget.quaternion.copy(boneTransformation?.quaternion ? getBoneQuaternion(time, boneTransformation.quaternion) : this.initialPose[boneTarget.name].quaternion)
        boneTarget.scale.copy(boneTransformation?.scale ? getBoneScale(time, boneTransformation.scale) : this.initialPose[boneTarget.name].scale)
    }
}

/**
 * @param {number} time 
 * @param {number} index 
 * @param {number[]} keys 
 */
function getAlpha(time, index, keys) {
    return (time - keys[index - 1]) / (keys[index] - keys[index - 1])
}

/**
 * @param {number} time
 * @param {number[]} keys 
 */
function getIndexFromKeysTime(time, keys) {
    let i = 0
    while (time > keys[i]) i++
    return i
}

/**
 * @param {number} time
 * @param {number} index 
 * @param {number[]} keys 
 * @param {Vector3[]} frames 
 */
function lerpVector3(time, index, keys, frames) {
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

/**
* @param {number} time
* @param {number} index 
* @param {number[]} keys 
* @param {Vector3[]} frames 
*/
function cubicVector3Interpolation(time, index, keys, frames) {
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

/** 
 * @param { number } time
 * @param { KeyFrame } bonePositionKeyFrame
 */
function getBonePosition(time, bonePositionKeyFrame) {
    if (!bonePositionKeyFrame) return null

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
 * @param { KeyFrame } boneScaleKeyFrame
 */
function getBoneScale(time, boneScaleKeyFrame) {
    if (!boneScaleKeyFrame) return null

    const keys = boneScaleKeyFrame.key
    const frames = boneScaleKeyFrame.frame

    const index = getIndexFromKeysTime(time, keys)

    if (boneScaleKeyFrame.isLinear) {
        return lerpVector3(time, index, keys, frames)
    } else {
        return cubicVector3Interpolation(time, index, keys, frames)
    }
}

/**
 * @param {number} time 
 * @param {number} index 
 * @param {number[]} keys 
 * @param {Quaternion[]} frames 
 */
function slerpQuaternion(time, index, keys, frames) {
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

/**
 * @param {number} time 
 * @param {number} index 
 * @param {number[]} keys 
 * @param {Quaternion[]} frames 
 */
function cubicQuaternion(time, index, keys, frames) {
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

/**
 * @param { number } time
 * @param { KeyFrame } quaternionKeyFrame
 */
function getBoneQuaternion(time, quaternionKeyFrame) {
    if (!quaternionKeyFrame) return null

    const keys = quaternionKeyFrame.key
    const frames = quaternionKeyFrame.frame

    const index = getIndexFromKeysTime(time, keys)

    if (quaternionKeyFrame.isLinear) {
        return slerpQuaternion(time, index, keys, frames)
    } else {
        return cubicQuaternion(time, index, keys, frames)
    }
}
