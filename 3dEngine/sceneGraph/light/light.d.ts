declare interface Light {
    position: Vector3
    color: Color
    intensity: number
    needsUpdate: boolean

    // Will be used for UBO stuff, so data should be padded
    toArray: (array?: Float32Array) => Float32Array
}
