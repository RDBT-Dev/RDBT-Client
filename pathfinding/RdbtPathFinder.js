let { RenderUtils, MathUtils, MovementHelper, Rotations, Vec3, TimeHelper } = global.export

class rdbtPathFinder {
  constructor() {
    this.PathFinder = Java.type("com.polar.wrapper.pathfinder.PathFinder")
    this.NodeData = Java.type("com.polar.wrapper.pathfinder.NodeData")
    this.Node = Java.type("com.polar.wrapper.pathfinder.Node")
    this.BP = Java.type("net.minecraft.util.BlockPos")
    this.Double = Java.type("java.lang.Double")
    this.Boolean = Java.type("java.lang.Boolean")

    this.path = []
    this.points = []
    this.currentNode = null
    this.previousNumber = null
    this.changeNumber = 0
    this.changeIndex = 0
    this.nodeTimer = new TimeHelper()
    this.disFlat = 1.5
    this.dis = 2.5

    //register("renderWorld", () => {
    //  if (this.points.length != 0.0) RenderUtils.renderPathfindingLines(this.points)
    //})

    register("tick", () => {
      if (!this.currentNode) return
      let nextNode = this.path[this.currentNode.number + 1]
      if (this.currentNode != undefined) {
        let rangeNode = MathUtils.getDistanceToPlayer(this.currentNode.point)
        if (rangeNode.distance <= this.dis && rangeNode.distanceFlat <= this.disFlat) {
          this.currentNode = this.choseLookPoint(nextNode)
          this.nodeTimer.reset()
        }
      } else {
        this.currentNode = null
      }
    })
  }

  convertToArray(nodes) {
    let array = []
    nodes.forEach(node => {
      array.push([node.x - 0.5, node.y, node.z - 0.5])
    })
    return array
  }

  findStartNode() {
    let closest = null
    let lowest
    this.path.forEach(node => {
      let range = MathUtils.getDistanceToPlayer(node.point)
      if (!closest || range.distance < lowest) {
        closest = node
        lowest = range.distance
      }
    })
    this.currentNode = this.choseLookPoint(closest)
    this.nodeTimer.reset()
    this.previousNumber = closest.number
  }

  /**
   * @param {Node} node
   */
  choseLookPoint(node) {
    if (!node || node === undefined) return node
    if (node.number >= this.changeNumber) {
      for (let i = 10; i >= 0; i--) {
        let index = node.number + i
        let pathNode = this.path[index]
        if (pathNode != undefined) {
          node.lookPoint = [pathNode.x, pathNode.y + 1.75, pathNode.z]
          this.changeIndex = index
          break
        }
      }
      this.changeNumber = node.number + 10
      Rotations.stopRotate()
    } else {
      let pathNode = this.path[this.changeIndex]
      node.lookPoint = [pathNode.x, pathNode.y + 1.75, pathNode.z]
    }
    return node
  }

  reachedEnd() {
    return this.currentNode.number + 1 >= this.path.length
  }

  getCurrentNode() {
    return this.currentNode
  }

  timePassedSinceNodeChange() {
    return this.nodeTimer.getTimePassed()
  }

  clearPath() {
    this.path = []
    this.points = []
    this.currentNode = null
    this.changeNumber = -1
    this.changeIndex = 0
  }

  /**
   * @param {BlockPos} start
   * @param {BlockPos} end
   */
  findPath(start, end, customs = [], etherwarp = false) {
    this.clearPath()
    let startData = new this.NodeData(start.toMCBlock(), new this.Double(2.0), new this.Boolean(false))
    let endData = new this.NodeData(end.toMCBlock(), new this.Double(2.0), new this.Boolean(false))
    let pathFinder = this.addCustoms(new this.PathFinder(startData, endData), customs, etherwarp)
    this.path = this.convertToNodeArray(pathFinder.calculatePath())
    if (this.path.length === 0.0) {
      this.path = []
      return false
    }
    this.path.push(new Node(new this.Node(endData, new this.Double(2.0), new this.Double(2.0), null), this.path.length, false))
    this.findStartNode()
    this.points = this.convertToArray(this.path)
    return true
  }

  convertToNodeArray(nodes) {
    let array = []
    if (!nodes) return array
    nodes.forEach((node, index) => {
      if (node.data.isCustomNode) {
        array.push(new Node(node, index, true))
      }
      array.push(new Node(node, index, false))
    })
    return array
  }

  addCustoms(finder, array, etherwarp) {
    for (let i = 0; i < array.length / 2; i++) {
      finder.addCustomMarker(array[i * 2].toMCBlock(), array[i * 2 + 1].toMCBlock())
      if (etherwarp) finder.addCustomMarker(array[i * 2 + 1].toMCBlock(), array[i * 2].toMCBlock())
    }
    return finder
  }

  /**
   * Sets the params for when the location gets update
   * @param {Number} disFlat
   * @param {Number} dis
   */
  setParams(disFlat, dis) {
    this.disFlat = disFlat
    this.dis = dis
  }

  /**
   * resets params, dis and disFlat
   */
  resetParams() {
    this.setParams(1.5, 2.5)
  }
}

class Node {
  constructor(node, number, parent) {
    const access = parent ? "parent" : "pos"
    this.x = node.data[access].func_177958_n() + 0.5
    this.y = node.data[access].func_177956_o()
    this.z = node.data[access].func_177952_p() + 0.5
    this.point = [this.x, this.y, this.z]
    this.pos = new BlockPos(node.data[access])
    this.node = node
    this.number = number
    this.lookPoint
  }

  setLookPoint(point) {
    this.lookPoint = point
  }
}

global.export.RdbtPathFinder = new rdbtPathFinder()
