import Skyblock from "BloomCore/Skyblock"
let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection
let { chat, MiningUtils, Rotations, Vec3, overlayManager, RaytraceUtils, ItemUtils, NumberUtils, MiningBot, OreMacro, registerEventSB, MouseUtils, MovementHelper, RenderUtils, TimeHelper, MathUtils, Utils } = global.export

global.modules.push(
  new ConfigModuleClass(
    "Etherwarper",
    "Misc",
    [
      new SettingSelector("Etherwarper Route", 0, ["Custom - 1", "Custom - 2", "Custom - 3", "Custom - 4", "Custom - 5", "Custom - 6", "Custom - 7", "Custom - 8", "Custom - 9", "Custom - 10"]),
      new SettingSlider("Etherwarp Delay", 750, 0, 1000, 50),
      new SettingSlider("Start Delay", 0, 0, 15000, 500),
      new SettingToggle("Fast AOTV", false),
      new SettingSelector("Warp Location", 0, ["None", "Mines", "Forge", "End", "Crimson", "Spider", "Jerry"]),
      new SettingToggle("Start Macro After Route", false),
      new SettingSelector("Select Macro", 0, ["Ore", "MiningBot", "RouteWalker"]),
    ],
    ["/etherwarperadd/remove/clear for routes"],
  ),
)

class Etherwarper {
  constructor() {
    this.ModuleName = "Etherwarper"
    this.Enabled = false
    this.pendingInitialization = false
    this.warpLocation = "None"

    // Create Overlay
    this.OVERLAY_ID = "Etherwarper"
    overlayManager.AddOverlay(this.ModuleName, this.OVERLAY_ID)

    getKeyBind("Etherwarper", "Rdbt Client v4 - Misc", this)
    // In constructor, modify MacroStates
    this.MacroStates = {
      WAITING: 0,
      WARPING: 1,
      REAOTV: 2,
    }
    this.state = this.MacroStates.WAITING
    this.MacroActions = {
      WAITING: 0,
      SELECTINGPOINT: 1,
      LOOKINGATPOINT: 2,
      WAITINGFORPOINT: 3,
    }
    this.action = this.MacroActions.WAITING

    this.route = new Map()
    this.renderRoute = []
    this.pastName = ""
    this.targetWarp = null
    this.targetWalk = null
    this.targetWarpPoint = null

    this.etherwarp = null
    this.renderDisplay = false
    this.shouldEtherwarp = false
    this.targetPos = null

    this.reAotvPoint = null
    this.retryCount = 0

    this.teleportationTimer = new TimeHelper()
    this.lastMobTimer = new TimeHelper()
    this.lookTimer = new TimeHelper()
    this.walkTimer = new TimeHelper()
    this.reAotvTimer = new TimeHelper()

    register("tick", () => {
      if (this.Enabled) {
        // Add initialization check
        if (!this.route || !this.targetWarp || !this.targetWarp.pos) {
          return
        }

        if (this.state === this.MacroStates.WAITING) {
          this.state = this.MacroStates.WARPING
          this.action = this.MacroActions.SELECTINGPOINT
        }
        if (this.state === this.MacroStates.REAOTV) {
          let calc = MathUtils.getDistanceToPlayer(this.reAotvPoint)
          if ((calc.distance < 4.0 && calc.distanceFlat < 2.0) || this.reAotvTimer.hasReached(2000)) {
            this.state = this.MacroStates.WARPING
            this.action = this.MacroActions.SELECTINGPOINT
          }
        }
        if (this.state === this.MacroStates.WARPING) {
          MovementHelper.setKey("shift", true)
          if (this.action === this.MacroActions.SELECTINGPOINT) {
            this.teleportationTimer.reset()
            this.previousWarp = this.targetWarp

            // Check if we're at the last point
            if (
              this.renderRoute.length > 0 &&
              this.previousWarp.pos.toString() === new BlockPos(this.renderRoute[this.renderRoute.length - 1].x1, this.renderRoute[this.renderRoute.length - 1].y1, this.renderRoute[this.renderRoute.length - 1].z1).toString()
            ) {
              this.sendMacroMessage("Reached the end of route!")
              if (ModuleManager.getSetting(this.ModuleName, "Start Macro After Route")) {
                this.stopMacro()
                let macroName = ModuleManager.getSetting(this.ModuleName, "Select Macro")
                ChatLib.command("togglemodule " + macroName, true)
              } else {
                this.stopMacro()
              }
              return
            }
            this.targetWarp = this.route.get(this.targetWarp.next)
            this.action = this.MacroActions.WAITING
            let result = this.getWalkPointAndBlockPointForPos(this.previousWarp.pos, this.targetWarp.pos)
            if (result.point) {
              this.shouldEtherwarp = result.etherwarp
              this.action = this.MacroActions.WALKING
              this.walkTimer.reset()
              this.targetWalk = result.walkPoint
              this.targetWarpPoint = result.point
              this.targetPos = result.targetPos
              this.nextPos = this.route.get(this.targetWarp.next).pos
              this.retryCount = 0
              return
            }
            this.sendMacroMessage("warping debug | waypoint is inaccesible!") // this line
            this.stopMacroWarning()
          }
          if (this.action === this.MacroActions.WALKING) {
            if (this.shouldEtherwarp) ItemUtils.setItemSlot(this.etherwarp.slot)
            let distanceFlat = MathUtils.distanceToPlayer(this.targetWalk).distanceFlat
            if (distanceFlat < 0.5 || (!this.shouldEtherwarp && distanceFlat < 2.0) || this.retryCount === 1.0) {
              MovementHelper.stopMovement()
              if (!this.shouldEtherwarp || Math.abs(Player.getMotionX()) + Math.abs(Player.getMotionZ()) < 0.01 || this.retryCount === 1.0) {
                this.retryCount++
                this.action = this.MacroActions.WAITINGFORPOINT
                if (this.shouldEtherwarp) {
                  Player.setHeldItemIndex(this.etherwarp.slot)
                  let point = RaytraceUtils.getPointOnBlock(this.targetPos)
                  if (!point) {
                    this.sendMacroMessage("walking debug | waypoint is not visible!")
                    this.stopMacroWarning()
                    return
                  }
                  this.reAotvTimer.reset()
                  Rotations.rotateTo(point, 1.0)
                  Rotations.onEndRotation(() => {
                    this.teleportationTimer.reset()
                    let delay = ModuleManager.getSetting(this.ModuleName, "Etherwarp Delay")
                    if (ModuleManager.getSetting(this.ModuleName, "Fast AOTV")) {
                      Client.scheduleTask(1 + Math.floor(delay / 50), () => {
                        ItemUtils.rightClickZPH()
                      })
                    } else {
                      Client.scheduleTask(3 + Math.floor(delay / 50), () => {
                        ItemUtils.rightClickPacket()
                      })
                    }
                  })
                }
              }
              return
            }
            MovementHelper.setKey("shift", true)
            if (this.walkTimer.hasReached(2500)) {
              if (this.retryCount === 0) {
                this.retryCount++
              } else {
                this.sendMacroMessage("Unable to find a path back to the platform!")
                return this.stopMacroWarning()
              }
            }
            Rotations.rotateTo(this.targetWarpPoint)
            MovementHelper.setKeysForStraightLine(MathUtils.calculateAngles(new Vec3(this.targetWalk[0], this.targetWalk[1], this.targetWalk[2])).yaw, false)
          }
          if (this.action === this.MacroActions.WAITINGFORPOINT) {
            if (this.isOnPoint(this.targetWarpPoint)) {
              // Check if next point exists before continuing
              if (!this.route.has(this.targetWarp.next)) {
                this.sendMacroMessage("Reached the end of route!")
                this.stopMacro()
                return
              }
              this.state = this.MacroStates.WARPING
              this.action = this.MacroActions.SELECTINGPOINT
            } else if (this.teleportationTimer.hasReached(5000)) {
              this.state = this.MacroStates.WARPING
              this.action = this.MacroActions.WALKING
            }
          }
        }
      }
    })

    register("worldUnload", () => {
      if (this.Enabled && !this.pendingInitialization) this.stopMacroWarning()
    })

    register("worldLoad", () => {
      if (this.pendingInitialization) {
        this.pendingInitialization = false
        let startDelay = ModuleManager.getSetting(this.ModuleName, "Start Delay")
        let startDelayTicks = Math.floor(startDelay / 50)

        Client.scheduleTask(startDelayTicks, () => {
          this.sendMacroMessage("Starting etherwarper3")
          this.initializeMacro()
        })
      }
    })

    register("command", number => {
      this.editRoute("add", number?.toLowerCase())
    }).setName("etherwarperadd")

    register("command", number => {
      this.editRoute("remove", number?.toLowerCase())
    }).setName("etherwarperremove")

    register("command", number => {
      this.editRoute("clear")
    }).setName("etherwarperclear")

    register("renderWorld", () => {
      if (Skyblock.area === "Crystal Hollows") return
      if (this.renderRoute?.length > 0.0) {
        const routeColor = OreMacro.getRouteColorRGB() // Get the color from settings
        const positions = this.renderRoute.map(point => [point.x1, point.y1, point.z1])
        RenderUtils.drawMultipleBlocksInWorldWithNumbers(positions, routeColor[0], routeColor[1], routeColor[2], 1, false) // outline
        RenderUtils.drawMultipleBlocksInWorld(positions, routeColor[0], routeColor[1], routeColor[2], 0.15, false, true) // filled
        this.renderRoute.forEach((point, index) => {
          // Only draw line if it's not the last point
          if (index !== this.renderRoute.length - 1) {
            RenderUtils.drawLine([point.x1 + 0.5, point.y1 + 0.5, point.z1 + 0.5], [point.x2 + 0.5, point.y2 + 0.5, point.z2 + 0.5], routeColor, 1, 1.5)
          }
        })
      }
    })

    register("step", () => {
      this.updateRouteRendering()
    }).setFps(1)

    this.startTime = 0

    register("step", () => {
      if (this.Enabled && this.renderDisplay) {
        overlayManager.AddOverlayText(this.OVERLAY_ID, "TIME", `Session Time: ${NumberUtils.timeSince(this.startTime)}`)
      }
    }).setFps(1)
  }

  toggle() {
    this.Enabled = !this.Enabled
    this.sendMacroMessage(this.Enabled ? "&aEnabled" : "&cDisabled")
    this.firstVein = true
    if (this.Enabled) {
      MouseUtils.unGrabMouse()
      this.etherwarp = Utils.findItem(["Aspect of the End", "Aspect of the Void"])

      if (!Utils.checkItems(this.ModuleName, [["Aspect of the End", "Aspect of the Void"]]) || !this.etherwarp) {
        this.stopMacro()
        return
      }

      if (ModuleManager.getSetting(this.ModuleName, "Warp Location") == "None") {
        this.initializeMacro()
        return
      }

      this.pendingInitialization = true
      this.warpLocation = ModuleManager.getSetting(this.ModuleName, "Warp Location")
      ChatLib.command("warp " + this.warpLocation.toLowerCase())

      let startDelay = ModuleManager.getSetting(this.ModuleName, "Start Delay")
      let startDelayTicks = 10 + Math.floor(startDelay / 50)

      Client.scheduleTask(startDelayTicks, () => {
        if (this.pendingInitialization) {
          this.sendMacroMessage("Starting etherwarper2")
          this.initializeMacro()
        }
      })

      if (!ModuleManager.getSetting("Other", "Auto Restart with Etherwarper")) {
        this.pendingInitialization = false

        Client.scheduleTask(startDelayTicks, () => {
          this.sendMacroMessage("Starting etherwarper1")
          this.initializeMacro()
        })
      }
      return
    }
    if (!this.Enabled) {
      this.stopMacro(undefined, false)
    }
  }

  // New method to handle initialization after warping
  initializeMacro() {
    this.initialized = true
    this.route = this.convertFileRoute(Utils.getConfigFile("etherwarperoutes/" + this.getAccessKey(ModuleManager.getSetting(this.ModuleName, "Etherwarper Route")) + ".txt"))
    this.targetWarp = this.getCurrentPoint()

    this.state = this.MacroStates.WARPING
    this.action = this.MacroActions.SELECTINGPOINT

    if (!this.targetWarp) {
      this.sendMacroMessage("Make sure you are stood on a route platform!")
      this.stopMacro()
      return
    }
    this.nextPos = this.route.get(this.targetWarp.next).pos
    this.renderDisplay = ModuleManager.getSetting(this.ModuleName, "Etherwarper Overlay")

    if (this.renderDisplay) {
      overlayManager.AddOverlayText(this.OVERLAY_ID, "TIME", "Session Time: 0s")
      overlayManager.EnableOverlay(this.OVERLAY_ID)
    }
    this.startTime = Date.now()
    if (!ModuleManager.getSetting("Other", "Disable failsafes during Etherwarper")) {
      new Thread(() => {
        // Failsafes
        let warp
        global.export.FailsafeManager.register(
          cb => {
            warp = this.targetWarp
            if (this.Enabled) this.toggle()
            cb()
          },
          () => {
            this.targetWarp = warp
            if (!this.Enabled) this.toggle()
            Client.scheduleTask(10, () => {
              this.doReAotv()
            })
          },
        )
      }).start()
    }
  }

  editRoute(editType, number) {
    let fileLocation = "etherwarperoutes/" + this.getAccessKey(ModuleManager.getSetting(this.ModuleName, "Etherwarper Route")) + ".txt"
    let configFile = Utils.getConfigFile(fileLocation)
    if (editType === "remove") {
      let route = configFile

      if (route.length === 0) return
      let routeNumber = 0
      if (number === undefined) routeNumber = route.length - 1
      else routeNumber = parseInt(number) - 1
      if (routeNumber > route.length || routeNumber < 0) routeNumber = route.length - 1
      route.splice(routeNumber, 1)
      if (route.length != 0.0) {
        if (route.length === 1.0) {
          route = [{ x1: route[0].x1, y1: route[0].y1, z1: route[0].z1, x2: route[0].x1, y2: route[0].y1, z2: route[0].z1 }]
        } else {
          let changeIndex = routeNumber - 1
          let nextIndex = routeNumber
          if (nextIndex === route.length) nextIndex = 0
          if (changeIndex < 0) changeIndex = route.length - 1
          route[changeIndex] = { x1: route[changeIndex].x1, y1: route[changeIndex].y1, z1: route[changeIndex].z1, x2: route[nextIndex].x1, y2: route[nextIndex].y1, z2: route[nextIndex].z1 }
        }
      }
      configFile = route
      this.sendMacroMessage("Removed waypoint " + (routeNumber + 1))
    }
    if (editType === "add") {
      let route = configFile
      let cords = Utils.playerCords().beneath
      let nextIndex = parseInt(number) - 1
      if (nextIndex >= route.length || nextIndex < 0 || isNaN(nextIndex)) nextIndex = 0
      let beforeIndex = nextIndex - 1
      if (beforeIndex < 0) beforeIndex = route.length - 1
      let spawnIndex = beforeIndex + 1
      if (spawnIndex > route.length) spawnIndex = route.length
      let nextValue = route[nextIndex]
      let beforeValue = route[beforeIndex]
      if (route.length === 0.0) {
        route.push({ x1: cords[0], y1: cords[1], z1: cords[2], x2: cords[0], y2: cords[1], z2: cords[2] })
      } else {
        route[beforeIndex] = { x1: beforeValue.x1, y1: beforeValue.y1, z1: beforeValue.z1, x2: cords[0], y2: cords[1], z2: cords[2] }
        route.splice(spawnIndex, 0, { x1: cords[0], y1: cords[1], z1: cords[2], x2: nextValue.x1, y2: nextValue.y1, z2: nextValue.z1 })
      }
      configFile = route
      // Handle undefined or invalid number
      const waypointNumber = isNaN(number) || number === undefined ? spawnIndex + 1 : number
      this.sendMacroMessage("Added waypoint " + waypointNumber)
    }
    if (editType === "clear") {
      configFile = []
      this.sendMacroMessage("Cleared route.")
    }

    Utils.writeConfigFile(fileLocation, configFile)
    this.renderRoute = configFile
  }

  updateRouteRendering() {
    RenderUtils.blockVBODataChanged = true
    let newName = ModuleManager.getSetting(this.ModuleName, "Etherwarper Route")
    this.renderRoute = this.checkForDifferentFormat(Utils.getConfigFile("etherwarperoutes/" + this.getAccessKey(newName) + ".txt"))
    this.pastName = newName
  }

  doReAotv() {
    this.reAotvPoint = null
    this.getPlatform(this.targetWarp.pos).forEach(pos => {
      if (this.reAotvPoint) return
      let point = RaytraceUtils.getPointOnBlock(pos, Player.getPlayer().func_174824_e(1), false, true)
      if (point) {
        this.reAotvPoint = point
      }
    })
    if (!this.reAotvPoint) {
      this.stopMacroWarning("Failed to re-aotv!")
      return
    }
    this.state = this.MacroStates.REAOTV
    MiningBot.stopBot()
    MovementHelper.setKey("shift", true)
    MovementHelper.stopMovement()
    this.reAotvTimer.reset()
    Player.setHeldItemIndex(this.etherwarp.slot)
    Rotations.rotateTo(this.reAotvPoint, 5.0)
    Rotations.onEndRotation(() => {
      if (ModuleManager.getSetting(this.ModuleName, "Fast AOTV")) {
        Client.scheduleTask(1, () => {
          ItemUtils.rightClickZPH()
        })
      } else {
        if (MiningBot.boostCounter <= 600) {
          Client.scheduleTask(7, () => {
            ItemUtils.rightClickPacket()
          })
        } else {
          Client.scheduleTask(2, () => {
            ItemUtils.rightClickPacket()
          })
        }
      }
    })
  }

  /**
   * @param {BlockPos} pos
   * @param {BlockPos} target
   */
  getWalkPointAndBlockPointForPos(pos, target) {
    let platformCurrent = new Map()
    let platformTarget = new Map()
    platformCurrent = this.getPlatform(pos)
    platformTarget = this.getPlatform(target)
    platformTarget.set(Utils.blockCode(target), target)

    while (platformTarget.size != 0.0) {
      let closestTarget = null
      let lowestDisTarget = undefined
      platformTarget.forEach(pos => {
        let distance = MathUtils.getDistanceToPlayer(pos).distanceFlat
        if (!closestTarget || distance < lowestDisTarget) {
          closestTarget = pos
          lowestDisTarget = distance
        }
      })
      if (!closestTarget) break
      platformTarget.delete(Utils.blockCode(closestTarget))

      let openSet = platformCurrent
      while (openSet.size != 0.0) {
        let closestCurrent = null
        let lowestDisCurrent = undefined
        openSet.forEach(pos => {
          let distance = MathUtils.getDistance(pos, closestTarget).distanceFlat
          if (!closestCurrent || distance < lowestDisCurrent) {
            closestCurrent = pos
            lowestDisCurrent = distance
          }
        })
        if (!closestCurrent) break
        openSet.delete(Utils.blockCode(closestCurrent))
        let center = [closestCurrent.x + 0.5, closestCurrent.y + 0.5, closestCurrent.z + 0.5]
        let eyes = new Vec3(center[0], center[1] + 2.1, center[2])
        let raytrace = RaytraceUtils.getPointOnBlock(closestTarget, eyes, false, true)
        if (raytrace) {
          let positions = RaytraceUtils.rayTraceBetweenPoints([pos.x + 0.5, pos.y + 0.5, pos.z + 0.5], [target.x + 0.5, target.y + 0.5, target.z + 0.5])
          let hasAir = positions.some(posWalk => World.getBlockAt(posWalk[0], posWalk[1], posWalk[2]).type.getID() === 0.0)
          return hasAir
            ? { point: raytrace, walkPoint: center, targetPos: closestTarget, etherwarp: true }
            : { point: [target.x + 0.5, target.y + 2.5, target.z + 0.5], walkPoint: [target.x + 0.5, target.y + 2.5, target.z + 0.5], targetPos: target, etherwarp: false }
        }
      }
    }
    return { point: null }
  }

  /**
   * @param {BlockPos} platformPos
   * @returns {Map}
   */
  getPlatform(platformPos) {
    let openSet = new Map()
    let closestSet = new Map()
    let platform = new Map()
    openSet.set(Utils.blockCode(platformPos), platformPos)
    while (openSet.size != 0.0) {
      openSet.forEach(pos => {
        let hash = Utils.blockCode(pos)
        openSet.delete(hash)
        closestSet.set(hash, true)
        platform.set(hash, pos)
        this.getCobbleAround(pos, platformPos).forEach(posAround => {
          let hashAround = Utils.blockCode(posAround)
          if (!closestSet.has(hashAround)) {
            openSet.set(hashAround, posAround)
          }
        })
      })
    }
    return platform
  }

  /**
   * @param {BlockPos} pos
   */
  getCobbleAround(pos, centerPos) {
    let cobblePositions = []
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && z === 0) continue
        let cobblePos = pos.add(new Vec3i(x, 0, z))
        if (
          MathUtils.getDistance(cobblePos, centerPos).distanceFlat <= 4.0 &&
          World.getBlockAt(cobblePos).type.getID() === 4.0 &&
          World.getBlockAt(cobblePos.add(new Vec3i(0, 1, 0))).type.getID() === 0.0 &&
          World.getBlockAt(cobblePos.add(new Vec3i(0, 2, 0))).type.getID() === 0.0
        ) {
          cobblePositions.push(cobblePos)
        }
      }
    }
    return cobblePositions
  }

  /**
   * @param {BlockPos} pos
   */
  getHash(pos) {
    return pos.x + "" + pos.y + "" + pos.z
  }

  /**
   * @param {String} name
   */
  getAccessKey(name) {
    return "custom" + name.slice(-1)
  }

  checkForDifferentFormat(routeObject) {
    let newRoute = routeObject
    try {
      if (routeObject[0].x != undefined) {
        let tempRoute = []
        for (let i = 0; i < routeObject.length; i++) {
          let currentPoint = routeObject[i]
          let nextPoint = routeObject[i + 1]
          if (nextPoint === undefined) nextPoint = routeObject[0]
          tempRoute.push({ x1: currentPoint.x, y1: currentPoint.y, z1: currentPoint.z, x2: nextPoint.x, y2: nextPoint.y, z2: nextPoint.z })
        }
        Utils.writeConfigFile("etherwarperoutes/" + this.getAccessKey(ModuleManager.getSetting(this.ModuleName, "Etherwarper Route")) + ".txt", tempRoute)
        newRoute = tempRoute

        this.sendMacroMessage("Converted your CW route to Rdbt format.")
      }
    } catch (error) {}
    return newRoute
  }

  /**
   * @param {Array<Object>} route
   */
  convertFileRoute(route) {
    let newRoute = new Map()
    route.forEach(object => {
      let pos1 = new BlockPos(object.x1, object.y1, object.z1)
      let pos2 = new BlockPos(object.x2, object.y2, object.z2)
      newRoute.set(pos1.toString(), new RoutePoint(pos1, pos2))
    })
    return newRoute
  }

  getCurrentPoint() {
    if (this.targetWarp) return this.targetWarp
    let returnPoint = null
    this.route.forEach(point => {
      if (this.isOnPoint(point)) returnPoint = point
    })
    return returnPoint
  }

  isOnPoint(point) {
    let pointArray = point
    if (point instanceof RoutePoint) {
      pointArray = [point.x + 0.5, point.y + 0.5, point.z + 0.5]
    }
    return MathUtils.distanceToPlayer(pointArray).distanceFlat < 2.0 && Math.abs(pointArray[1] + 0.5 - Player.getY()) <= 2.0
  }

  sendMacroMessage(message) {
    chat.message(this.ModuleName + ": " + message)
  }

  stopMacroWarning(message = undefined) {
    Utils.warnPlayer()
    this.stopMacro(message)
  }

  stopMacro(message = undefined, stopMessage = true) {
    this.Enabled = false
    this.initialized = false
    global.export.FailsafeManager.unregister()
    MouseUtils.reGrabMouse()
    MiningBot.stopBot()
    Rotations.stopRotate()
    MovementHelper.setKey("shift", false)
    MovementHelper.stopMovement()
    overlayManager.DisableOverlay(this.OVERLAY_ID)
    this.targetWarp = null
    if (message != undefined) this.sendMacroMessage(message)
    if (stopMessage) this.sendMacroMessage("&cDisabled")
  }

  setRoute(positions) {
    this.positions = positions
  }
}

class RoutePoint {
  /**
   * @param {BlockPos} pos1
   * @param {BlockPos} pos2
   */
  constructor(pos1, pos2) {
    this.key = pos1.toString()
    this.pos = pos1
    this.x = pos1.x
    this.y = pos1.y
    this.z = pos1.z
    this.center = [this.x + 0.5, this.y + 0.5, this.z + 0.5]
    this.next = pos2.toString()
  }
}

global.export.Etherwarper = new Etherwarper()
