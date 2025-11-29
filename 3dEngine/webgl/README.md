# WebGL 3D Engine

This directory contains the core components for rendering 3D graphics using WebGL. The structure is organized into several key areas:

## Directory Structure

- **glContext/**: Contains classes and utilities for managing the WebGL context and rendering pipeline.
  - `GlArrayBufferRenderer.js`: Handles rendering of array buffers.
  - `GlCapabilitiesRenderer.js`: Manages and reports on WebGL capabilities.
  - `GlContextRenderer.js`: Responsible for rendering the WebGL context.
  - `GlFrameBufferRenderer.js`: Manages frame buffer rendering.
  - `GlInfosRenderer.js`: Provides information about the WebGL context.
  - `GlProgramRenderer.js`: Manages shader programs.
  - `GlTextureRenderer.js`: Handles texture rendering.
  - `GlTransformFeedbackRenderer.js`: Manages transform feedback.
  - `GlUboRenderer.js`: Handles uniform buffer objects.
  - `GlVaoRenderer.js`: Manages vertex array objects.
  - `types.d.ts`: Type definitions for TypeScript support.
  - `utils.js`: Utility functions for WebGL operations.

- **glDescriptors/**: Contains classes that describe various WebGL objects and their properties.
  - `GlArrayBuffer.js`: Represents an array buffer.
  - `GlAttribute.js`: Represents attributes in shaders.
  - `GlFrameBuffer.js`: Represents frame buffers.
  - `GlObject.js`: Base class for all WebGL objects.
  - `GlProgram.js`: Represents shader programs.
  - `GlTexture.js`: Represents textures.
  - `GlTransformFeedback.js`: Represents transform feedback objects.
  - `GlUbo.js`: Represents uniform buffer objects.
  - `GlVao.js`: Represents vertex array objects.
  - **__tests__/**: Contains unit tests for the descriptors.

- **glRenderer/**: Contains classes responsible for rendering various aspects of the scene.
  - `GlAmbientLightRenderer.js`: Manages ambient light rendering.
  - `GlCameraUbo.js`: Handles camera uniform buffer objects.
  - `GlForceUbo.js`: Manages force uniform buffer objects.
  - `GlPointLightRenderer.js`: Manages point light rendering.
  - `GlRenderer.js`: The main renderer class.
  - `GlWindowInfo.js`: Provides information about the rendering window.
  - `OpaqueLightingPostprocessingObject.js`: Handles post-processing for opaque lighting.

## Usage

To use the components in this directory, you should import the necessary classes into your main application file. Ensure that you have a valid WebGL context set up before attempting to render any objects.

### Example
```javascript
import { GlRenderer } from './glRenderer/GlRenderer';

const renderer = new GlRenderer();
// Initialize and use the renderer
```

## Mindset

The mindset behind this structure is to create a modular and reusable set of components that can be easily integrated into various WebGL applications. Each component is designed to handle a specific aspect of rendering, allowing for better organization and maintainability of the codebase.

Feel free to explore the individual files for more detailed documentation and examples of how to use each component effectively.

## Developer's Guide

If you want to add or modify features in this 3D engine, follow these guidelines:

### Architecture Principles

1. **Separation of Concerns**
   - Descriptors (`glDescriptors/`) define the structure and properties of WebGL objects
   - Renderers (`glContext/`) handle the actual WebGL operations
   - Scene components (`glRenderer/`) manage high-level rendering features

### Adding New Features

1. **Adding a New WebGL Object Type**
   - Create a descriptor class in `glDescriptors/` extending `GlObject`
   - Create a corresponding renderer in `glContext/` to handle WebGL operations
   - Add unit tests in `glDescriptors/__tests__/`

2. **Adding a New Rendering Feature**
   - Create a new renderer class in `glRenderer/` 
   - Follow the pattern of existing renderers like `GlPointLightRenderer`
   - Use the established UBO system for uniform data management

3. **Extending Existing Components**
   - When adding methods to existing classes, ensure they follow the established patterns
   - Keep render-specific logic in renderer classes
   - Keep object definitions and properties in descriptor classes
