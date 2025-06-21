let { TimeHelper, Vec3,  chat, RenderUtils } = global.export

class Node {
  /**
   * @param {BlockPos} pos
   */
  constructor(pos, distance) {
    this.pos = pos
    this.id = pos.hashCode()
    this.fCost = 0
    this.gCost = 0
    this.hCost = 0
    this.parent = null
    this.distance = distance
  }

  setFCost() {
    this.fCost = this.gCost + this.hCost
  }
}

class GridWorld {
  constructor() {
    this.heightCost = 2
  }

  /**
   * @param {BlockPos} pos
   */
  NodeFromWorld(pos) {
    return new Node(pos)
  }

  /**
   * @param {Node} node
   * @returns {Object}
   */
  getNeighbours(node) {
    let Neighbours = []
    let Position = node.pos
    Neighbours.push(new Node(Position.add(new Vec3i(1, 0, 0)), 2))
    Neighbours.push(new Node(Position.add(new Vec3i(-1, 0, 0)), 2))
    Neighbours.push(new Node(Position.add(new Vec3i(0, 0, 1)), 2))
    Neighbours.push(new Node(Position.add(new Vec3i(0, 0, -1)), 2))

    Neighbours.push(new Node(Position.add(new Vec3i(1, -1, 0)), this.heightCost))
    Neighbours.push(new Node(Position.add(new Vec3i(-1, -1, 0)), this.heightCost))
    Neighbours.push(new Node(Position.add(new Vec3i(0, -1, 1)), this.heightCost))
    Neighbours.push(new Node(Position.add(new Vec3i(0, -1, -1)), this.heightCost))

    Neighbours.push(new Node(Position.add(new Vec3i(1, 1, 0)), this.heightCost))
    Neighbours.push(new Node(Position.add(new Vec3i(-1, 1, 0)), this.heightCost))
    Neighbours.push(new Node(Position.add(new Vec3i(0, 1, 1)), this.heightCost))
    Neighbours.push(new Node(Position.add(new Vec3i(0, 1, -1)), this.heightCost))

    return Neighbours
  }

  isAir(pos) {
    return World.getBlockAt(pos).type.getID() === 0
  }
}
let Grid = new GridWorld()

class PathFinderClass {
  constructor() {
    this.cached = new Map()
    this.calculating = false
    this.maxCalculationTime = 500
    this.smallArea = false
    this.heightDifference = true
  }

  /**
   * @param {BlockPos} begin
   * @param {BlockPos} target
   */
  aStar(target, smoothing = true, heightCost = 2, begin = undefined, smallArea = false) {
    if (target === undefined || !target) return undefined
    this.smallArea = smallArea
    let beginNode = begin
    let targetNode = target
    if (beginNode === undefined) beginNode = this.getPlayerNode()
    if (beginNode === undefined) return undefined
    Grid.heightCost = heightCost
    const startNode = Grid.NodeFromWorld(beginNode)
    const endNode = Grid.NodeFromWorld(targetNode)
    const openSet = new Map()
    const closedSet = new Map()
    openSet.set(startNode.id, startNode)
    this.cached = new Map()
    let MaxTime = new TimeHelper()
    let TimePast = new TimeHelper()
    while (openSet.size > 0 && !MaxTime.hasReached(this.maxCalculationTime)) {
      let current = null
      openSet.forEach(node => {
        if (!current) current = node
        else if (node.fCost < current.fCost || (node.fCost === current.fCost && node.hCost < current.hCost)) current = node
      })

      if (!current) return undefined

      openSet.delete(current.id)
      closedSet.set(current.id, current)

      if (current.id === endNode.id) {
        chat.debugMessage("Generation took " + TimePast.getTimePassed())
        chat.debugMessage("The path length is: " + path.length)
        chat.debugMessage("The closest set length is: " + closedSet.size)
        return this.smoothPath(this.structurePath(startNode, current), target, smoothing)
      }
      Grid.getNeighbours(current).forEach(Node => {
        if (closedSet.has(Node.id)) {
          return
        }
        if (!this.validNode(Node)) {
          return
        }
        let newGCost = current.gCost + Node.distance + this.getPenalty(Node.pos)
        if (newGCost < Node.gCost || !openSet.has(Node.id)) {
          Node.hCost = this.getDistance(Node, endNode)
          Node.gCost = newGCost
          Node.setFCost()
          Node.parent = current
          openSet.set(Node.id, Node)
        }
      })
    }
    return []
  }

  validNode(node) {
    let pos = node.pos
    if (!World.getBlockAt(pos).type.mcBlock.func_149688_o().func_76230_c()) {
      return false
    }
    if (World.getBlockAt(pos).type.getID() === 85) {
      return false
    }
    let pos1 = pos.add(new Vec3i(0, 1, 0))
    let pos2 = pos.add(new Vec3i(0, 2, 0))
    let pos3 = pos.add(new Vec3i(0, 3, 0))
    let node1BB = World.getBlockAt(pos1).type.mcBlock.func_180640_a(World.getWorld(), pos1.toMCBlock(), World.getBlockStateAt(pos1))
    let node2BB = World.getBlockAt(pos2).type.mcBlock.func_180640_a(World.getWorld(), pos2.toMCBlock(), World.getBlockStateAt(pos2))
    let node3BB = World.getBlockAt(pos3).type.mcBlock.func_180640_a(World.getWorld(), pos3.toMCBlock(), World.getBlockStateAt(pos3))
    let allBB = 0
    if (node1BB) {
      allBB += node1BB.field_72337_e - node1BB.field_72338_b
    }
    if (node2BB) {
      allBB += node2BB.field_72337_e - node2BB.field_72338_b
    }
    if (node3BB && !this.smallArea) {
      allBB += node3BB.field_72337_e - node3BB.field_72338_b
    }
    if (allBB > 0.6) {
      return false
    }
    return true
  }

  structurePath(startNode, endNode) {
    let path = []
    let currentNode = endNode
    while (currentNode.id != startNode.id) {
      path.unshift(currentNode)
      currentNode = currentNode.parent
    }
    return path
  }

  /**
   * @param {Array<Node>} path
   * @param {BlockPos} endPos
   */
  smoothPath(path, endPos, smoothing = true) {
    let currentNode = null
    let smoothedPath = []
    path.forEach((node, index) => {
      if (!currentNode) {
        currentNode = node
        smoothedPath.push(currentNode)
        return
      }
      if (!smoothing) {
        smoothedPath.push(node)
        return
      }
      if (!this.canSeeNode(currentNode, node)) {
        currentNode = node
        smoothedPath.push(path[index - 1])
      }
    })

    let arrayPath = []
    smoothedPath.forEach(point => {
      arrayPath.push([point.pos.x, point.pos.y, point.pos.z])
    })
    arrayPath.push([endPos.x, endPos.y, endPos.z])
    return arrayPath
  }

  canSeeNode(Node1, Node2) {
    if (Math.abs(Node1.pos.y - Node2.pos.y) > 1 || Math.abs(Node1.pos.x - Node2.pos.x) > 12 || Math.abs(Node1.pos.z - Node2.pos.z) > 12) return false
    let Vector1 = new Vec3(Node1.pos.x + 0.5, Node1.pos.y + 1.05, Node1.pos.z + 0.5)
    let Vector2 = new Vec3(Node2.pos.x + 0.5, Node2.pos.y + 1, Node2.pos.z + 0.5)
    let castResult = World.getWorld().func_72933_a(Vector1, Vector2)
    if (!castResult) {
      return true
    }
    return false
  }

  /**
   * @param {BlockPos} pos
   */
  getPenalty(pos) {
    let penalty = 0
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        if (World.getBlockAt(pos.add(new Vec3i(x, 1, z))).type.getID() != 0) {
          penalty += 2
        }
      }
    }
    return penalty
  }

  /**
   * @param {Node} Node1
   * @param {Node} Node2
   * @returns {Number}
   */
  getDistance(Node1, Node2) {
    if (!this.cached.has(Node1.id)) {
      let dx = Math.abs(Node1.pos.x - Node2.pos.x)
      let dy = Math.abs(Node1.pos.y - Node2.pos.y)
      let dz = Math.abs(Node1.pos.z - Node2.pos.z)
      this.cached.set(Node1.id, dx + dy + dz + Math.max(dx, dy, dz))
    }
    return this.cached.get(Node1.id)
  }

  getPlayerNode() {
    let playerABB = Player.getPlayer().func_174813_aQ()
    let positions = [
      new BlockPos(playerABB.field_72340_a, playerABB.field_72338_b, playerABB.field_72339_c),
      new BlockPos(playerABB.field_72340_a, playerABB.field_72338_b, playerABB.field_72334_f),
      new BlockPos(playerABB.field_72336_d, playerABB.field_72338_b, playerABB.field_72339_c),
      new BlockPos(playerABB.field_72336_d, playerABB.field_72338_b, playerABB.field_72334_f),
    ]
    for (let i = 0; i < positions.length; i++) {
      let pos = positions[i]
      if (World.getBlockAt(pos).type.getID() != 0.0 && World.getBlockAt(pos.add(new Vec3i(0, 1, 0))).type.getID() === 0.0 && World.getBlockAt(pos.add(new Vec3i(0, 2, 0))).type.getID() === 0.0) {
        return pos
      }
    }
    for (let i = 0; i < positions.length; i++) {
      for (let y = 0; y >= -10; y--) {
        let pos = positions[i].add(new Vec3i(0, y, 0))
        if (World.getBlockAt(pos).type.getID() != 0.0 && World.getBlockAt(pos.add(new Vec3i(0, 1, 0))).type.getID() === 0.0 && World.getBlockAt(pos.add(new Vec3i(0, 2, 0))).type.getID() === 0.0) {
          return pos
        }
      }
    }
    return undefined
  }

  /**
   * @param {BlockPos} pos
   */
  getNearNode(pos) {
    for (let y = 0; y >= -3; y--) {
      let newPos = pos.add(new Vec3i(0, y, 0))
      let id = World.getBlockAt(newPos).type.getID()
      if (id === 171 || id === 397 || id === 144) return newPos
      if (id != 0) {
        return newPos
      }
    }
    return undefined
  }

  setMaxCalculationTime(time) {
    this.maxCalculationTime = time
  }
}

global.export.aStarRdbt = new PathFinderClass()
