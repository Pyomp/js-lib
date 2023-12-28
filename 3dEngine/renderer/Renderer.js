import { Box3 } from "../../math/Box3.js"
import { GlContext } from "../webgl/GlContext.js"
import { GlProgram } from "../webgl/GlProgram.js"
import { GlTexture } from "../webgl/GlTexture.js"
import { Camera } from "../sceneGraph/Camera.js"
import { Node3D } from "../sceneGraph/Node3D.js"
import { Object3D } from "../sceneGraph/Object3D.js"
import { Scene } from "../sceneGraph/Scene.js"
import { PointLightsRenderer } from "./modules/PointLightsRenderer.js"
import { PointLight } from "../sceneGraph/light/PointLight.js"
import { GlUbo } from "../webgl/GlUbo.js"
import { WindowInfoRenderer } from "./modules/WindowInfoRenderer.js"
import { ParticleRenderer } from "./modules/ParticlesRendererModules/ParticleRenderer.js"
import { DepthTexture } from "../textures/DepthTexture.js"
import { blit, typedArrayToType } from "../webgl/utils.js"
import { SkinnedNode } from "../sceneGraph/gltf/skinned/SkinnedNode.js"
import { GlVao } from "../webgl/GlVao.js"
import { SkyBoxRenderer } from "./modules/SkyBoxRenderer.js"

const _box3 = new Box3()

export class Renderer {
    htmlElement = document.createElement('div')

    scene = new Scene()

    camera = new Camera({})

    /** @type {Set<PointLight>} */ pointLights = new Set()

    /** @type {SkyBoxRenderer} */ skyBoxRenderer

    constructor() {
        this.htmlElement.style.top = '0'
        this.htmlElement.style.left = '0'
        this.htmlElement.style.width = '100%'
        this.htmlElement.style.height = '100%'
        this.htmlElement.style.position = 'absolute'

        this.initGl()
    }

    onContextLost() {
        this.#programMap.clear()
        this.#vaoMap.clear()
        this.#textureMap.clear()

        this.initGl()

        this.particles.onContextLost()
    }


    /** @type {GlUbo} */ #cameraUbo
    /** @type {Float32Array} */ #cameraUboF32a

    initGl() {
        const canvas = document.createElement('canvas')
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.addEventListener("webglcontextlost", this.onContextLost.bind(this))

        this.htmlElement.innerHTML = ''
        this.htmlElement.appendChild(canvas)

        this.glContext = new GlContext(canvas)

        this.glContext.resizeListeners.add(this.onResize.bind(this))

        this.#cameraUbo = new GlUbo(this.glContext.gl, (16 + 16 + 16 + 16 + 4 + 4) * 4)
        this.#cameraUboF32a = new Float32Array(this.#cameraUbo.data)

        this.pointLightsRenderer = new PointLightsRenderer(this.glContext.gl)
        this.pointLightsRenderer.updateUbo(this.pointLights)

        this.windowInfoRenderer = new WindowInfoRenderer(this.glContext.gl)

        this.uboIndex = {
            cameraUbo: this.#cameraUbo.index,
            pointLightsUBO: this.pointLightsRenderer.uboIndex,
            windowUbo: this.windowInfoRenderer.uboIndex
        }

        if (!this.particles) this.particles = new ParticleRenderer()
        this.particles.initGl(this.glContext.gl, this.uboIndex, this.getGlTexture(this.depthTexture), this)

        if (!this.skyBoxRenderer) this.skyBoxRenderer = new SkyBoxRenderer()
        this.skyBoxRenderer.initGl(this.glContext.gl, this.uboIndex)
    }

    onResize(width, height) {
        this.camera.aspect = width / height
        this.windowInfoRenderer.setSize(width, height)
        this.getGlTexture(this.depthTexture).updateSize(width, height)
    }

    /** @type {Map<Material, GlProgram>} */
    #programMap = new Map()
    #disposeGlPrograms() {
        for (const program of Object.values(this.#programMap)) program.dispose()
        this.#programMap.clear()
    }

    /** @type {Map<Geometry, GlVao>} */
    #vaoMap = new Map()
    #disposeGlVaos() {
        for (const vao of Object.values(this.#vaoMap)) vao.dispose()
        this.#vaoMap.clear()
    }

    /** @type {Map<Texture, GlTexture>} */
    #textureMap = new Map()

    #deleteToBeDeleted() {
        for (const [material, program] of this.#programMap) {
            if (material.needsDelete) {
                program.dispose()
                this.#programMap.delete(material)
            }
        }
        for (const [geometry, vao] of this.#vaoMap) {
            if (geometry.needsDelete) {
                vao.dispose()
                this.#vaoMap.delete(geometry)
            }
        }
        for (const [texture, glTexture] of this.#textureMap) {
            if (texture.needsDelete) {
                glTexture.dispose()
                this.#textureMap.delete(texture)
            }
        }
    }

    depthTexture = new DepthTexture()

    resetGlStates() {
        this.#disposeGlPrograms()
        this.#disposeGlVaos()
        this.particles.disposeGl()
        this.particles.initGl(this.glContext.gl, this.uboIndex, this.getGlTexture(this.depthTexture), this)
        this.skyBoxRenderer.dispose()
        this.skyBoxRenderer.initGl(this.glContext.gl, this.uboIndex)
    }

    updateUbos() {
        this.scene.updateWorldMatrix()
        const cameraHasBeenUpdated = this.camera.update()
        if (cameraHasBeenUpdated) {
            let cursor = 0
            this.camera.viewMatrix.toArray(this.#cameraUboF32a, cursor)
            cursor += 16
            this.camera.projectionMatrix.toArray(this.#cameraUboF32a, cursor)
            cursor += 16
            this.camera.projectionViewMatrix.toArray(this.#cameraUboF32a, cursor)
            cursor += 16
            this.camera.projectionViewMatrixInverse.toArray(this.#cameraUboF32a, cursor)
            cursor += 16
            this.camera.position.toArray(this.#cameraUboF32a, cursor)
            cursor += 3
            this.#cameraUboF32a[cursor] = this.camera.near
            cursor += 1
            this.#cameraUboF32a[cursor] = this.camera.far

            this.#cameraUbo.update()
        }

        const lightUboHasChanged = this.pointLightsRenderer.updateUbo(this.pointLights)
        if (lightUboHasChanged) {
            this.uboIndex = {
                cameraUbo: this.#cameraUbo.index,
                pointLightsUBO: this.pointLightsRenderer.uboIndex,
                windowUbo: this.windowInfoRenderer.uboIndex
            }
            this.resetGlStates()
        }

        this.windowInfoRenderer.update()
    }

    /** @param {Node3D[]} nodesToDraw  */
    getObjectsToDraw(nodesToDraw) {
        const objectsToDraw = getObjectsInFrustum(nodesToDraw, this.camera.frustum)

        for (const object of this.scene.objects) {
            if (object.geometry.boundingBox.isEmpty() || this.camera.frustum.intersectsBox(_box3.copy(object.geometry.boundingBox))) {
                objectsToDraw.push(object)
            }
        }

        const [opaque, transparent] = sortTransparencyObjects(objectsToDraw)

        opaque.sort(this.compareObjectDrawOptimizationBound)
        transparent.sort(this.compareObjectDrawOptimizationBound)

        return [opaque, transparent]
    }

    /**
     * 
     * @param {number} deltatimeSecond 
     */
    render(deltatimeSecond) {
        this.#deleteToBeDeleted()

        const gl = this.glContext.gl
        this.updateUbos()

        this.scene.traverse((node) => { if (node instanceof SkinnedNode) node.mixer.updateTime(deltatimeSecond) })

        const nodesToDraw = getNodesInFrustum(this.scene, this.camera.frustum)

        for (const node of nodesToDraw) {
            if (node instanceof SkinnedNode) {
                node.mixer.updateBuffer()
            }
        }

        const [opaqueObjects, transparentObjects] = this.getObjectsToDraw(nodesToDraw)

        gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT)

        this.glContext.blending = false
        this.skyBoxRenderer.render()
        this.drawObjects(opaqueObjects)

        blit(gl, null, this.particles.depthFrameBuffer, this.windowInfoRenderer.width, this.windowInfoRenderer.height)
        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, null)

        this.glContext.blending = true
        this.drawObjects(transparentObjects)

        this.glContext.setAdditiveBlending()
        this.glContext.depthTest = false

        this.particles.draw(deltatimeSecond)
    }

    /**
     * 
     * @param {Object3D[]} objects 
     */
    drawObjects(objects) {
        const gl = this.glContext.gl

        let currentMaterial, program
        let currentGeometry

        for (const object of objects) {
            if (currentMaterial !== object.material) {
                if (object.material.needsDelete) {
                    console.warn('Material deleted, object not draw. You should remove 3D objects when dispose its elements.')
                    continue
                }

                currentMaterial = object.material

                if (!this.#programMap.has(currentMaterial)) {
                    this.#programMap.set(currentMaterial, new GlProgram(
                        gl,
                        currentMaterial.vertexShader({ pointLightCount: this.pointLightsRenderer.count }),
                        currentMaterial.fragmentShader({ pointLightCount: this.pointLightsRenderer.count }),
                        {
                            uboIndex: this.uboIndex
                        }
                    ))
                }

                program = this.#programMap.get(currentMaterial)
                program.useProgram()
            }

            if (currentGeometry !== object.geometry) {
                if (object.geometry.needsDelete) {
                    console.warn('Geometry deleted, object not draw. You should remove 3D objects when dispose its elements.')
                    continue
                }

                currentGeometry = object.geometry

                if (currentGeometry.attributes) {
                    if (!this.#vaoMap.has(currentGeometry)) {
                        this.#vaoMap.set(currentGeometry, program.createVao(currentGeometry.attributes, currentGeometry.indices))
                    }

                    const vao = this.#vaoMap.get(currentGeometry)
                    vao.bind()
                }
            }

            this.glContext.cullFace = object.cullFace
            this.glContext.depthTest = object.depthTest

            if (object.normalBlending) {
                this.glContext.setNormalBlending()
                this.glContext.depthWrite = false
            } else if (object.additiveBlending) {
                this.glContext.setAdditiveBlending()
                this.glContext.depthWrite = false
            } else {
                this.glContext.depthWrite = object.depthWrite
            }

            this.#bindUniforms(program, object.uniforms)

            this.#bindTextures(program, object.textures)

            if (currentGeometry.indices) {
                gl.drawElements(object.drawMode, currentGeometry.count, typedArrayToType.get(currentGeometry.indices.constructor), currentGeometry.offset)
            } else {
                gl.drawArrays(object.drawMode, currentGeometry.offset, currentGeometry.count)
            }
        }
    }

    /**
     * 
     * @param {GlProgram} program 
     * @param {{ [name: string]: WebGl.UniformData }} uniforms 
     */
    #bindUniforms(program, uniforms) {
        for (const key in uniforms) {
            program.uniformUpdate[key]?.(uniforms[key])
        }
    }

    getGlTexture(texture) {
        if (!this.#textureMap.has(texture))
            this.#textureMap.set(texture, new GlTexture({ gl: this.glContext.gl, ...texture }))
        return this.#textureMap.get(texture)
    }

    freeTexture(texture) {
        this.#textureMap.get(texture)?.dispose()
        this.#textureMap.delete(texture)
    }

    /**
     * 
     * @param {GlProgram} program 
     * @param {{[name: string]: Texture}} textures 
     */
    #bindTextures(program, textures) {
        for (const key in textures) {
            const texture = textures[key]

            if (texture.needsDelete) {
                console.warn('Texture deleted,  unknown texture is bound. You should remove 3D objects when dispose its elements.')
            }

            const glTexture = this.getGlTexture(texture)

            if (texture.needsUpdate) {
                texture.needsUpdate = false
                glTexture.updateData(texture.data, program.textureUnit[key])
            } else {
                glTexture.bindToUnit(program.textureUnit[key])
            }
        }
    }

    #lastProgramId = 0
    #programCache = new WeakMap()
    #lastVaoId = 0
    #vaoCache = new WeakMap()
    #objectState = new WeakMap()

    compareObjectDrawOptimizationBound = this.compareObjectDrawOptimization.bind(this)
    compareObjectDrawOptimization(a, b) {
        if (!this.#programCache.has(a.material)) this.#programCache.set(a.material, this.#lastProgramId++)
        if (!this.#programCache.has(b.material)) this.#programCache.set(b.material, this.#lastProgramId++)
        const materialIdA = this.#programCache.get(a.material)
        const materialIdB = this.#programCache.get(b.material)
        if (materialIdA !== materialIdB) return materialIdA - materialIdB

        if (!this.#vaoCache.has(a.geometry)) this.#vaoCache.set(a.geometry, this.#lastVaoId++)
        if (!this.#vaoCache.has(b.geometry)) this.#vaoCache.set(b.geometry, this.#lastVaoId++)
        const geometryIdA = this.#vaoCache.get(a.geometry)
        const geometryIdB = this.#vaoCache.get(b.geometry)
        if (geometryIdA !== geometryIdB) return geometryIdA - geometryIdB

        if (!this.#objectState.has(a)) this.#objectState.set(a, getObjectStateId(a))
        if (!this.#objectState.has(b)) this.#objectState.set(b, getObjectStateId(b))
        const stateIdA = this.#objectState.get(a)
        const stateIdB = this.#objectState.get(b)
        if (stateIdA !== stateIdB) return stateIdA - stateIdB

        return 0
    }

    loseContext() {
        this.glContext.gl.getExtension("WEBGL_lose_context").loseContext()
    }
}

function getObjectStateId(/** @type {Object3D} */ object) {
    let id = 0

    if (object.additiveBlending) id |= 0x0000_0001
    if (object.cullFace) id |= 0x0000_0010
    if (object.depthTest) id |= 0x0000_0100
    if (object.depthWrite) id |= 0x0000_1000

    return id
}

function sortTransparencyObjects(/** @type {Object3D[]} */ objects) {
    const opaque = []
    const transparent = []

    for (const object of objects) {
        if (object.normalBlending || object.additiveBlending) {
            transparent.push(object)
        } else {
            opaque.push(object)
        }
    }

    return [opaque, transparent]
}

function getNodesInFrustum(scene, frustum) {
    /** @type {Node3D[]} */
    const nodes = []

    scene.traverse((node) => {
        const boundingBox = node.boundingBox

        if (boundingBox.isEmpty()
            || frustum.intersectsBox(
                _box3.copy(boundingBox).translate(node.position))
        ) {
            nodes.push(node)
        }
    })

    return nodes
}

function getObjectsInFrustum(/** @type {Node3D[]} */ nodes, frustum) {
    /** @type {Object3D[]} */
    const result = []

    for (const node of nodes) {
        for (const object of node.objects) {
            const boundingBox = object.geometry.boundingBox

            if (boundingBox.isEmpty()
                || frustum.intersectsBox(
                    _box3.copy(boundingBox).translate(node.position))
            ) {
                result.push(object)
            }
        }
    }

    return result
}
