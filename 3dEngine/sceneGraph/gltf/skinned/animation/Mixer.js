import { Quaternion } from "../../../../../math/Quaternion.js"
import { Vector3 } from "../../../../../math/Vector3.js"
import { Track } from "./Track.js"
import { Animation, LoopOnce, LoopPingpong } from "./Animation.js"
import { Bone } from "./Bone.js"
import { loopRaf } from "../../../../../utils/loopRaf.js"
import { GLSL_SKINNED } from "../../../../programs/chunks/glslSkinnedChunk.js"
import { EventSet } from "../../../../../utils/EventSet.js"
import { MorphController } from "./MorphController.js"

export class Mixer {
    rootBone
    #poseSaved = {}

    /** @type {{[trackName: string]: Track}} */ #tracks = {}
    /** @type {{[trackName: string]: GltfKeyFrame}} */ #morphs = {}
    /** @type {Track} */ #currentTrack

    #time = 0
    speed = 1
    #fadeTime = 0
    #timeDirection = 1

    fadeSpeed = 15

    #animation
    /** @type {string | number} */
    #currentAnimationName = ''

    /** @type {EventSet<(animation: string | number, time: number)=>void>} */
    onUpdate = new EventSet()

    constructor(
        /** @type {Animation} */animation
    ) {
        this.#animation = animation
        this.#tracks = animation.tracks

        const { jointsTexture, rootBone } = this.#animation.createArmature()
        this.jointsTexture = jointsTexture
        this.rootBone = rootBone

        this.#initPoseSaved()
        this.#initCurrentTrack()
        this.rootBone.updateMatrix()
    }
    
    dispose() {
        this.jointsTexture.needsDelete = true
        this.onUpdate.emit(-1, -1)
        for (const morphController of this.#morphControllers) {
            this.removeMorphController(morphController)
        }
    }

    #initCurrentTrack() {
        const idle = Object.keys(this.#tracks).find((name) => name.includes('idle'))
        if (idle) {
            this.#currentTrack = this.#tracks[idle]
        } else {
            this.#currentTrack = Object.values(this.#tracks)[0]
        }
    }

    #initPoseSaved() {
        this.rootBone.traverse((bone) => {
            this.#poseSaved[bone.name] = {
                position: new Vector3().copy(bone.position),
                quaternion: new Quaternion().copy(bone.quaternion),
                scale: new Vector3().copy(bone.scale),
            }
        })
    }


    /**
     * @param {Bone} bone
     */
    #applyTransformationToBone(bone) {
        this.#animation.applyBoneTransformation(this.#time, this.#currentAnimationName, bone)
        if (this.#fadeTime > 0) {
            const saved = this.#poseSaved[bone.name]
            bone.position.lerp(saved.position, this.#fadeTime)
            bone.quaternion.slerp(saved.quaternion, this.#fadeTime)
            bone.scale.lerp(saved.scale, this.#fadeTime)
        }
    }

    #applyLoopToTime() {
        if (this.#time > this.#currentTrack.end) {
            if (this.#currentTrack.loop === LoopPingpong) {
                this.#timeDirection = -1
                this.#time = this.#currentTrack.end
            } else if (this.#currentTrack.loop === LoopOnce) {
                return
            } else {
                this.#time %= this.#currentTrack.end
            }
        } else if (this.#time < 0) {
            this.#time = -this.#time
            if (this.#currentTrack.loop === LoopPingpong) this.#timeDirection = 1
        }
    }

    #saveCurrentPose() {
        this.rootBone.traverse((bone) => {
            const bonePose = this.#poseSaved[bone.name]
            bonePose.position.copy(bone.position)
            bonePose.quaternion.copy(bone.quaternion)
            bonePose.scale.copy(bone.scale)
        })
    }

    updateTime() {
        this.#fadeTime -= loopRaf.deltatimeSecond * this.fadeSpeed
        this.#time += loopRaf.deltatimeSecond * this.#timeDirection * this.speed
        this.#applyLoopToTime()
    }

    updateJointsTexture() {
        this.rootBone.traverse((/** @type {Bone} */ bone) => { this.#applyTransformationToBone(bone) })
        this.rootBone.updateMatrix()
        this.jointsTexture.dataVersion++
    }

    play(
        /** @type {string | number} */ animationName,
        timeUpdate = 0
    ) {
        const track = this.#tracks[animationName]

        if (track === undefined) return

        if (this.#currentAnimationName !== animationName) {
            this.#time = 0
            this.#fadeTime = 1
            this.#timeDirection = 1
            this.#saveCurrentPose()
            this.#currentAnimationName = animationName
            this.#currentTrack = track

            this.onUpdate.emit(this.#currentAnimationName, this.#time)
        }

        if (this.#currentTrack.loop === LoopOnce) {
            this.#time = timeUpdate
        }

        this.onUpdate.emit(this.#currentAnimationName, timeUpdate)
    }

    /** @type {Set<MorphController>} */
    #morphControllers = new Set()
    createMorphController(
        /** @type {string} */ name
    ) {
        const morphController = this.#animation.createMorphController(name)
        this.#morphControllers.add(morphController)
        return morphController
    }

    removeMorphController(
       /** @type {MorphController} */ morphController
    ) {
        morphController.dispose()
        this.#morphControllers.delete(morphController)
    }

    updateMorphs() {
        for (const morphController of this.#morphControllers) {
            const { indices, values } = this.#animation.getMorphs(this.#time, this.#currentAnimationName, morphController.name)
            morphController.update(indices, values)
        }
    }

    clone() {
        return new Mixer(this.#animation)
    }
}
