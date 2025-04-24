declare type GltfPrimitive = {
  attributes: GltfAttributes;
  indices?: { // GltfBuffer without Float32Array
    buffer: Uint8Array | Uint16Array | Uint32Array;
    count: number;
    type: "SCALAR" | "VEC2" | "VEC3" | "VEC4" | "MAT2" | "MAT3" | "MAT4";
    min?: number;
    max?: number;
  };
  material?: GltfMaterial;
};

declare type GltfNode = {
  name?: string;
  mesh?: GltfMesh;
  skin?: GltfSkin;
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
  morph?: GltfKeyFrame
};

declare type GltfAttributes = {
  JOINTS_0?: GltfBuffer<Uint8Array>;
  NORMAL?: GltfBuffer<Float32Array>;
  TANGENT?: GltfBuffer<Float32Array>;
  POSITION?: GltfBuffer<Float32Array>;
  TEXCOORD_0?: GltfBuffer<Float32Array>;
  WEIGHTS_0?: GltfBuffer<Float32Array>;
  [k: `POSITION_TARGET_${string}`]: GltfBuffer<Float32Array>;
  [k: `NORMAL_TARGET_${string}`]: GltfBuffer<Float32Array>;
};

declare type GltfBuffer<T extends Uint8Array | Uint16Array | Uint32Array | Float32Array> = {
  buffer: T;
  count: number;
  type: "SCALAR" | "VEC2" | "VEC3" | "VEC4" | "MAT2" | "MAT3" | "MAT4";
  min?: number;
  max?: number;
};

declare type GltfMaterial = {
  name?: string;
  alphaMode?: "OPAQUE" | "BLEND" | "MASK";
  alphaCutoff?: number;
  emissiveFactor?: [number, number, number];
  doubleSided?: boolean;
  extensions?: GltfMaterialExtensions;
  pbrMetallicRoughness?: GltfPbrMetallicRoughness;
};

declare type GltfMesh = {
  extras?: {
    targetNames?: string[]
  }
  name?: string;
  primitives: [GltfPrimitive];
};

declare type GltfAnimation = { [boneName: string]: GltfBoneAnimation };
declare type GltfBoneAnimations = { [animationName: string]: GltfBoneAnimation };
declare type GltfSkin = {
  name?: string;
  inverseBindMatrices?: GltfBuffer;
  animations?: GltfBoneAnimations;
  rootBones: GltfBone[];
  bonesCount: number;
};

declare type GltfMaterialExtensions = {
  KHR_materials_unlit?: {};
};

declare type GltfImage = {
  uri?: string;
  mimeType?: string;
  htmlImageElement?: HTMLImageElement // not standard to GLTF
  buffer?: GltfBuffer;
  name?: string;
  type?: "PNG" | "JPG" | "SVG";
};

declare type GltfSampler = {
  magFilter?: 9728 | 9729; // NEAREST | LINEAR
  minFilter?: 9728 | 9729; // NEAREST | LINEAR
  wrapS?: 9728 | 9729 | 9984 | 9985 | 9986 | 9987; // NEAREST | LINEAR | NEAREST_MIPMAP_NEAREST | LINEAR_MIPMAP_NEAREST | NEAREST_MIPMAP_LINEAR | LINEAR_MIPMAP_LINEAR
  wrapT?: 9728 | 9729 | 9984 | 9985 | 9986 | 9987; // NEAREST | LINEAR | NEAREST_MIPMAP_NEAREST | LINEAR_MIPMAP_NEAREST | NEAREST_MIPMAP_LINEAR | LINEAR_MIPMAP_LINEAR
  name?: string;
};

declare type GltfTexture = {
  sampler: GltfSampler;
  source: GltfImage;
  name?: string;
  texCoord?: number; // The set index of texture’s TEXCOORD attribute used for texture coordinate mapping.
};

declare type GltfPbrMetallicRoughness = {
  baseColorFactor?: [number, number, number, number];
  baseColorTexture?: GltfTexture;
  metallicFactor?: number;
  roughnessFactor?: number;
  metallicRoughnessTexture?: GltfTexture;
};

declare type GltfBoneAnimation = {
  translation?: GltfKeyFrame;
  rotation?: GltfKeyFrame;
  scale?: GltfKeyFrame;
};

declare type GltfBone = {
  id: number;
  name: string;
  children?: [GltfBone];
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
  extras?: any
};

declare type GltfKeyFrame = {
  key: GltfBuffer<Float32Array>;
  frame: GltfBuffer<Float32Array>;
  interpolation: "LINEAR" | "STEP" | "CUBICSPLINE";
};
