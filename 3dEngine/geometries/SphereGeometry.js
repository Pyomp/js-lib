export class SphereGeometry {
    constructor() {

    }
}

function sphere_vert_total(segments, rings) {
    return segments * (rings - 1) + 2
}

/**
 * Also calculate vertex normals here, since the calculation is trivial, and it allows avoiding the
 * calculation later, if it's necessary. The vertex normals are just the normalized positions.
 */
function calculate_sphere_vertex_data(
    positions,
    vert_normals,
    radius,
    segments,
    rings) {
    const delta_theta = Math.PI / rings
    const delta_phi = (2 * Math.PI) / segments

    const segment_cosines = []
    const segment_sines = []
    for (let segment = 0; segment < segments; segment++) {
        const phi = segment * delta_phi
        segment_cosines.push(Math.cos(phi))
        segment_sines.push(Math.sin(phi))

    }

    const position = []
    const normals = []
    position.push(0, 0, radius)
    normals.push(0, 0, 1)

    for (let ring = 0; ring < rings; ring++) {
        const theta = ring * delta_theta
        const sin_theta = Math.sin(theta)
        const z = Math.cos(theta)

        for (let segment = 0; segment < segments; segment++) {
            const x = sin_theta * segment_cosines[segment]
            const y = sin_theta * segment_sines[segment]
            positions.push(x * radius, y * radius, z * radius)
            normals.push(x, y, z)
        }
    }
}
