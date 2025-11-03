declare namespace WebGl {
  type RenderingContext = import('../glRenderer/GlRenderer').GlRenderer;

  type UniformData = number | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4 | Color

  namespace FrameBuffer {
    type Attachment = 'COLOR_ATTACHMENT0' | 'DEPTH_ATTACHMENT' | 'STENCIL_ATTACHMENT' | 'DEPTH_STENCIL_ATTACHMENT' | 'COLOR_ATTACHMENT1' | 'COLOR_ATTACHMENT2' | 'COLOR_ATTACHMENT3' | 'COLOR_ATTACHMENT4' | 'COLOR_ATTACHMENT5' | 'COLOR_ATTACHMENT6' | 'COLOR_ATTACHMENT7' | 'COLOR_ATTACHMENT8' | 'COLOR_ATTACHMENT9' | 'COLOR_ATTACHMENT10' | 'COLOR_ATTACHMENT11' | 'COLOR_ATTACHMENT12' | 'COLOR_ATTACHMENT13' | 'COLOR_ATTACHMENT14' | 'COLOR_ATTACHMENT15'

    type Mask = 'COLOR_BUFFER_BIT' | 'DEPTH_BUFFER_BIT' | 'STENCIL_BUFFER_BIT'

    type Filter = 'LINEAR' | 'NEAREST'
  }

  namespace Texture {
    type Target = 'TEXTURE_2D' | 'TEXTURE_CUBE_MAP_POSITIVE_X' | 'TEXTURE_CUBE_MAP_NEGATIVE_X' | 'TEXTURE_CUBE_MAP_POSITIVE_Y' | 'TEXTURE_CUBE_MAP_NEGATIVE_Y' | 'TEXTURE_CUBE_MAP_POSITIVE_Z' | 'TEXTURE_CUBE_MAP_NEGATIVE_Z'

    type Wrap = 'CLAMP_TO_EDGE' | 'REPEAT' | 'MIRRORED_REPEAT'

    type MinFilter = 'LINEAR' | 'NEAREST' | 'NEAREST_MIPMAP_NEAREST' | 'LINEAR_MIPMAP_NEAREST' | 'NEAREST_MIPMAP_LINEAR' | 'LINEAR_MIPMAP_LINEAR'

    type MagFilter = 'LINEAR' | 'NEAREST'

    type InternalFormat = 'DEPTH_COMPONENT24' | 'DEPTH_COMPONENT16' | 'ALPHA' | 'RGB' | 'RGBA' | 'LUMINANCE' | 'LUMINANCE_ALPHA' | 'DEPTH_COMPONENT' | 'DEPTH_STENCIL' | 'R8' | 'R16F' | 'R32F' | 'R8UI' | 'RG8' | 'RG16F' | 'RG32F' | 'RG8UI' | 'RG16UI' | 'RG32UI' | 'RGB8' | 'SRGB8' | 'RGB565' | 'R11F_G11F_B10F' | 'RGB9_E5' | 'RGB16F' | 'RGB32F' | 'RGB8UI' | 'RGBA8' | 'SRGB8_APLHA8' | 'RGB5_A1' | 'RGB10_A2' | 'RGBA4' | 'RGBA16F' | 'RGBA32F' | 'RGBA8UI' | 'DEPTH24_STENCIL8' | 'RGBA32I'

    type Format = 'DEPTH_COMPONENT' | 'RGB' | 'RGBA' | 'LUMINANCE_ALPHA' | 'LUMINANCE' | 'ALPHA' | 'RED' | 'RED_INTEGER' | 'RG' | 'RG_INTEGER' | 'RGB_INTEGER' | 'RGBA_INTEGER' | 'DEPTH_STENCIL'

    type Type = 'UNSIGNED_INT' | 'UNSIGNED_SHORT' | 'UNSIGNED_BYTE' | 'UNSIGNED_SHORT_5_6_5' | 'UNSIGNED_SHORT_4_4_4_4' | 'UNSIGNED_SHORT_5_5_5_1' | 'HALF_FLOAT' | 'FLOAT' | 'UNSIGNED_INT_10F_11F_11F_REV' | 'HALF_FLOAT' | 'UNSIGNED_INT_2_10_10_10_REV' | 'UNSIGNED_INT_24_8' | 'INT'

    type Pixels = Uint8Array | Uint8ClampedArray | Uint16Array | Float32Array | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap
  }

  namespace Vao {
    type Type = 'BYTE' | 'SHORT' | 'UNSIGNED_BYTE' | 'UNSIGNED_SHORT' | 'FLOAT'

    type Usage = 'STATIC_DRAW' | 'DYNAMIC_DRAW' | 'STREAM_DRAW' | 'STATIC_READ' | 'DYNAMIC_READ' | 'STREAM_READ' | 'STATIC_COPY' | 'DYNAMIC_COPY' | 'STREAM_COPY'
  }

  namespace Attribute {
    type data = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array
    type usage = Vao.Usage
  }

  namespace Render {
    type DrawMode = 'POINTS' | 'LINE_STRIP' | 'LINE_LOOP' | 'LINES' | 'TRIANGLE_STRIP' | 'TRIANGLE_FAN' | 'TRIANGLES'
    type DepthFunc = 'NEVER' | 'LESS' | 'EQUAL' | 'LEQUAL' | 'GREATER' | 'NOTEQUAL' | 'GEQUAL' | 'ALWAYS'
  }
}
