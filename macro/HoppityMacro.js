/* @ Plus @ */
let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection

let { TimeHelper, GuiUtils, chat, ItemUtils, NumberUtils, RenderUtils, Utils, overlayManager, AutoReconnect, PathHelper, Rotations } = global.export

global.modules.push(
  new ConfigModuleClass(
    "Hoppity Macro",
    "Extras",
    [
      new SettingToggle("Overlay", true),
      new SettingToggle("Auto Click", false),
      new SettingSlider("Clicker CPS", 8, 1, 20),
      new SettingToggle("Auto Upgrade", true),
      new SettingToggle("Auto Tower", true),
      new SettingToggle("Auto Prestige", true),

      // Event stuff
      new SettingToggle("Auto Event", false),
    ],
    ["Automatically clicks in the chocolate factory, by fork", "Auto Event must be enabled for the egg hunt!"],
  ),
)

class hoppityMacro {
  constructor() {
    this.ModuleName = "Hoppity Macro"

    this.MACRO_STATES = {
      OFF: -1,
      IDLE: 0,
      RUNNING: 1,
      MILESTONES: 2,
      PRESTIGE: 3,
      EGG_HUNT: 4,
    }

    this.state = this.MACRO_STATES.OFF
    this.startTime = Date.now()
    this.restartTimer = new TimeHelper()

    this.clickTimer = new TimeHelper()
    this.clickerCps = ModuleManager.getSetting(this.ModuleName, "Clicker CPS")
    this.clickDelay = this.getClickerDelay()

    this.nextClick = 13
    this.slots = [27, 28, 29, 30, 31, 32, 33, 34, 35, 38, 39, 42]

    // Event
    this.START_NODE = [513, 105, 528]
    this.PATHS = {
      1: [this.START_NODE, [512, 105, 547], [501, 105, 551], [498, 105, 556], [494, 105, 556]],
      2: [this.START_NODE, [503, 108, 528], [494, 108, 513], [480, 105, 514], [477, 105, 518], [473, 105, 519], [472, 105, 518]],
      3: [this.START_NODE, [524, 108, 528], [530, 108, 513], [552, 105, 513]],
      4: [this.START_NODE, [503, 108, 528], [503, 108, 498], [506, 91, 475], [509, 91, 472]],
      5: [this.START_NODE, [503, 108, 528], [503, 108, 498], [506, 91, 475], [512, 91, 475], [513, 69, 503], [500, 69, 509], [491, 67, 505], [485, 64, 479]],
      6: [this.START_NODE, [512, 105, 547], [518, 105, 548], [526, 105, 554], [532, 105, 556]],
      7: [this.START_NODE, [503, 108, 528], [503, 108, 498], [506, 91, 475], [512, 91, 475], [513, 69, 503], [500, 69, 509], [491, 67, 505], [495, 67, 487], [508, 70, 480]],
    }
    this.EGGS = {
      1: [494.5, 105.8, 556.5],
      2: [472.5, 105.8, 518.5],
      3: [553.5, 105.8, 513.5],
      4: [510.5, 93.3, 470.5],
      5: [485.5, 65.3, 479.5],
      6: [533.5, 107.3, 556.5],
    }
    this.currentEggs = []

    // Overlay
    this.OVERLAY_ID = "HOPPITY"
    overlayManager.AddOverlay(this.ModuleName, this.OVERLAY_ID)
    overlayManager.AddOverlayBar(this.OVERLAY_ID, "PRESTIGE_PROGRESS", 1, "Next Prestige: Calculating...")
    overlayManager.AddOverlayBar(this.OVERLAY_ID, "UPGRADE_PROGRESS", 1, "Next Upgrade: Calculating...")

    getKeyBind(this.ModuleName, "Rdbt Client v4 - Misc").registerKeyPress(() => {
      global.export.FailsafeManager.unregister()

      if (this.state !== this.MACRO_STATES.OFF) {
        this.state = this.MACRO_STATES.OFF
        this.sendMacroMessage("§cStopping...")

        if (PathHelper.pathfinding) PathHelper.end(false)
        overlayManager.DisableOverlay(this.OVERLAY_ID)
        return
      }

      if (this.autoEvent) this.state = this.MACRO_STATES.EGG_HUNT

      global.export.FailsafeManager.register(
        cb => {
          if (this.state !== this.MACRO_STATES.OFF) {
            this.state = this.MACRO_STATES.OFF

            if (PathHelper.pathfinding) PathHelper.end(false)
            overlayManager.DisableOverlay(this.OVERLAY_ID)

            cb()
          }
        },
        () => {
          if (this.state === this.MACRO_STATES.OFF) this.start()
        },
        ["Block", "Rotation", "Teleport", "Velocity"],
      )

      this.sendMacroMessage("§9Starting...")
      this.start()
    })

    // Settings
    this.autoClick = true
    this.autoUpgrade = true
    this.autoTower = true
    this.autoPrestige = true

    this.autoEvent = false
    //this.buyRabbits = true
    register("step", () => {
      this.autoClick = ModuleManager.getSetting(this.ModuleName, "Auto Click")
      this.autoUpgrade = ModuleManager.getSetting(this.ModuleName, "Auto Upgrade")
      this.clickerCps = ModuleManager.getSetting(this.ModuleName, "Clicker CPS")
      this.autoTower = ModuleManager.getSetting(this.ModuleName, "Auto Tower")
      this.autoPrestige = ModuleManager.getSetting(this.ModuleName, "Auto Prestige")
      this.autoEvent = ModuleManager.getSetting(this.ModuleName, "Auto Event")
    }).setDelay(1)

    // Main macro loop
    register("step", () => {
      switch (this.state) {
        case this.MACRO_STATES.OFF:
          overlayManager.DisableOverlay(this.OVERLAY_ID)

          break
        case this.MACRO_STATES.MILESTONES:
        case this.MACRO_STATES.PRESTIGE:
          if (this.clickTimer.hasReached(1500)) {
            switch (Player.getContainer().getName()) {
              case "Chocolate Factory Milestones":
                Player.getContainer()
                  .getItems()
                  .forEach((item, slot) => {
                    if (slot <= 53 && item?.isEnchanted()) {
                      Player.getContainer().click(slot)
                      this.sendMacroMessage("&aClaimed milestone!")

                      this.start(false)
                    }
                  })

                break
              case "Confirm Prestige":
                Player.getContainer().click(11)
                this.sendMacroMessage("&aPrestige complete!")

                this.start(false)
                break
            }
          }

          // Timeout
          if (this.clickTimer.hasReached(3000) && Client.isInGui()) return this.start(false)
          else return
        case this.MACRO_STATES.RUNNING:
          if (!this.inFactory()) return

          this.getChocolateCount() // Update chocolate count

          // Perform click if ready
          if (this.clickTimer.hasReached(this.clickDelay)) {
            this.resetClicker()

            // Do click
            if (this.nextClick === 13 && !this.autoClick) return
            Player.getContainer().click(this.nextClick)

            // Set back to clicking chocolate
            if (this.nextClick !== 13 && Player.getContainer().getStackInSlot(13)?.getName()?.removeFormatting()?.endsWith("Chocolate")) this.nextClick = 13
          }

          break
        case this.MACRO_STATES.REJOIN:
          if (AutoReconnect.isReconnecting()) return

          AutoReconnect.start(this.autoEvent ? AutoReconnect.LOCATIONS.NUCLEUS : AutoReconnect.LOCATIONS.ISLAND)
          AutoReconnect.onFinish(() => {
            if (this.autoEvent) this.state = this.MACRO_STATES.EGG_HUNT
            this.start(false)
          })

          break
      }
    }).setFps(10)

    register("guiClosed", () => {
      if ((this.state !== this.MACRO_STATES.RUNNING && this.state !== this.MACRO_STATES.EGG_HUNT) || !this.restartTimer.hasReached(1000)) return

      Client.scheduleTask(20, () => (this.state = this.MACRO_STATES.IDLE))
      Client.scheduleTask(50, () => {
        if (this.state !== this.MACRO_STATES.IDLE || (Client.isInGui() && !Client.isInChat()) || AutoReconnect.isReconnecting()) return

        this.state = this.MACRO_STATES.OFF
        this.sendMacroMessage("&cChocolate Factory closed.")

        global.export.FailsafeManager.unregister()
      })
    })

    register("worldUnload", () => {
      if (this.state === this.MACRO_STATES.IDLE || this.state === this.MACRO_STATES.OFF) return

      this.state = this.MACRO_STATES.REJOIN
      this.sendMacroMessage("&cKicked from server! Travelling to island...")
    })

    register("renderWorld", () => {
      if (!this.autoEvent || AutoReconnect.getCurrentArea() !== AutoReconnect.LOCATIONS.CH) return

      RenderUtils.renderCords([
        [494, 106, 556],
        [472, 106, 518],
        [553, 106, 513],
        [510, 93, 470],
        [485, 65, 479],
      ])
    })

    // Update state loop
    register("step", () => {
      // Update overlay time
      overlayManager.UpdateOverlayLine(this.OVERLAY_ID, "TIME", `Session Time: ${NumberUtils.timeSince(this.startTime)}`)

      // Not running
      if (this.state !== this.MACRO_STATES.RUNNING && this.state !== this.MACRO_STATES.IDLE) return

      // Switch state based on menu
      if (Player.getContainer()?.getName() === "Chocolate Factory Milestones") this.state = this.MACRO_STATES.MILESTONES
      else if (Player.getContainer()?.getName() === "Confirm Prestige") this.state = this.MACRO_STATES.PRESTIGE

      if (!this.inFactory() || this.state !== this.MACRO_STATES.RUNNING) return

      Player.getContainer()
        .getItems()
        .forEach((item, slot) => {
          if (!item) return

          if (item.getName()?.removeFormatting()?.toLowerCase()?.includes("click me!")) {
            // Auto bonus item
            this.nextClick = slot
            this.sendMacroMessage("§aCaptured bonus item!")
          } else if (slot === 39 && !item.isEnchanted() && this.isTowerReady()) {
            // Auto Tower when not already in use, and a charge is available
            Player.getContainer().click(39, false, "RIGHT")
            this.resetClicker()

            this.sendMacroMessage("§aActivated Time Tower!")
          } else if (slot === 53 && item?.isEnchanted()) {
            // Milestones
            this.nextClick = slot
            this.sendMacroMessage("§aClaiming milestones!")
          } else if (slot === 27 && item?.isEnchanted() && this.autoPrestige) {
            // Prestige
            this.nextClick = slot
            this.sendMacroMessage("§aPrestiging!")
          }
        })
      if (this.nextClick !== 13) return this.resetClicker()

      let options = []
      this.getLores(Player.getContainer()).forEach((lore, i) => {
        let loreStr = lore
          .map(l => l.removeFormatting())
          .filter(l => l?.length)
          .join(" ")

        let cps = this.currentCps(loreStr)
        let upgradeCps = this.upgradeCps(loreStr)
        let upgradeCost = this.getUpgradeCost(loreStr)

        if (!upgradeCost) return

        // Unemployed purchaser
        if (this.checkUnemployed(loreStr))
          return options.push({
            index: i,
            name: "New Staff",
            currentCps: 0,
            upgradeCps: Number.MAX_VALUE,
            upgradeCost: upgradeCost,
          })

        // Barn upgrader
        let barnSpace = this.getRemainingBarnSpace(loreStr)
        if (barnSpace !== null && barnSpace <= 10 && upgradeCost <= this.getChocolateCount())
          return options.push({
            index: i,
            name: "Barn",
            currentCps: 0,
            upgradeCps: Number.MAX_VALUE - 1,
            upgradeCost: upgradeCost,
          })

        // Jackrabbit upgrader
        if (this.slots[i] === 42) {
          const stats = this.getProductionStats()

          // Weighted lower than other upgrades
          const tCps = (upgradeCps - 0.01) * stats.cps
          const tUpgradeCps = upgradeCps * stats.cps

          return options.push({
            index: i,
            name: "Jackrabbit",
            currentCps: tCps,
            upgradeCps: tUpgradeCps,
            upgradeCost: upgradeCost,
          })
        }

        // Time Tower upgrader
        if (this.autoTower && this.slots[i] === 39 && !Player.getContainer()?.getStackInSlot(39)?.isEnchanted()) {
          const stats = this.getProductionStats()

          // Calculate average CPS boost
          const tCps = ((upgradeCps - 0.1) * stats.cps * 1) / 8
          const tUpgradeCps = (upgradeCps * stats.cps * 1) / 8

          return options.push({
            index: i,
            name: "Time Tower",
            currentCps: tCps,
            upgradeCps: tUpgradeCps,
            upgradeCost: upgradeCost,
          })
        }

        // Hand-Baked upgrader
        let manualCps = this.manualCps(loreStr)
        if (manualCps.length === 2)
          return options.push({
            index: i,
            name: "Hand-Baked",
            currentCps: manualCps[0],
            upgradeCps: manualCps[1],
            upgradeCost,
          })

        if (upgradeCps)
          options.push({
            index: i,
            name: this.getStaffName(loreStr) ?? "Staff",
            currentCps: cps,
            upgradeCps,
            upgradeCost,
          })
      })
      if (this.nextClick !== 13) return this.resetClicker() // Upgrade override

      let bestScore = null
      let bestOption = null
      options.forEach(upgrade => {
        let coinsPerCps = (upgrade.upgradeCps - upgrade.currentCps) / upgrade.upgradeCost
        if (!coinsPerCps) return

        if (!bestScore) bestScore = coinsPerCps
        if (coinsPerCps >= bestScore) {
          // Favours higher tier if the ratio is the same (unlikely)
          bestScore = coinsPerCps
          bestOption = upgrade
        }
      })

      if (!bestOption) return

      const chocolateCount = this.getChocolateCount()
      const upgradeString = "Next Upgrade: " + bestOption.name

      overlayManager.UpdateOverlayLine(this.OVERLAY_ID, "CHOCOLATE", ("Chocolate: " + NumberUtils.addNotation(chocolateCount)).padEnd(upgradeString.length * 2, " "))
      overlayManager.UpdateOverlayBar(this.OVERLAY_ID, "PRESTIGE_PROGRESS", this.getPrestigeProgress(), `Next Prestige: ${this.getNextPrestigeString() ?? "?"}`)
      overlayManager.UpdateOverlayBar(this.OVERLAY_ID, "UPGRADE_PROGRESS", MathLib.clampFloat(chocolateCount / bestOption.upgradeCost, 0, 1), upgradeString)

      // Perform Upgrade
      if (this.autoUpgrade && bestOption.upgradeCost <= chocolateCount) {
        this.nextClick = this.slots[bestOption.index]
        this.sendMacroMessage(`&aUpgrading ${bestOption.name} for ${NumberUtils.addNotation(bestOption.upgradeCost)} chocolate!`)
      }
    }).setDelay(1)

    register("chat", () => {
      // Egg hunt egg check
      if (this.autoEvent && this.inFactory()) {
        Client.scheduleTask(20, () => {
          let newEggs = World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand)
            .filter(entity => entity.getY() % 1 === 0.53125 && Object.values(this.EGGS).some(egg => entity.distanceTo(new BlockPos(egg[0], egg[1], egg[2])) < 2))
            .map(egg => Object.values(this.EGGS).find(e => egg.distanceTo(new BlockPos(e[0], e[1], e[2])) < 2))
          let filteredEggs = newEggs.filter(egg => !this.currentEggs.includes(egg))

          if (this.currentEggs.length && filteredEggs.length) {
            this.sendMacroMessage("Detected egg change!")

            this.currentEggs = newEggs
            this.state = this.MACRO_STATES.EGG_HUNT
            filteredEggs.forEach(egg => this.doEggHunt(Object.values(this.EGGS).indexOf(egg) + 1 ?? 0))
          } else this.currentEggs = newEggs
        })
      }
    }).setCriteria("HOPPITY'S HUNT A ${msg} has appeared!")
  }

  start(resetTime = true) {
    if (this.state === this.MACRO_STATES.EGG_HUNT) return this.doEggHunt()

    ChatLib.command("chocolatefactory")

    if (resetTime) this.startTime = Date.now()
    this.state = this.MACRO_STATES.RUNNING

    this.nextClick = 13
    this.resetClicker()
    this.restartTimer.reset()

    if (ModuleManager.getSetting(this.ModuleName, "Overlay")) overlayManager.EnableOverlay(this.OVERLAY_ID)

    overlayManager.UpdateOverlayBar(this.OVERLAY_ID, "PRESTIGE_PROGRESS", 1, "Next Prestige: Calculating...")
    overlayManager.UpdateOverlayBar(this.OVERLAY_ID, "UPGRADE_PROGRESS", 1, "Next Upgrade: Calculating...")
    overlayManager.AddOverlayText(this.OVERLAY_ID, "CHOCOLATE", "Chocolate: 0".padEnd(29 * 2, " "))
    overlayManager.AddOverlayText(this.OVERLAY_ID, "TIME", `Session Time: 0s`)
  }

  sendMacroMessage(msg) {
    chat.message(this.ModuleName + ": " + msg)
  }

  getClickerDelay() {
    const delay = Math.round(1000 / this.clickerCps)
    return Utils.getRandomInRange(delay - delay * 0.1, delay + delay * 0.1)
  }

  resetClicker() {
    this.clickTimer.reset()
    this.clickDelay = this.getClickerDelay()
  }

  // Event

  doEggHunt(target = 0) {
    if (!this.autoEvent || this.state !== this.MACRO_STATES.EGG_HUNT) return
    if (Client.isInGui() && !Client.isInChat()) Player.getPlayer().func_71053_j()
    AutoReconnect.start(AutoReconnect.LOCATIONS.NUCLEUS)

    let index = 1
    const callback = () => {
      const egg = this.EGGS[index]
      if (!egg) {
        this.state = this.MACRO_STATES.IDLE
        this.start(target === 0)
        return
      }
      if ((target && index !== target) || !World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).some(entity => entity.getY() % 1 === 0.53125 && entity.distanceTo(new BlockPos(egg[0], egg[1], egg[2])) < 2)) {
        index++
        return callback()
      }

      PathHelper.followPath(this.PATHS[index])
      PathHelper.onFinish(() => {
        Rotations.rotateTo(egg)
        Rotations.onEndRotation(() => {
          const entity = World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).find(entity => entity.getY() % 1 === 0.53125 && entity.distanceTo(new BlockPos(egg[0], egg[1], egg[2])) < 2)
          if (entity) Client.getMinecraft().field_71442_b.func_78768_b(Player.getPlayer(), entity.getEntity())

          Client.scheduleTask(30, () => {
            Player.getPlayer().func_71053_j()
            PathHelper.followPath(this.PATHS[index].concat().reverse())
            PathHelper.onFinish(() => {
              Client.scheduleTask(1, () => {
                if (index === target) {
                  this.state = this.MACRO_STATES.IDLE

                  AutoReconnect.start(AutoReconnect.LOCATIONS.NUCLEUS)
                  AutoReconnect.onFinish(() => this.start(target === 0))
                  return
                }

                index++
                callback()
              })
            })
          })
        })
      })
    }

    AutoReconnect.onFinish(() => {
      // Update state and eggs on arrival
      this.state = this.MACRO_STATES.EGG_HUNT
      this.currentEggs = World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand)
        .filter(entity => entity.getY() % 1 === 0.53125 && Object.values(this.EGGS).some(egg => entity.distanceTo(new BlockPos(egg[0], egg[1], egg[2])) < 2))
        .map(egg => Object.values(this.EGGS).find(e => egg.distanceTo(new BlockPos(e[0], e[1], e[2])) < 2))

      this.sendMacroMessage("&9Starting egg hunt!")
      callback()
    })
  }

  // Chocolate Utils

  inFactory() {
    return Player.getContainer()?.getName() === "Chocolate Factory" && Date.now() - this.startTime >= 1000
  }

  getChocolateCount() {
    let count = parseInt(Player.getContainer().getStackInSlot(13)?.getName()?.removeFormatting()?.split(" ")?.[0]?.replaceAll(",", ""))
    if (!count) count = parseInt(Client.currentGui.getSlotUnderMouse()?.getItem()?.getName()?.removeFormatting()?.split(" ")?.[0]?.replaceAll(",", ""))

    if (!count) return this.cachedCount

    this.cachedCount = count
    return count
  }

  getNextPrestigeString() {
    const PRESTIGES = ["I", "II", "III", "IV", "V", "VI", "Complete!"]
    return PRESTIGES[PRESTIGES.indexOf(/Chocolate Factory (\w+)/.exec(Player.getContainer()?.getStackInSlot(27)?.getName()?.removeFormatting())?.[1]) + 1]
  }

  getPrestigeProgress() {
    let progress = 0
    try {
      let loreStr = Player.getContainer()
        .getStackInSlot(27)
        .getLore()
        .map(l => l.removeFormatting())
        .filter(l => l?.length)
        .join(" ")

      let prestigeProgress = parseInt(/Chocolate this Prestige: ([\d,]+)/.exec(loreStr)?.[1]?.replaceAll(",", ""))
      let prestigeCost = parseInt(/Requires ([\dBM]+) Chocolate this Prestige!/.exec(loreStr)?.[1]?.replaceAll(",", "").replaceAll("B", "000000000").replaceAll("M", "000000"))

      if (prestigeProgress && prestigeCost) progress = MathLib.clampFloat(prestigeProgress / prestigeCost, 0, 1)
    } catch (e) {}

    return progress
  }

  getProductionStats() {
    let stats = { cps: 0, multiplier: 1 }
    try {
      let loreStr = Player.getContainer()
        .getStackInSlot(45)
        .getLore()
        .map(l => l.removeFormatting())
        .filter(l => l?.length)
        .join(" ")

      stats.multiplier = parseFloat(/Total Multiplier: ([\d.]+)x/.exec(loreStr)?.[1]?.replaceAll(",", "")) ?? stats.multiplier
      stats.cps = (parseFloat(/([\d,.]+) Chocolate per second/.exec(loreStr)?.[1]?.replaceAll(",", "")) ?? stats.cps) / stats.multiplier
    } catch (e) {}

    return stats
  }

  isTowerReady() {
    return /Right-click to activate!/.test(
      Player.getContainer()
        ?.getStackInSlot(39)
        ?.getLore()
        ?.map(l => l.removeFormatting())
        ?.filter(l => l?.length)
        ?.join(" "),
    )
  }

  getLores(container) {
    return this.slots.map(s => container.getStackInSlot(s)?.getLore()).filter(l => l)
  }

  getStaffName(lore) {
    return /Rabbit (\w+) - \[/.exec(lore)?.[1]
  }

  checkUnemployed(lore) {
    return /Rabbit (\w+) - Unemployed/.test(lore)
  }

  getUpgradeCost(text) {
    const regex = /Cost ([\d,]+) Chocolate/
    const match = text.match(regex)

    if (match && match[1]) return parseInt(match[1].replaceAll(",", ""))
    else return null
  }

  currentCps(text) {
    return parseInt(/produce \+([,0-9]+) Chocolate per second!/.exec(text)?.[1]?.replaceAll(",", ""))
  }

  upgradeCps(text) {
    return parseFloat(/  \+([x.,0-9]+) Chocolate per second/.exec(text)?.[1]?.replaceAll(",", "")?.replace("x", ""))
  }

  manualCps(text) {
    // Multiplied by average clicks per second
    const currentCps = parseInt(/Chocolate Per Click: \+([,0-9]+) Chocolate/.exec(text)?.[1]?.replaceAll(",", "")) * (1 / 0.15)
    const upgradeCps = parseInt(/  \+([,0-9]+) Chocolate per click/.exec(text)?.[1]?.replaceAll(",", "")) * (1 / 0.15)

    return [currentCps, upgradeCps].filter(c => c)
  }

  getRemainingBarnSpace(text) {
    const match = /Your Barn: (\d+(?:,\d+)*)\/(\d+(?:,\d+)*) Rabbits/g.exec(text)
    if (match?.length !== 3) return null

    return parseInt(match[2].replaceAll(",", "")) - parseInt(match[1].replaceAll(",", ""))
  }
}

global.export.HoppityMacro = new hoppityMacro()
