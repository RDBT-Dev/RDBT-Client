import { drawLine3d } from "BloomCore/utils/Utils"
import RenderLib from "RenderLib"

const ByteBuffer = Java.type("java.nio.ByteBuffer")
const ByteOrder = Java.type("java.nio.ByteOrder")

// Super optimized rendering (I think by Soopy?)

class BlockRenderer {
  constructor() {
    this.blockVBO = null
    this.blockIBO = null
    this.blockVBODataChanged = true
    this.vertexBuffer = null
    this.indexBuffer = null
    this.blockIndices = [0, 1, 2, 3, 4, 5, 6, 7, 0, 4, 5, 1, 2, 6, 7, 3, 1, 5, 6, 2, 3, 7, 4, 0]
    this.cubeVerticesCache = new Map()
  }

  drawNormalCubeVertices(x, y, z, size = 1) {
    const vertices = [x, y, z, x + size, y, z, x + size, y + size, z, x, y + size, z, x, y, z + size, x + size, y, z + size, x + size, y + size, z + size, x, y + size, z + size]
    return vertices
  }

  getCubeVertices(x, y, z, size = 1) {
    const cacheKey = `${x}-${y}-${z}-${size}`

    if (!this.cubeVerticesCache.has(cacheKey)) {
      this.cubeVerticesCache.set(cacheKey, this.drawNormalCubeVertices(x, y, z, size))
    }

    return this.cubeVerticesCache.get(cacheKey)
  }

  createFloatBuffer(data) {
    let buffer = ByteBuffer.allocateDirect(data.length * 4)
      .order(ByteOrder.nativeOrder())
      .asFloatBuffer()
    buffer.put(data).flip()
    return buffer
  }

  createShortBuffer(data) {
    let buffer = ByteBuffer.allocateDirect(data.length * 2)
      .order(ByteOrder.nativeOrder())
      .asShortBuffer()
    buffer.put(data).flip()
    return buffer
  }

  createIntBuffer(data) {
    let buffer = ByteBuffer.allocateDirect(data.length * 4)
      .order(ByteOrder.nativeOrder())
      .asIntBuffer()
    buffer.put(data).flip()
    return buffer
  }

  updateBlockVBO(positions) {
    if (this.blockVBO === null) {
      this.blockVBO = GL15.glGenBuffers()
    }

    if (!this.blockVBODataChanged) {
      return
    }

    const vertexData = []
    positions.forEach(position => {
      const cubeVertices = this.getCubeVertices(position[0], position[1], position[2], 1)
      for (let i = 0; i < cubeVertices.length; i++) {
        vertexData.push(cubeVertices[i])
      }
    })

    if (this.vertexBuffer === null || this.vertexBuffer.capacity() < vertexData.length) {
      this.vertexBuffer = this.createFloatBuffer(vertexData)
    } else {
      this.vertexBuffer.clear()
      this.vertexBuffer.put(vertexData).flip()
    }

    GL15.glBindBuffer(GL15.GL_ARRAY_BUFFER, this.blockVBO)
    GL15.glBufferData(GL15.GL_ARRAY_BUFFER, this.vertexBuffer, GL15.GL_STATIC_DRAW)
    GL15.glBindBuffer(GL15.GL_ARRAY_BUFFER, 0)
  }

  updateBlockIBO(positions) {
    if (this.blockIBO === null) {
      this.blockIBO = GL15.glGenBuffers()
    }

    if (!this.blockVBODataChanged) {
      return
    }

    const indices = []
    for (let i = 0; i < positions.length; i++) {
      for (let j = 0; j < 24; j++) {
        indices.push(i * 8 + this.blockIndices[j])
      }
    }

    if (this.indexBuffer === null || this.indexBuffer.capacity() < indices.length) {
      this.indexBuffer = this.createIntBuffer(indices)
    } else {
      this.indexBuffer.clear()
      this.indexBuffer.put(indices).flip()
    }

    GL15.glBindBuffer(GL15.GL_ELEMENT_ARRAY_BUFFER, this.blockIBO)
    GL15.glBufferData(GL15.GL_ELEMENT_ARRAY_BUFFER, this.indexBuffer, GL15.GL_STATIC_DRAW)
    GL15.glBindBuffer(GL15.GL_ELEMENT_ARRAY_BUFFER, 0)
  }

  drawMultipleBlocksInWorld(positions, r, g, b, a = 1, depthTest = true, filled = false, additive_blend = false) {
    if (positions.length === 0) return

    this.updateBlockVBO(positions)
    this.updateBlockIBO(positions)

    if (this.blockVBODataChanged) this.blockVBODataChanged = false
    GL11.glPushAttrib(GL11.GL_CURRENT_BIT) // Save the current OpenGL state

    GL11.glDisable(GL11.GL_CULL_FACE)
    GL11.glEnable(GL11.GL_BLEND)
    if (additive_blend) {
      GL11.glBlendFunc(GL11.GL_ONE, GL11.GL_ONE)
    } else {
      GL11.glBlendFunc(GL11.GL_SRC_ALPHA, GL11.GL_ONE_MINUS_SRC_ALPHA)
    }
    GL11.glDepthMask(false)
    GL11.glDisable(GL11.GL_TEXTURE_2D)

    if (!depthTest) GL11.glDisable(GL11.GL_DEPTH_TEST)

    GL11.glPushMatrix()

    const renderX = -Player.getRenderX()
    const renderY = -Player.getRenderY()
    const renderZ = -Player.getRenderZ()
    GL11.glTranslated(renderX, renderY, renderZ)

    GL11.glColor4f(r, g, b, a)

    GL15.glBindBuffer(GL15.GL_ARRAY_BUFFER, this.blockVBO)
    GL11.glEnableClientState(GL11.GL_VERTEX_ARRAY)
    GL11.glVertexPointer(3, GL11.GL_FLOAT, 0, 0)

    GL15.glBindBuffer(GL15.GL_ELEMENT_ARRAY_BUFFER, this.blockIBO)

    if (!filled) {
      GL11.glPolygonMode(GL11.GL_FRONT_AND_BACK, GL11.GL_LINE)
      GL11.glDrawElements(GL11.GL_QUADS, positions.length * 24, GL11.GL_UNSIGNED_INT, 0)
      GL11.glPolygonMode(GL11.GL_FRONT_AND_BACK, GL11.GL_FILL)
    } else {
      GL11.glDrawElements(GL11.GL_QUADS, positions.length * 24, GL11.GL_UNSIGNED_INT, 0)
    }

    GL11.glDisableClientState(GL11.GL_VERTEX_ARRAY)
    GL15.glBindBuffer(GL15.GL_ARRAY_BUFFER, 0)
    GL15.glBindBuffer(GL15.GL_ELEMENT_ARRAY_BUFFER, 0)

    GL11.glPopMatrix()

    if (!depthTest) GL11.glEnable(GL11.GL_DEPTH_TEST)
    GL11.glEnable(GL11.GL_TEXTURE_2D)
    GL11.glDepthMask(true)
    GL11.glDisable(GL11.GL_BLEND)
    GL11.glEnable(GL11.GL_CULL_FACE)

    // Restore all OpenGL attributes
    GL11.glPopAttrib()
  }

  drawMultipleBlocksInWorldWithNumbers(positions, r, g, b, a = 1, depthTest = true, filled = false, additive_blend = false, w = 1, h = 1) {
    this.drawMultipleBlocksInWorld(positions, r, g, b, a, depthTest, filled, additive_blend, w, h)
    for (let i = 0; i < positions.length; i++) {
      this.drawString(i + 1, positions[i], [255, 255, 255], 1, true)
    }
  }

  /**
   * @param {String} Name
   * @param {Array} Location
   * @param {Array} Color
   * @param {Number} size
   * @param {Boolean} increase
   */
  drawString(Name, Location, Color = [255, 255, 255], size = 0.3, increase = false) {
    Tessellator.drawString(Name, Location[0] + 0.5, Location[1] + 0.5, Location[2] + 0.5, Renderer.color(Color[0], Color[1], Color[2]), true, size, increase)
  }

  /**
   * @param {Array} cords
   * @param {Array} rgb
   */
  renderCords(cords, rgb = [0, 1, 0], alpha = 1, full = false) {
    for (let i = 0; i < cords.length; i++) {
      let cord = cords[i]
      if (!full) {
        RenderLib.drawEspBox(cord[0] + 0.5, cord[1], cord[2] + 0.5, 1, 1, rgb[0], rgb[1], rgb[2], alpha, true)
      } else {
        RenderLib.drawInnerEspBox(cord[0] + 0.5, cord[1], cord[2] + 0.5, 1, 1, rgb[0], rgb[1], rgb[2], alpha, true)
      }
    }
  }

  /**
   * @param {Array[]} cords
   * @param {Number} h
   * @param {Number} w
   * @param {Array<Number>} rgb
   * @param {Number} alpha
   * @param {Boolean} full
   */
  renderCubes(cords, h, w, rgb = [0, 1, 0], alpha = 1, full = false) {
    for (let i = 0; i < cords.length; i++) {
      let cord = cords[i]
      if (!full) {
        RenderLib.drawEspBox(cord[0] + 0.5, cord[1], cord[2] + 0.5, h, w, rgb[0], rgb[1], rgb[2], alpha, true)
      } else {
        RenderLib.drawInnerEspBox(cord[0] + 0.5, cord[1], cord[2] + 0.5, h, w, rgb[0], rgb[1], rgb[2], alpha, true)
      }
    }
  }

  /**
   * @param {Array} cords
   */
  renderCordsWithNumbers(cords, rgb = [0, 1, 0], alpha = 1, full = false) {
    this.renderCords(cords, rgb, alpha, full)
    for (let i = 0; i < cords.length; i++) {
      this.drawString(i + 1, cords[i], [255, 255, 255], 1, true)
    }
  }

  /**
   * @param {Array} cord
   * @param {Array} rgb
   */
  renderCube(cord, rgb = [0, 0, 1], full = false, alpha = 1.0, w = 1.0, h = 1.0) {
    if (!full) {
      RenderLib.drawEspBox(cord[0] + 0.5, cord[1], cord[2] + 0.5, w, h, rgb[0], rgb[1], rgb[2], alpha, true)
    } else {
      RenderLib.drawInnerEspBox(cord[0] + 0.5, cord[1], cord[2] + 0.5, w, h, rgb[0], rgb[1], rgb[2], alpha, true)
    }
  }

  renderLines(cords, color = [0, 0, 0], m = [0, 0, 0]) {
    let prev = null
    cords.forEach(cord => {
      if (!prev) {
        prev = cords
      }
      this.drawLine([prev[0] + m[0], prev[1] + m[1], prev[2] + m[2]], [cord[0] + m[0], cord[1] + m[1], cord[2] + m[2]], color)
      prev = cord
    })
  }

  drawLine(cords1, cords2, color = [0, 0, 0], alpha = 1, thickness = 0.6, phase = true) {
    drawLine3d(cords1[0], cords1[1], cords1[2], cords2[0], cords2[1], cords2[2], color[0], color[1], color[2], alpha, thickness, phase)
  }

  renderPathfindingLines(cords) {
    this.renderCords(cords, [0.2, 0.47, 1], 0.2, true)
    this.renderLines(cords, [0.2, 0.47, 1], [0.5, 1.0, 0.5])
  }
}

global.export.RenderUtils = new BlockRenderer()
