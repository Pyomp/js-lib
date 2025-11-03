import { GlTextureRGBA } from "./GlTextureRGBA.js"

function createSparkleCanvas(size = 32) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')

    if (ctx) {
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
        gradient.addColorStop(0.9, 'rgba(255, 255, 255, 0)')

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, size, size)
    }

    return canvas
}

export class GlTextureSparkle extends GlTextureRGBA {
    static default64 = new GlTextureSparkle()

    constructor(size = 64) {
        const sparkleCanvas = createSparkleCanvas(size)
        super(sparkleCanvas)
    }
}
