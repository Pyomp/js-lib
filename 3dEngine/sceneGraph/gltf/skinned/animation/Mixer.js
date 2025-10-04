import { Quaternion } from "../../../../../math/Quaternion.js"
import { Vector3 } from "../../../../../math/Vector3.js"
import { Track } from "./Track.js"
import { Animation, LoopOnce, LoopPingpong, LoopPongOnce } from "./Animation.js"
import { Bone } from "./Bone.js"
import { loopRaf } from "../../../../../utils/loopRaf.js"
import { GLSL_SKINNED } from "../../../../programs/chunks/glslSkinnedChunk.js"
import { EventSet } from "../../../../../utils/EventSet.js"
import { MorphController } from "./MorphController.js"

function applyLoopToTime(
    /** @type {Track} */ track,
    /** @type {{time: number, timeDirection: number, requestStop: boolean}} */ target,
) {
    if (target.time > track.end) {
        if (track.loop === LoopPingpong || track.loop === LoopPongOnce) {
            target.timeDirection = -1
            target.time = track.end - (target.time - track.end)
        } else if (track.loop === LoopOnce) {
            target.requestStop = true
            return
        } else {
            target.time %= track.end
        }
    } else if (target.time < 0) {
        target.time = -target.time
        if (track.loop === LoopPingpong) target.timeDirection = 1
        else if (track.loop === LoopPongOnce) target.requestStop = true
    }
}

export class Mixer {
    rootBone

    /** @type {{[trackName: string]: Track}} */ #tracks = {}

    /** 
     * @type {{
     *      [animationKey: string | number]: {
     *          animationKey: string | number
     *          time: number
     *          weight: number
     *          timeDirection: number
     *          requestStop: boolean
     *      }
     * }}
     */
    #currentAnimations = {}

    speed = 1

    fadeSpeed = 15

    #animation

    constructor(
        /** @type {Animation} */animation
    ) {
        this.#animation = animation
        this.#tracks = animation.tracks

        const { jointsTexture, rootBone } = this.#animation.createArmature()
        this.jointsTexture = jointsTexture
        this.rootBone = rootBone

        this.rootBone.updateMatrix()
    }

    dispose() {
        this.jointsTexture.needsDelete = true
        for (const morphController of this.#morphControllers) {
            this.removeMorphController(morphController)
        }
    }

    updateTime() {
        for (const animation of Object.values(this.#currentAnimations)) {
            if (animation.requestStop) {
                animation.weight -= loopRaf.deltatimeSecond * this.fadeSpeed
                if (animation.weight <= 0) {
                    delete this.#currentAnimations[animation.animationKey]
                    continue
                }
            } else {
                animation.weight = Math.min(1, animation.weight + loopRaf.deltatimeSecond * this.fadeSpeed)
            }
            animation.time += loopRaf.deltatimeSecond * animation.timeDirection * this.speed
            applyLoopToTime(this.#tracks[animation.animationKey], animation)
        }
    }

    updateJointsTexture() {
        this.rootBone.traverse((/** @type {Bone} */ bone) => {
            this.#animation.applyBoneTransformation(Object.values(this.#currentAnimations), bone)
        })
        this.rootBone.updateMatrix()
        this.jointsTexture.dataVersion++
    }

    play(
        /** @type {string | number} */ animationName,
        timeUpdate = 0
    ) {
        const track = this.#tracks[animationName]

        if (track === undefined) return

        if (!this.#currentAnimations[animationName]) {
            this.#currentAnimations[animationName] = {
                animationKey: animationName,
                time: 0,
                weight: 0,
                timeDirection: 1,
                requestStop: false
            }
        }

        this.#currentAnimations[animationName].requestStop = false

        if (track.loop === LoopOnce) {
            this.#currentAnimations[animationName].time = timeUpdate
        }
    }

    stop(/** @type {string | number} */ animationName) {
        if (this.#currentAnimations[animationName])
            this.#currentAnimations[animationName].requestStop = true
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
            const { indices, values } = this.#animation.getMorphs(Object.values(this.#currentAnimations), morphController.name)
            morphController.update(indices, values)
        }
    }

    clone() {
        return new Mixer(this.#animation)
    }
}
