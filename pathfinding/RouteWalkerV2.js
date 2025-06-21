let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection
let {  chat, MathUtils, Rotations, RenderUtils, MovementHelper, TimeHelper, Utils, Vec3 } = global.export
import RouteRenderer from "./RouteRenderer"

global.modules.push(
  new ConfigModuleClass(
    "Route Walker",
    "Misc",

    [
      new SettingSelector("Route", 0, ["Custom - 1", "Custom - 2", "Custom - 3", "Custom - 4", "Custom - 5", "Custom - 6", "Custom - 7", "Custom - 8", "Custom - 9", "Custom - 10"]),
      new SettingToggle("Left Click", false),
      new SettingToggle("Lock Pitch", false),
      new SettingSlider("Pitch", 0, -90, 90, 1),
    ],
    ["Walks between custom waypoints set in the world", "Use /walkeradd, /walkerremove, /walkerinsert to edit a route"],
  ),
)

class routeWalkerV2 {
  constructor() {
    this.ModuleName = "Route Walker"
    getKeyBind("Route Walker", "Rdbt Client v4 - Misc", this)
    this.Enabled = false
    this.path = []
    this.currentIndexWalk = 0
    this.currentIndexLook = 0
    this.WalkerStates = {
      WALKING: 0,
      WAITING: 1,
    }
    this.state = this.WalkerStates.WAITING
    this.callBackActions = []
    this.rotationTime = 200
    this.stopOnEnd = false
    this.loadingCords = false
    this.rotations = true

    this.routeRenderer = new RouteRenderer(this)

    register("step", () => {
      if (ModuleToggle.UseRouteWalkerV2Module) return
      this.updateRoute()
    }).setDelay(1)

    register("renderWorld", () => {
      this.routeRenderer.render()
    })

    register("command", number => {
      this.handleRouteEdit("add", number)
    }).setName("walkeradd")

    register("command", number => {
      this.handleRouteEdit("remove", number)
    }).setName("walkerremove")

    register("command", number => {
      this.handleRouteEdit("insert", number)
    }).setName("walkerinsert")
  }

  toggle() {
    this.Enabled = !this.Enabled
    this.updateModuleState() // Extract state update logic
    this.handleFailsafeRegistration() // Extract failsafe logic
    this.handleRotationAndMovementStop() // Extract rotation/movement stop logic
  }

  updateModuleState() {
    if (!ModuleToggle.UseRouteWalkerV2Module) {
      chat.message(this.ModuleName + ": " + (this.Enabled ? "&aEnabled" : "&cDisabled"))
      let index = this.getClosestIndex()
      this.currentIndexLook = index
      this.currentIndexWalk = index
    }
    if (this.Enabled) {
      MovementHelper.setCooldown()
      this.state = this.WalkerStates.WALKING
    }
  }

  handleFailsafeRegistration() {
    if (this.Enabled) {
      global.export.FailsafeManager.register(
        cb => {
          if (this.Enabled) this.toggle()
          cb()
        },
        () => {
          if (!this.Enabled) this.toggle()
        },
      )
    } else {
      global.export.FailsafeManager.unregister()
    }
  }

  handleRotationAndMovementStop() {
    if (!this.Enabled) {
      if (!ModuleToggle.UseRouteWalkerV2Module) Rotations.stopRotate()
      MovementHelper.stopMovement()
    }
  }

  /**
   * @param {String} name
   */
  getAccessKey(name) {
    return "custom" + name.slice(-1)
  }

  /**
   * @param {Array<Array>} path
   */
  setPath(path) {
    this.currentIndexWalk = 0
    this.currentIndexLook = 2
    if (path === undefined) this.path = []
    if (this.currentIndexLook >= path.length) {
      this.currentIndexLook = path.length - 1
    }
    this.path = path
  }

  getClosestIndex() {
    let closest = null
    let closestIndex = 0
    let closestDistance = 0
    this.path.forEach((point, index) => {
      let distance = MathUtils.distanceToPlayer(point).distance
      if (!closest || distance < closestDistance) {
        closest = point
        closestIndex = index
        closestDistance = distance
      }
    })
    return closestIndex
  }

  setRotations(rotate) {
    this.rotate = rotate
  }

  setRotationTime(time) {
    this.looktime = time
  }

  setStopOnEnd(boolean) {
    this.stopOnEnd = boolean
  }

  setRotations(boolean) {
    this.rotations = boolean
  }

  triggerOnEnd(CallBack) {
    this.callBackActions.push(CallBack)
  }

  triggerEnd() {
    this.callBackActions.forEach(action => {
      action()
    })
    this.callBackActions = []
  }

  updateRoute() {
    if (ModuleToggle.UseRouteWalkerV2Module) return
    this.path = this.loadRouteFromConfig() // Using extracted function
  }

  loadRouteFromConfig() {
    // Extracted function to load route
    const configName = "routewalkerroutes/" + this.getAccessKey(ModuleManager.getSetting(this.ModuleName, "Route")) + ".txt"
    return Utils.getConfigFile(configName)
  }

  saveRouteToConfig(Route) {
    // Extracted function to save route
    const configName = "routewalkerroutes/" + this.getAccessKey(ModuleManager.getSetting(this.ModuleName, "Route")) + ".txt"
    Utils.writeConfigFile(configName, Route)
  }

  sendRouteEditMessage(action, routeLength) {
    // Extracted function to send chat messages
    let message = `Route Walker: ${action} waypoint`
    if (action === "Added") message += ` ${routeLength}`
    else if (action === "Removed")
      message += ` ${routeLength + 1}` // Adjusted for removed waypoint
    else if (action === "Inserted") message += ` ${routeLength}`

    chat.message(message)
  }

  handleRouteEdit(type, index) {
    let Route = this.loadRouteFromConfig() // Load route once

    if (type === "add") {
      let plyCords = Utils.playerCords().floor
      plyCords[1] -= 1
      Route.push(plyCords)
      this.saveRouteToConfig(Route) // Save route using extracted function
      this.sendRouteEditMessage("Added", Route.length) // Send message using extracted function
      this.updateRoute()
      return
    }
    if (type === "remove") {
      Route.pop()
      this.saveRouteToConfig(Route) // Save route using extracted function
      this.sendRouteEditMessage("Removed", Route.length) // Send message using extracted function
      this.updateRoute()
      return
    }
    if (type === "insert") {
      if (isNaN(index)) {
        chat.message("Route Walker: /insert <number>")
        return
      }
      let plyCords = Utils.playerCords().floor
      plyCords[1] -= 1
      Route.splice(index - 1, 0, plyCords)
      this.saveRouteToConfig(Route) // Save route using extracted function
      this.sendRouteEditMessage("Inserted", index) // Send message using extracted function
      this.updateRoute()
      return
    }
  }

  findItemInHotbar(itemName) {
    for (let slot = 0; slot < 9; slot++) {
      let item = Player.getInventory().getStackInSlot(slot)
      if (item && item.getName().includes(itemName)) {
        return slot
      }
    }
    return -1
  }
  
  detectRod() {
    let rodSlot = this.findItemInHotbar("Rod")
    let currentSlot = Player.getHeldItemIndex()

    if (rodSlot !== -1 && rodSlot !== currentSlot) {
      Player.setHeldItemIndex(rodSlot)
    } else if (rodSlot === -1) {
      chat.message("§bRod not found in inventory.")
    }
  }
}

global.export.RouteWalkerV2 = new routeWalkerV2()
