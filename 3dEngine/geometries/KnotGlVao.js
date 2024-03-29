import { Vector3 } from "../../math/Vector3.js"
import { GLSL_COMMON } from "../programs/chunks/glslCommon.js"
import { GlArrayBuffer } from "../webgl/glDescriptors/GlArrayBuffer.js"
import { GlAttribute } from "../webgl/glDescriptors/GlAttribute.js"
import { GlVao } from "../webgl/glDescriptors/GlVao.js"

export class KnotGlVoa extends GlVao {
    constructor(radius = 1, tube = 0.4, tubularSegments = 64, radialSegments = 8, p = 2, q = 3) {
        tubularSegments = Math.floor(tubularSegments)
        radialSegments = Math.floor(radialSegments)

        // buffers

        const indices = []
        const vertices = []
        const normals = []
        const uvs = []

        // helper variables

        const vertex = new Vector3()
        const normal = new Vector3()

        const P1 = new Vector3()
        const P2 = new Vector3()

        const B = new Vector3()
        const T = new Vector3()
        const N = new Vector3()

        // generate vertices, normals and uvs

        for (let i = 0; i <= tubularSegments; ++i) {

            // the radian "u" is used to calculate the position on the torus curve of the current tubular segment

            const u = i / tubularSegments * p * Math.PI * 2

            // now we calculate two points. P1 is our current position on the curve, P2 is a little farther ahead.
            // these points are used to create a special "coordinate space", which is necessary to calculate the correct vertex positions

            // this function calculates the current position on the torus curve

            function calculatePositionOnCurve(u, p, q, radius, position) {

                const cu = Math.cos(u)
                const su = Math.sin(u)
                const quOverP = q / p * u
                const cs = Math.cos(quOverP)

                position.x = radius * (2 + cs) * 0.5 * cu
                position.y = radius * (2 + cs) * su * 0.5
                position.z = radius * Math.sin(quOverP) * 0.5

            }

            calculatePositionOnCurve(u, p, q, radius, P1)
            calculatePositionOnCurve(u + 0.01, p, q, radius, P2)

            // calculate orthonormal basis

            T.subVectors(P2, P1)
            N.addVectors(P2, P1)
            B.crossVectors(T, N)
            N.crossVectors(B, T)

            // normalize B, N. T can be ignored, we don't use it

            B.normalize()
            N.normalize()

            for (let j = 0; j <= radialSegments; ++j) {

                // now calculate the vertices. they are nothing more than an extrusion of the torus curve.
                // because we extrude a shape in the xy-plane, there is no need to calculate a z-value.

                const v = j / radialSegments * Math.PI * 2
                const cx = - tube * Math.cos(v)
                const cy = tube * Math.sin(v)

                // now calculate the final vertex position.
                // first we orient the extrusion with our basis vectors, then we add it to the current position on the curve

                vertex.x = P1.x + (cx * N.x + cy * B.x)
                vertex.y = P1.y + (cx * N.y + cy * B.y)
                vertex.z = P1.z + (cx * N.z + cy * B.z)

                vertices.push(vertex.x, vertex.y, vertex.z)

                // normal (P1 is always the center/origin of the extrusion, thus we can use it to calculate the normal)

                normal.subVectors(vertex, P1).normalize()

                normals.push(normal.x, normal.y, normal.z)

                // uv

                uvs.push(i / tubularSegments)
                uvs.push(j / radialSegments)

            }

        }

        // generate indices

        for (let j = 1; j <= tubularSegments; j++) {

            for (let i = 1; i <= radialSegments; i++) {

                // indices

                const a = (radialSegments + 1) * (j - 1) + (i - 1)
                const b = (radialSegments + 1) * j + (i - 1)
                const c = (radialSegments + 1) * j + i
                const d = (radialSegments + 1) * (j - 1) + i

                // faces

                indices.push(a, b, d)
                indices.push(b, c, d)

            }

        }

        super(
            [
                new GlAttribute({
                    name: GLSL_COMMON.positionAttribute,
                    size: 3,
                    glArrayBuffer: new GlArrayBuffer(new Float32Array(vertices))
                }),
                new GlAttribute({
                    name: GLSL_COMMON.normalAttribute,
                    size: 3,
                    glArrayBuffer: new GlArrayBuffer(new Float32Array(normals))
                }),
                new GlAttribute({
                    name: GLSL_COMMON.uvAttribute,
                    size: 2,
                    glArrayBuffer: new GlArrayBuffer(new Float32Array(uvs))
                })
            ],
            new Uint16Array(indices)
        )
    }
}
