declare type GltfPrimitive = {
  attributes: GltfAttributes;
  indices?: GltfBuffer;
  material?: GltfMaterial;
};

declare type GltfNode = {
  name?: string;
  mesh?: GltfMesh;
  skin?: GltfSkin;
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
};

declare type GltfAttributes = {
  JOINTS_0?: GltfBuffer;
  NORMAL?: GltfBuffer;
  POSITION?: GltfBuffer;
  TEXCOORD_0?: GltfBuffer;
  WEIGHTS_0?: GltfBuffer;
};

declare type GltfBuffer = {
  buffer: Uint8Array | Uint16Array | Uint32Array | Float32Array;
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
  name?: string;
  primitives: [GltfPrimitive];
};

declare type GltfAnimation = { [boneName: string]: GltfBoneAnimation };
declare type GltfAnimations = { [animationName: string]: GltfAnimation };
declare type GltfSkin = {
  name?: string;
  inverseBindMatrices?: GltfBuffer;
  animations?: GltfAnimations;
  root: GltfBone;
  bonesCount: number;
};

declare type GltfMaterialExtensions = {
  KHR_materials_unlit?: {};
};

declare type GltfImage = {
  uri?: string;
  mimeType?: string;
  image?: HTMLImageElement | Image | ImageBitmap // not standard to GLTF
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
  source: HTMLImageElement;
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
};

declare type GltfKeyFrame = {
  key: Float32Array;
  frame: Float32Array;
  frameType: string;
  interpolation: "LINEAR" | "STEP" | "CUBICSPLINE";
};