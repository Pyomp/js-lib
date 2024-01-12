declare type Attribute = import("./Attribute.js").Attribute;
declare type Scene = import("./Scene.js").Scene;
declare type Node3D = import("./Node3D.js").Node3D;
declare type Object3D = import("./Object3D.js").Object3D;
declare type Geometry = import("../webgl/glDescriptors/GlVaoData.js").Geometry;
declare interface Material {
    needsDelete: bool
    vertexShader(...args): string
    fragmentShader(...args): string
    createUniforms(...args): { [name: string]: WebGl.UniformData }
    createTextures(...args): { [name: string]: GlTextureData }
    createGeometry(...args): Geometry
}
declare interface MaterialGltf implements Material{
    createUniformsFromGltf?(...args): { [name: string]: WebGl.UniformData }
    createTexturesFromGltf?(...args): { [name: string]: GlTextureData }
    createGeometryFromGltf?(...args): Geometry
}

declare type Camera = import("./Camera.js").Camera;
