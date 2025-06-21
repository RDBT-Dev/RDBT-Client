import Skyblock from "BloomCore/Skyblock"
let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection
let { chat, MiningUtils, Rotations, Vec3, overlayManager, RaytraceUtils, ItemUtils, NumberUtils, MiningBot, registerEventSB, MouseUtils, MovementHelper, RenderUtils, TimeHelper, MathUtils, Utils } = global.export

global.modules.push(
  new ConfigModuleClass(
    "Gemstone Macro",
    "Mining",
    [
      new SettingSelector("Gemstone Route", 0, ["Custom - 1", "Custom - 2", "Custom - 3", "Custom - 4", "Custom - 5", "Custom - 6", "Custom - 7", "Custom - 8", "Custom - 9", "Custom - 10"]),
      new SettingToggle("Ruby", true),
      new SettingToggle("Amethyst", true),
      new SettingToggle("Sapphire", true),
      new SettingToggle("Topaz", true),
      new SettingToggle("Amber", true),
      new SettingToggle("Jade", true),
      new SettingToggle("Jasper", true),
      new SettingToggle("Mob Killer", false),
      new SettingSlider("Weapon Slot", 1, 1, 9),
      new SettingToggle("Big Platforms", false),
      new SettingToggle("Low ping strategy", false),
      new SettingSelector("Route Color", 3, ["Red", "Green", "Blue", "Yellow", "Cyan", "Magenta", "White", "Black"]),
      new SettingToggle("Gemstone Overlay", true),
      new SettingToggle("Use preset ticks", false),
      new SettingSlider("Ticks without MSB", 4, 4, 40),
      new SettingSlider("Ticks with MSB", 4, 4, 40),
      new SettingToggle("Fast AOTV", false),
    ],
    ["Automatically mines gemstones in the Crystal Hollows"],
  ),
)

class GemstoneMacro {
  constructor() {
    this.ModuleName = "Gemstone Macro"
    this.Enabled = false

    // Create Overlay
    this.OVERLAY_ID = "GEMSTONE"
    overlayManager.AddOverlay(this.ModuleName, this.OVERLAY_ID)

    getKeyBind("Gemstone Macro", "Rdbt Client v4 - Mining", this)

    this.MacroStates = {
      WAITING: 0,
      MINING: 1,
      WARPING: 2,
      KILLING: 3,
      REFUELING: 4,
      REAOTV: 5,
    }
    this.state = this.MacroStates.WAITING
    this.MacroActions = {
      WAITING: 0,
      SELECTINGPOINT: 1,
      LOOKINGATPOINT: 2,
      WAITINGFORPOINT: 3,
      CLICKINGABIPHONE: 4,
      FILLINGDRILL: 5,
      WALKING: 6,
    }
    this.action = this.MacroActions.WAITING

    this.route = new Map()
    this.renderRoute = []
    this.pastName = ""
    this.targetWarp = null
    this.targetWalk = null
    this.targetWarpPoint = null

    this.drill = null
    this.blueCheese = null
    this.etherwarp = null
    this.weapon = null
    this.firstVein = false
    this.miningSpeed = 0
    this.gemstoneColors = []
    this.renderDisplay = false
    this.shouldEtherwarp = false
    this.targetPos = null
    this.bigPlatforms = true
    this.reAotvPoint = null
    this.retryCount = 0
    this.lowPing = false
    this.isRefueling = false
    this.attemptRestart = false

    this.teleportationTimer = new TimeHelper()
    this.lastMobTimer = new TimeHelper()
    this.lookTimer = new TimeHelper()
    this.walkTimer = new TimeHelper()
    this.reAotvTimer = new TimeHelper()

    this.gemstonePrices = { RUBY: 240, AMETHYST: 240, SAPPHIRE: 240, TOPAZ: 240, AMBER: 240, JADE: 240, JASPER: 240 }

    register("tick", () => {
      if (this.Enabled) {
        if (this.state === this.MacroStates.MINING) {
          this.attemptRestart = true
          if (!MiningBot.Enabled) {
            MiningBot.setGemstoneTypes(
              ModuleManager.getSetting(this.ModuleName, "Ruby"),
              ModuleManager.getSetting(this.ModuleName, "Amber"),
              ModuleManager.getSetting(this.ModuleName, "Sapphire"),
              ModuleManager.getSetting(this.ModuleName, "Jade"),
              ModuleManager.getSetting(this.ModuleName, "Amethyst"),
              false,
              ModuleManager.getSetting(this.ModuleName, "Topaz"),
              ModuleManager.getSetting(this.ModuleName, "Jasper"),
              false,
              false,
              false,
              false,
              false,
            )
            MiningBot.toggle(
              MiningBot.MACROTYPES.GEMSTONE,
              this.drill,
              this.blueCheese,
              ModuleManager.getSetting(this.ModuleName, "Big Platforms"),
              this.targetWarp.pos,
              this.miningSpeed,
              ModuleManager.getSetting(this.ModuleName, "Use preset ticks"),
              ModuleManager.getSetting(this.ModuleName, "Ticks without MSB"),
              ModuleManager.getSetting(this.ModuleName, "Ticks with MSB"),
              this.lowPing,
              this.nextPos,
            )
          }

          if (MiningBot.Enabled && MiningBot.isEmpty()) {
            this.state = this.MacroStates.WARPING
            this.action = this.MacroActions.SELECTINGPOINT
            MiningBot.stopBot()
            MovementHelper.setKey("shift", true)
          } else if (this.mobKiller && MiningUtils.getCHMobNear()) {
            MovementHelper.stopMovement()
            this.state = this.MacroStates.KILLING
            this.lastMobTimer.reset()
            MiningBot.stopBot()
          }

          let calc = MathUtils.getDistanceToPlayer(this.targetWarp.center)
          if (calc.distance > 6.0 || calc.distanceFlat > 3.0) this.doReAotv()
        }
        if (this.state === this.MacroStates.REAOTV) {
          let calc = MathUtils.getDistanceToPlayer(this.reAotvPoint)
          if ((calc.distance < 4.0 && calc.distanceFlat < 2.0) || this.reAotvTimer.hasReached(2000)) {
            this.state = this.MacroStates.MINING
          }
        }
        if (this.state === this.MacroStates.WARPING) {
          MovementHelper.setKey("shift", true)
          if (this.action === this.MacroActions.SELECTINGPOINT) {
            this.teleportationTimer.reset()
            this.previousWarp = this.targetWarp
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
            if (this.attemptRestart) {
              Client.scheduleTask(10, () => {
                toggle()
              })
            }
            this.sendMacroMessage("Next waypoint is inaccesible!")
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
                    if (this.attemptRestart) {
                      Client.scheduleTask(10, () => {
                        toggle()
                      })
                    }
                    this.sendMacroMessage("Next waypoint is not visible!")
                    this.stopMacroWarning()
                    return
                  }
                  this.reAotvTimer.reset()
                  Rotations.rotateTo(point, 1.0)
                  Rotations.onEndRotation(() => {
                    this.teleportationTimer.reset()
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
                } else {
                  this.state = this.MacroStates.MINING
                }
              }
              return
            }
            MovementHelper.setKey("shift", true)
            if (this.walkTimer.hasReached(2500)) {
              if (this.retryCount === 0) {
                this.retryCount++
              } else {
                if (this.attemptRestart) {
                  Client.scheduleTask(10, () => {
                    toggle()
                  })
                }
                this.sendMacroMessage("Unable to find a path back to the platform!")
                return this.stopMacroWarning()
              }
            }
            Rotations.rotateTo(this.targetWarpPoint)
            MovementHelper.setKeysForStraightLine(MathUtils.calculateAngles(new Vec3(this.targetWalk[0], this.targetWalk[1], this.targetWalk[2])).yaw, false)
          }
          if (this.action === this.MacroActions.WAITINGFORPOINT) {
            if (this.isOnPoint(this.targetWarpPoint)) {
              this.state = this.MacroStates.MINING
            } else if (this.teleportationTimer.hasReached(5000)) {
              this.state = this.MacroStates.WARPING
              this.action = this.MacroActions.WALKING
            }
          }
        }
        if (this.state === this.MacroStates.KILLING) {
          ItemUtils.setItemSlot(this.weapon.slot)
          MovementHelper.setKey("shift", true)
          let targetMob = MiningUtils.getCHMobNear(this.nextPos)
          if (!targetMob && this.lastMobTimer.hasReached(1000)) {
            this.state = this.MacroStates.MINING
            return
          }
          if (targetMob) {
            this.lastMobTimer.reset()
            let Vec3Mob = new Vec3(targetMob.getX(), targetMob.getY() + targetMob.getHeight() / 1.4, targetMob.getZ())
            if (!Rotations.rotate) Rotations.rotateTo(Vec3Mob)
            else Rotations.updateTargetTo(Vec3Mob)
            let angles = MathUtils.calculateAngles(Vec3Mob)
            if (this.lookTimer.reachedRandom() && Math.abs(angles.yaw) + Math.abs(angles.pitch) < 20) {
              this.lookTimer.reset()
              this.lookTimer.setRandomReached(500, 1000)
              ItemUtils.rightClick()
            }
          }
        }
        if (this.state === this.MacroStates.REFUELING) {
          if (this.action === this.MacroActions.CLICKINGABIPHONE) {
            this.isRefueling = true
            this.action = this.MacroActions.WAITING
            Player.setHeldItemIndex(this.abiphone.slot)
            ItemUtils.rightClick(10)
            MiningUtils.startAbiphone()
            MiningUtils.onAbiphoneDone(succes => {
              if (succes) {
                this.action = this.MacroActions.FILLINGDRILL
                return
              }
              this.sendMacroMessage("You need Jotraelin in your Abiphone contacts to use drill refuel!")
              this.stopMacroWarning()
            })
          }
          if (this.action === this.MacroActions.FILLINGDRILL) {
            this.action = this.MacroActions.WAITING
            MiningUtils.startRefuel(this.drill)
            MiningUtils.onReFuelDone(succes => {
              if (succes) {
                let drills = MiningUtils.getDrills()
                this.drill = drills.drill
                this.blueCheese = drills.blueCheese
                if (!this.drill) {
                  this.sendMacroMessage("Unable to find new drill, please report this issue.")
                  return
                }
                if (!this.blueCheese) this.blueCheese = this.drill
                this.state = this.MacroStates.MINING
                this.isRefueling = false
                return
              }
              this.isRefueling = false
              this.sendMacroMessage("No fuel found!")
              this.stopMacroWarning()
            })
          }
        }
      }
    })

    registerEventSB("emptydrill", () => {
      if (this.Enabled) {
        MiningBot.stopBot()
        if (this.abiphone) {
          this.state = this.MacroStates.REFUELING
          this.action = this.MacroActions.CLICKINGABIPHONE
          return
        }
        this.sendMacroMessage("You are missing an Abiphone to refuel your drill!")
        this.stopMacroWarning()
      }
    })

    registerEventSB("serverchange", () => {
      if (this.Enabled) {
        this.stopMacroWarning("Server shutdown!")
      }
    })

    register("worldUnload", () => {
      if (this.Enabled) this.stopMacroWarning()
    })

    register("command", number => {
      this.editRoute("add", number?.toLowerCase())
    }).setName("gemstoneadd")
    register("command", number => {
      this.editRoute("remove", number?.toLowerCase())
    }).setName("gemstoneremove")
    register("command", number => {
      this.editRoute("clear")
    }).setName("gemstoneclear")

    register("command", () => {
      if (!Skyblock.area === "Crystal Hollows") {
        RouteScanner.sendMacroMessage("Make sure you are in the Crystal Hollows!")
        return
      }
      RouteScanner.setRoute(Utils.mapToArray(this.renderRoute))
      RouteScanner.scanCords()
    }).setName("scanroute")

    register("renderWorld", () => {
      if (Skyblock.area !== "Crystal Hollows") return
      if (this.renderRoute?.length > 0.0) {
        const routeColor = this.getRouteColorRGB() // Get the color from settings
        const positions = this.renderRoute.map(point => [point.x1, point.y1, point.z1])
        RenderUtils.drawMultipleBlocksInWorldWithNumbers(positions, routeColor[0], routeColor[1], routeColor[2], 1, false) // outline
        RenderUtils.drawMultipleBlocksInWorld(positions, routeColor[0], routeColor[1], routeColor[2], 0.15, false, true) // filled
        this.renderRoute.forEach(point => {
          RenderUtils.drawLine([point.x1 + 0.5, point.y1 + 0.5, point.z1 + 0.5], [point.x2 + 0.5, point.y2 + 0.5, point.z2 + 0.5], routeColor, 1, 1.5)
        })
      }
    })

    register("step", () => {
      this.updateRouteRendering()
      this.bigPlatforms = ModuleManager.getSetting(this.ModuleName, "Big Platforms")
    }).setFps(1)

    register("chat", () => {
      if (this.Enabled) {
        ChatLib.command("purchasecrystallhollowspass")
        this.sendMacroMessage("Renewed your Crystal Hollows pass!")
      }
    })
      .setCriteria("remaining on your pass.")
      .setContains() 

    this.totalMoney = 0
    this.totalCollection = 0
    this.moneyAnHour = 0
    this.startTime = 0
    this.flawlessPerHour = 0
    register("chat", (icon, type, number, event) => {
      if (this.Enabled) {
        let num = parseInt(number)
        this.totalCollection += 80 * num

        // Adjusted to make the changes for Flawless calculation
        this.totalMoney += (this.gemstonePrices[type.toUpperCase()] / Math.pow(80, 3 - 1)) * num

        // Added flawless per hour
        this.moneyPerHour = this.totalMoney / ((Date.now() - this.startTime) / (1000 * 60 * 60))
        this.flawlessPerHour = this.moneyPerHour / this.gemstonePrices[type.toUpperCase()]
      }
    }).setChatCriteria(/&r&d&lPRISTINE! &r&fYou found &r(.+) Flawed (.+) Gemstone &r&8x(.+)&r&f!&r/g)

    register("step", () => {
      if (this.Enabled && this.renderDisplay) {
        overlayManager.AddOverlayText(this.OVERLAY_ID, "MONEY_HOUR", "Coins/Hour: $" + NumberUtils.addNotation(Math.floor(this.totalMoney / ((Date.now() - this.startTime) / (1000 * 60 * 60)))))
        overlayManager.AddOverlayText(this.OVERLAY_ID, "MONEY", "Session Coins: $" + NumberUtils.addNotation(Math.floor(this.totalMoney)))
        overlayManager.AddOverlayText(this.OVERLAY_ID, "FLAWLESS_HOUR", "Flawless/Hour: " + NumberUtils.addNotation(Math.floor(this.flawlessPerHour)))
        overlayManager.AddOverlayText(this.OVERLAY_ID, "COLLECTION", `Session Collection: ${NumberUtils.addNotation(this.totalCollection)} gems`)
        overlayManager.AddOverlayText(this.OVERLAY_ID, "TIME", `Session Time: ${NumberUtils.timeSince(this.startTime)}`)
      }
    }).setFps(5)
  }

  /**
   * Converts the selected color name from settings to an RGB array.
   * @returns {Array<number>} - RGB color array [R, G, B].
   */
  getRouteColorRGB() {
    const colorName = ModuleManager.getSetting(this.ModuleName, "Route Color")
    switch (colorName) {
      case "Red":
        return [1, 0, 0]
      case "Green":
        return [0, 1, 0]
      case "Blue":
        return [0, 0, 1]
      case "Yellow":
        return [1, 1, 0]
      case "Cyan":
        return [0, 1, 1]
      case "Magenta":
        return [1, 0, 1]
      case "White":
        return [1, 1, 1]
      case "Black":
        return [0, 0, 0]
      default:
        return [0, 1, 0] // Default to green if colorName is invalid
    }
  }

  /**
   * Creates a slightly lighter highlight color from the base route color.
   * @param {Array<number>} baseColorRGB - Base RGB color array.
   * @returns {Array<number>} - Highlight RGB color array.
   */
  getHighlightColorRGB(baseColorRGB) {
    // Make highlight a bit brighter by increasing RGB values, capped at 255 (or 1 in normalized range)
    return baseColorRGB.map(c => Math.min(1, c * 1.3)) // Increase brightness by 30%, cap at 1
  }

  toggle() {
    this.Enabled = !this.Enabled
    this.sendMacroMessage(this.Enabled ? "&aEnabled" : "&cDisabled")
    this.firstVein = true
    if (this.Enabled) {
      MouseUtils.unGrabMouse()
      if (!Skyblock.area === "Crystal Hollows") {
        this.stopMacroWarning("Make sure you are in the Crystal Hollows!")
        return
      }
      let drills = MiningUtils.getDrills()
      this.drill = drills.drill
      this.blueCheese = drills.blueCheese
      this.etherwarp = Utils.findItem(["Aspect of the End", "Aspect of the Void"])
      this.abiphone = Utils.findItem(["Abiphone"])

      if (!Utils.checkItems(this.ModuleName, [["Aspect of the End", "Aspect of the Void"]]) || !this.drill) {
        this.stopMacro()
        return
      }
      if (!this.blueCheese) {
        this.blueCheese = this.drill
      }
      this.route = this.convertFileRoute(Utils.getConfigFile("gemstoneroutes/" + this.getAccessKey(ModuleManager.getSetting(this.ModuleName, "Gemstone Route")) + ".txt"))
      this.targetWarp = this.getCurrentPoint()
      if (!this.targetWarp) {
        this.sendMacroMessage("Make sure you are stood on a route platform!")
        return
      }
      this.nextPos = this.route.get(this.targetWarp.next).pos
      this.mobKiller = ModuleManager.getSetting(this.ModuleName, "Mob Killer")
      let slot = ModuleManager.getSetting(this.ModuleName, "Weapon Slot") - 1
      if (!Player.getInventory().getStackInSlot(slot)) {
        this.mobKiller = false
      } else {
        this.weapon = Utils.getItem(slot)
      }
      this.gemstoneColors = this.makeGemstoneColors(ModuleManager.getSetting(this.ModuleName, "Gemstone Priority"))
      this.gemstoneBadColors = this.makeGemstoneColors(ModuleManager.getSetting(this.ModuleName, "Gemstone Ignore"))
      this.state = this.MacroStates.WAITING
      this.renderDisplay = ModuleManager.getSetting(this.ModuleName, "Gemstone Overlay")
      this.bigPlatforms = ModuleManager.getSetting(this.ModuleName, "Big Platforms")
      this.lowPing = ModuleManager.getSetting(this.ModuleName, "Low ping strategy")
      if (this.renderDisplay) {
        // Checks all the regular CH gemstone prices, using NPC as fallback
        try {
          const json = JSON.parse(FileLib.getUrlContent("https://api.hypixel.net/skyblock/bazaar"))
          // Adjusted to support FLAWLESS bazaar prices
          Object.keys(json.products)
            .filter(p => p.startsWith("FLAWLESS_"))
            .forEach(product => {
              const name = product.split("_")[1]
              const sellPrice = json.products[product].quick_status.sellPrice

              if (this.gemstonePrices[name] !== sellPrice) this.gemstonePrices[name] = Math.max(sellPrice, 240)
            })
        } catch (e) {
          chat.debugMessage("Failed to fetch Gemstone Prices.")
        }

        overlayManager.AddOverlayText(this.OVERLAY_ID, "MONEY_HOUR", "Coins/Hour: $0")
        overlayManager.AddOverlayText(this.OVERLAY_ID, "MONEY", "Session Coins: $0")
        overlayManager.AddOverlayText(this.OVERLAY_ID, "FLAWLESS_HOUR", "Flawless/Hour: 0")
        overlayManager.AddOverlayText(this.OVERLAY_ID, "COLLECTION", "Session Collection: 0 gems")
        overlayManager.AddOverlayText(this.OVERLAY_ID, "TIME", "Session Time: 0s")

        overlayManager.EnableOverlay(this.OVERLAY_ID)
      }
      this.totalMoney = 0
      this.totalCollection = 0
      this.moneyAnHour = 0
      this.startTime = Date.now()
      new Thread(() => {
        if (!ModuleManager.getSetting(this.ModuleName, "Use preset ticks")) {
          if (!MiningUtils.hasSavedMiningSpeed()) return this.stopMacro()
          this.miningSpeed = MiningUtils.getSavedMiningSpeed()
        }
        this.state = this.MacroStates.MINING

        // Failsafes
        global.export.FailsafeManager.register(
          cb => {
            if (this.Enabled) this.toggle()
            cb()
          },
          () => {
            if (!this.Enabled) this.toggle()
          },
        )
      }).start()
    }
    if (!this.Enabled) {
      this.stopMacro(undefined, false)
    }
  }

  editRoute(editType, number) {
    let fileLocation = "gemstoneroutes/" + this.getAccessKey(ModuleManager.getSetting(this.ModuleName, "Gemstone Route")) + ".txt"
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

  makeGemstoneColors(type) {
    let returnValue = []
    if (type === "Ruby") returnValue = ["red"]
    if (type === "Amethyst") returnValue = ["purple"]
    if (type === "Sapphire") returnValue = ["lightBlue"]
    if (type === "Topaz") returnValue = ["yellow"]
    if (type === "Amber") returnValue = ["orange"]
    if (type === "Jade") returnValue = ["lime"]
    if (type === "Jasper") returnValue = ["magenta"]
    if (type === "Any") returnValue = ["red", "purple", "lightBlue", "yellow", "orange", "lime", "magenta"]
    return returnValue
  }

  updateRouteRendering() {
    RenderUtils.blockVBODataChanged = true
    let newName = ModuleManager.getSetting(this.ModuleName, "Gemstone Route")
    this.renderRoute = this.checkForDifferentFormat(Utils.getConfigFile("gemstoneroutes/" + this.getAccessKey(newName) + ".txt"))
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
      if (this.attemptRestart) {
        Client.scheduleTask(10, () => {
          toggle()
        })
      }
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
        Client.scheduleTask(3, () => {
          ItemUtils.rightClickZPH()
        })
      } else {
        if (MiningBot.boostCounter <= 600) {
          Client.scheduleTask(7, () => {
            ItemUtils.rightClickPacket()
          })
        } else {
          Client.scheduleTask(3, () => {
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
    if (this.bigPlatforms) {
      platformCurrent = this.getPlatform(pos)
      platformTarget = this.getPlatform(target)
    } else {
      platformCurrent.set(Utils.blockCode(pos), pos)
      platformTarget.set(Utils.blockCode(target), target)
    }

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
        Utils.writeConfigFile("gemstoneroutes/" + this.getAccessKey(ModuleManager.getSetting(this.ModuleName, "Gemstone Route")) + ".txt", tempRoute)
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
    let closestPoint = null
    let minDistance = Infinity
    
    this.route.forEach(point => {
      let distance = this.getDistanceToPoint(point)
      if (distance < minDistance) {
        minDistance = distance
        closestPoint = point
      }
    })
    return closestPoint
  }

  getDistanceToPoint(point) {
    let pointArray = point
    if (point instanceof RoutePoint) {
      pointArray = [point.x + 0.5, point.y + 0.5, point.z + 0.5]
    }

    // add raytrace check
    
    const verticalDist = Math.abs(pointArray[1] + 0.5 - Player.getY())
    const horizontalDist = MathUtils.distanceToPlayer(pointArray).distanceFlat
    return Math.sqrt(horizontalDist * horizontalDist + verticalDist * verticalDist)
  }

  isOnPoint(point) {
    let pointArray = point
    if (point instanceof RoutePoint) {
      pointArray = [point.x + 0.5, point.y + 0.5, point.z + 0.5]
    }
    return MathUtils.distanceToPlayer(pointArray).distanceFlat < 2.0 && Math.abs(pointArray[1] + 0.5 - Player.getY()) <= 2.0
  }

  sendMacroMessage(msg) {
    chat.message(this.ModuleName + ": " + msg)
  }

  stopMacroWarning(message = undefined) {
    Utils.warnPlayer()
    this.stopMacro(message)
  }

  stopMacro(message = undefined, stopMessage = true) {
    this.Enabled = false
    global.export.FailsafeManager.unregister()
    MouseUtils.reGrabMouse()
    MiningBot.stopBot()
    Rotations.stopRotate()
    MovementHelper.setKey("shift", false)
    MovementHelper.stopMovement()
    overlayManager.DisableOverlay(this.OVERLAY_ID)
    this.targetWarp = null
    this.isRefueling = false
    this.attemptRestart = false
    if (message != undefined) this.sendMacroMessage(message)
    if (stopMessage) this.sendMacroMessage("&cDisabled")
  }

  getIsRefueling() {
    return this.isRefueling
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

global.modules.push(
  new ConfigModuleClass(
    "Auto Compactor",
    "Misc",
    [new SettingToggle("Enabled", false), new SettingSlider("Click Delay", 300, 100, 1500), new SettingSelector("Gemstone Type", 0, ["Ruby", "Topaz", "Sapphire", "Amethyst", "Amber", "Jade", "Jasper"])],
    ["Automatically clicks to compact gemstones in your gemstone sack", "THIS SHOULD ONLY BE USED IF YOUR A NON, PLEASE USE /recipe IF YOU HAVE A RANK"],
  ),
)

class AutoCompacter {
  constructor() {
    this.ModuleName = "Auto Compactor"
    this.Enabled = false
    this.clickTimer = new TimeHelper()
    this.delay = 300
    this.gemstone = "Ruby"

    register("step", () => {
      this.Enabled = ModuleManager.getSetting(this.ModuleName, "Enabled")
      this.delay = ModuleManager.getSetting(this.ModuleName, "Click Delay")
      this.gemstone = ModuleManager.getSetting(this.ModuleName, "Gemstone Type")
    }).setDelay(1)

    register("tick", () => {
      if (!this.Enabled) return
      if (this.clickTimer.hasReached(this.delay)) {
        this.clickTimer.reset()
        if (Player.getContainer()?.getName() === "Gemstones Sack") {
          let slot = 0
          switch (this.gemstone) {
            case "Jade":
              slot = 10
              break
            case "Amber":
              slot = 11
              break
            case "Topaz":
              slot = 12
              break
            case "Sapphire":
              slot = 13
              break
            case "Amethyst":
              slot = 14
              break
            case "Jasper":
              slot = 15
              break
            case "Ruby":
              slot = 16
              break
            default:
              slot = undefined
              break
          }
          if (slot != undefined) {
            Player.getContainer().click(slot, false, "LEFT")
          }
        }
      }
    })
  }
}

new AutoCompacter()

class routeScanner {
  constructor() {
    this.moduleName = "Route Scanner"
    this.positions = []
    this.miningIds = [160, 95, 168, 159, 7, 35, 0, 1, 14, 15, 16, 21, 56, 73, 74, 129]
    this.obstructed = null

    register("renderWorld", () => {
      if (this.obstructed === null) return
      if (Skyblock.area === "Crystal Hollows") {
        RenderUtils.renderCube(this.obstructed, [1, 0, 0], true, 0.6)
      }
    })

    register("worldUnload", () => {
      this.obstructed = null
    })
  }

  scanCords() {
    new Thread(() => {
      let startTime = new TimeHelper()
      let allBlocks = []
      let isLoaded = true
      for (let i = 0; i < this.positions.length; i++) {
        let routePoint = this.positions[i]
        let vec1 = [routePoint.x1 + 0.5, routePoint.y1 + 1.0, routePoint.z1 + 0.5]
        let vec2 = [routePoint.x2 + 0.5, routePoint.y2 + 0.5, routePoint.z2 + 0.5]
        let blocks = RaytraceUtils.rayTraceBetweenPoints(vec1, vec2)
        blocks.forEach(array => {
          let pos = new BlockPos(array[0], array[1], array[2])
          allBlocks.push(World.getBlockAt(pos))
          if (!World.getWorld().func_175668_a(pos.toMCBlock(), false)) isLoaded = false
        })
      }
      if (!isLoaded) {
        this.sendMacroMessage("Your route is not fully loaded!")
        return
      }
      for (let i = 0; i < allBlocks.length; i++) {
        if (this.miningIds.indexOf(allBlocks[i].type.getID()) === -1) {
          this.obstructed = [allBlocks[i].getX(), allBlocks[i].getY(), allBlocks[i].getZ()]
          this.sendMacroMessage("Route is obstructed!")
          this.sendMacroMessage("Scan took " + startTime.getTimePassed() + "ms")
          return
        }
      }
      this.sendMacroMessage("Route is not obstructed!")
      this.sendMacroMessage("Scan took " + startTime.getTimePassed() + "ms")
    }).start()
  }

  sendMacroMessage(message) {
    chat.message(this.moduleName + ": " + message)
  }

  setRoute(positions) {
    this.positions = positions
  }
}

let RouteScanner = new routeScanner()
global.export.GemstoneMacro = new GemstoneMacro()
