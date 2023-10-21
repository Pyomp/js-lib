/* BINARY EXTENSION */
const BINARY_EXTENSION_HEADER_MAGIC = 'glTF'
const BINARY_EXTENSION_HEADER_LENGTH = 12
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 }

const TYPE_CLASS = {
    [WebGL2RenderingContext.BYTE]: Int8Array,
    [WebGL2RenderingContext.UNSIGNED_BYTE]: Uint8Array,
    [WebGL2RenderingContext.SHORT]: Int16Array,
    [WebGL2RenderingContext.UNSIGNED_SHORT]: Uint16Array,
    [WebGL2RenderingContext.INT]: Int32Array,
    [WebGL2RenderingContext.UNSIGNED_INT]: Uint32Array,
    [WebGL2RenderingContext.FLOAT]: Float32Array
}

/**
* @param {URL | string} url 
*/
export async function loadGLTF(url) {
    const arrayBuffer = await (await fetch(url)).arrayBuffer()
    const rawGltf = getGltf(arrayBuffer)
    const gltf = parseGltf(rawGltf)
    return gltf
}

/**
 * 
 * @param {*} gltf 
 * @returns 
 */
export function parseGltf(gltf) {
    const body = gltf.body
    const content = gltf.content
    const nodes = content.nodes
    const materials = content.materials

    // accessors
    const accessors = content.accessors
    const bufferViews = content.bufferViews
    for (const accessor of accessors) {
        const bufferView = bufferViews[accessor.bufferView]
        accessor.buffer = new TYPE_CLASS[accessor.componentType](
            body.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength)
        )
        delete accessor.componentType
        delete accessor.bufferView
    }

    // animation
    if (content.animations) {
        const animations = {}
        for (const animation of content.animations) {
            const channels = animation.channels
            const samplers = animation.samplers

            const bones = {}
            for (const channel of channels) {
                const sampler = samplers[channel.sampler]

                const name = nodes[channel.target.node].name
                if (bones[name] === undefined) bones[name] = {}
                bones[name][channel.target.path] = {
                    key: accessors[sampler.input].buffer,
                    frame: accessors[sampler.output].buffer,
                    frameType: accessors[sampler.output].type,
                    interpolation: sampler.interpolation,
                }
            }

            animations[animation.name] = bones
            delete animation.samplers
        }
        content.animations = animations
    }

    // meshes
    for (const mesh of content.meshes) {
        const primitives = mesh.primitives
        for (const primitive of primitives) {
            if (primitive.material !== undefined) {
                primitive.material = materials[primitive.material]
                primitive.material.textures = {}
            }
            const attributes = primitive.attributes
            for (const key in attributes) {
                const accessorID = attributes[key]
                attributes[key] = accessors[accessorID]
            }
            primitive.indices = accessors[primitive.indices]

        }
    }

    //skins
    const skins = content.skins

    if (skins) {
        for (const skin of skins) {
            skin.animations = {}
            skin.inverseBindMatrices = accessors[skin.inverseBindMatrices]

            const joints = skin.joints.map(a => nodes[a])

            for (let i = 0; i < joints.length; i++) {
                const joint = joints[i]
                joint.id = i

                for (const animationName in content.animations) {
                    const animation = content.animations[animationName]
                    for (const boneName in animation) {
                        if (boneName === joint.name) {
                            skin.animations[animationName] = animation
                            break
                        }
                    }
                }
            }

            skin.root = joints[0]
            skin.bonesCount = joints.length
            delete skin.joints
            delete skin.name
        }
    }

    // nodes
    for (const node of nodes) {
        if (node.mesh !== undefined) node.mesh = content.meshes[node.mesh]
        if (node.children !== undefined) node.children = node.children.map(a => nodes[a])
        if (node.skin !== undefined) node.skin = skins[node.skin]
    }

    /** @type {Object.<string, GltfNode>} */
    const gltfNodes = {}

    for (const key in nodes) {
        const node = nodes[key]
        if (node.mesh) {
            gltfNodes[node.name] = node
        }
    }

    return gltfNodes
}

/**
 * 
 * @param {ArrayBuffer} arrayBuffer 
 * @returns 
 */
function getGltf(arrayBuffer) {
    const textDecoder = new TextDecoder()

    let content = null
    let body = null

    const headerView = new DataView(arrayBuffer, 0, BINARY_EXTENSION_HEADER_LENGTH)

    this.header = {
        magic: textDecoder.decode(new Uint8Array(arrayBuffer.slice(0, 4))),
        version: headerView.getUint32(4, true),
        length: headerView.getUint32(8, true)
    }

    if (this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC) {
        throw new Error('THREE.GLTFLoader: Unsupported glTF-Binary header.')
    } else if (this.header.version < 2.0) {
        throw new Error('THREE.GLTFLoader: Legacy binary file detected.')
    }

    const chunkContentsLength = this.header.length - BINARY_EXTENSION_HEADER_LENGTH

    const chunkView = new DataView(arrayBuffer, BINARY_EXTENSION_HEADER_LENGTH)
    let chunkIndex = 0

    while (chunkIndex < chunkContentsLength) {

        const chunkLength = chunkView.getUint32(chunkIndex, true)
        chunkIndex += 4

        const chunkType = chunkView.getUint32(chunkIndex, true)
        chunkIndex += 4

        if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {

            const contentArray = new Uint8Array(arrayBuffer, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength)
            content = JSON.parse(textDecoder.decode(contentArray))

        } else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {

            const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex
            body = arrayBuffer.slice(byteOffset, byteOffset + chunkLength)

        }

        // Clients must ignore chunks with unknown types.

        chunkIndex += chunkLength
    }

    if (content === null) {
        throw new Error('THREE.GLTFLoader: JSON content not found.')
    }

    return { content, body }
}
