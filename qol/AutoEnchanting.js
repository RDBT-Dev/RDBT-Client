let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection
let {  chat, ItemUtils, GuiUtils, TimeHelper, Utils } = global.export

global.modules.push(
  new ConfigModuleClass(
    "Auto Enchanting",
    "Extras",
    [
      new SettingToggle("Enabled", false),
      new SettingToggle("Auto Pairs", true),
      new SettingSlider("Click Delay", 350, 200, 1000),
      new SettingSlider("Serums", 0, 0, 3),
      //new SettingSlider("Rerolls", 0, 0, 3)
    ],
    [
      "Completes the enchanting table for you!",
      "WIP",
      //"Also rerolls the table as configured"
    ],
  ),
)

// TODO
// - auto re-roll with detection for existing rerolls
// - auto pairs (click through and add to array, if already in array push those clicks in an array of next clicks then once empty continue again, track clicked slots to know which to visit next)
// - auto fix xp levels (use bottles in hotbar, avoid using won bottles, warn if none when starting)

class autoEnchanting {
  constructor() {
    this.ModuleName = "Auto Enchanting"

    // Settings
    this.enabled = ModuleManager.getSetting(this.ModuleName, "Enabled")
    this.autoPairs = ModuleManager.getSetting(this.ModuleName, "Auto Pairs")
    this.clickDelay = ModuleManager.getSetting(this.ModuleName, "Click Delay")
    this.serums = ModuleManager.getSetting(this.ModuleName, "Serums")
    //this.rerolls = ModuleManager.getSetting(this.ModuleName, "Rerolls")
    register("step", () => {
      this.enabled = ModuleManager.getSetting(this.ModuleName, "Enabled")
      this.autoPairs = ModuleManager.getSetting(this.ModuleName, "Auto Pairs")
      this.serums = ModuleManager.getSetting(this.ModuleName, "Serums")
      //this.rerolls = ModuleManager.getSetting(this.ModuleName, "Rerolls")

      const delay = ModuleManager.getSetting(this.ModuleName, "Click Delay") ?? 300
      this.clickDelay = Utils.getRandomInRange(delay - 50, delay + 50)
    }).setDelay(1)

    this.STATES = {
      OFF: -1,
      MENU: 0,
      SELECTION: 1,
      ULTRASEQUENCER: 2,
      CHRONOMATRON: 3,
      SUPERPAIRS: 4,
      OVER: 5,
    }

    this.superPairs = new Map()
    this.PAIRS_IGNORE = ["minecraft:stained_glass", "minecraft:stained_glass_pane", "minecraft:clock", "minecraft:diamond", "minecraft:feather", "minecraft:bookshelf"]

    this.clicks = 0
    this.clickOrder = []
    this.clickTimer = new TimeHelper()

    register("step", () => {
      if (!this.enabled) return

      const items = Player.getContainer()?.getItems()
      if (!items) return

      switch (this.getState()) {
        case this.STATES.ULTRASEQUENCER:
          if (this.clicks === 9 - this.serums) return Player.getPlayer().func_71053_j()

          // Scanner
          if (items[49]?.getRegistryName() !== "minecraft:clock") {
            if (this.clickOrder.length > 0) return
            this.reset()

            for (let i = 9; i < 45; i++) {
              const item = items[i]
              if (item.getRegistryName() !== "minecraft:dye") continue

              this.clickOrder.push({
                slot: i,
                size: item.getStackSize(),
              })
            }

            this.clickOrder.sort((a, b) => a.size - b.size) // Sort by stack size
          } else if (this.clickOrder.length > 0 && this.clickTimer.hasReached(this.clickDelay)) {
            this.clicks++
            this.clickTimer.reset()

            // Solver
            let item = this.clickOrder.shift()
            if (item.slot) Player.getContainer().click(item.slot)
          }

          break
        case this.STATES.CHRONOMATRON:
          if (this.clicks === 12 - this.serums) return Player.getPlayer().func_71053_j()

          // Scanner
          if (items[49]?.getRegistryName() === "minecraft:clock" && this.clickOrder.length < this.getRound()) {
            this.clicks = 0
            for (let i = 9; i < 45; i++) {
              const item = items[i]
              if (item?.isEnchanted()) return this.clickOrder.push(i)
            }
          } else if (this.clickOrder.length > this.clicks && this.clickTimer.hasReached(this.clickDelay)) {
            // Solver
            const slot = this.clickOrder[this.clicks]
            if (slot) Player.getContainer().click(slot)

            this.clicks++
            this.clickTimer.reset()
          }

          break
        case this.STATES.SUPERPAIRS:
          if (!this.autoPairs) return

          if (!this.clickOrder.length) this.clickOrder = [10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43] // TODO grid of all the tiles here
          if (!this.clickTimer.hasReached(this.clicks % 2 === 0 ? this.clickDelay * 6 : this.clickDelay * 3)) return

          // Find revealed items
          items
            .map((item, i) => {
              return { item, slot: i }
            })
            .filter((item, i) => item.slot < 54 && item.item && !this.PAIRS_IGNORE.includes(item.item.getRegistryName()))
            .forEach((item, i, arr) => {
              // Item's pair already found
              if (
                this.superPairs.has(item.item.getRegistryName() + item.item.getDamage()) &&
                this.superPairs.get(item.item.getRegistryName() + item.item.getDamage()) !== item.slot &&
                this.PAIRS_IGNORE.includes(items[this.superPairs.get(item.item.getRegistryName() + item.item.getDamage())].getRegistryName())
              ) {
                this.clickOrder.unshift(this.superPairs.get(item.item.getRegistryName() + item.item.getDamage()))
                if (arr.length % 2 === 0) this.clickOrder.unshift(item.slot)
              } else this.superPairs.set(item.item.getRegistryName() + item.item.getDamage(), item.slot)
            })

          // Solver
          let item = this.clickOrder.shift()
          if (item) Player.getContainer().click(item)

          this.clickTimer.reset()
          this.clicks++
          break
        case this.STATES.OVER:
          if (!this.clickTimer.hasReached(this.clickDelay * 2)) return
          this.sendMacroMessage("§aCompleted experiment!")

          const slot = items
            .map((item, i) => {
              return { item, i }
            })
            .find(slot => slot.item?.getRegistryName() === "minecraft:skull")
          Player.getContainer().click(slot.i ?? 13)

          // Re-open table
          this.clickTimer.reset()
          Client.scheduleTask(20, () => this.clickTimer.reset())
          ItemUtils.rightClick(20)

          break
        case this.STATES.MENU:
          if (!this.clickTimer.hasReached(this.clickDelay * 2)) return

          if (!items[21]?.isEnchanted() && items[21]?.getRegistryName() === "minecraft:stained_glass_pane") Player.getContainer().click(29)
          else if (!items[23]?.isEnchanted() && items[23]?.getRegistryName() === "minecraft:stained_glass_pane") Player.getContainer().click(33)
          else if (!this.alerted && items[22]?.getRegistryName() === "minecraft:skull" && !items[31]?.isEnchanted()) {
            if (!this.autoPairs) global.export.NotificationUtils.sendAlert("Super Pairs ready!")
            else Player.getContainer().click(22)
            this.alerted = true
          }

          this.clickTimer.reset()
          break
        case this.STATES.SELECTION:
          if (!this.clickTimer.hasReached(this.clickDelay * 2)) return

          const highestExperiment = items
            .map((item, i) => {
              return { item, i }
            })
            .reverse()
            .find(slot => slot.item?.getRegistryName() === "minecraft:dye" && slot.item?.getDamage() !== 8)
          if (highestExperiment.i) Player.getContainer().click(highestExperiment.i)

          this.clickTimer.reset()
          break
        case this.STATES.OFF:
          this.reset()
          break
      }
    }).setFps(10)

    // XP level check
    register("chat", event => {
      if (this.getState() !== this.STATES.SELECTION) return

      this.sendMacroMessage("Not enough XP levels! Stopping...") // TODO auto fix
      cancel(event)

      Player.getPlayer().func_71053_j()
    }).setCriteria("Your Minecraft level is too low to start this experiment!")

    register("guiClosed", () => this.reset())

    // Show superpairs
    /*register("renderItemIntoGui", () => {
            if (!this.enabled || this.getState() !== this.STATES.SUPERPAIRS) return

            this.superPairs.forEach((item, i) => {
                if (!item) return

                try {
                    Player.getPlayer().field_71070_bA?.func_75141_a(item.slot, new net.minecraft.item.ItemStack(item.stack))

                    const stack = Player.getContainer().getStackInSlot(i)
                    stack.setName(item.name)
                    stack.setDamage(item.meta)
                    stack.setLore(item.lore.map(s => s.toString()))
                } catch (e) {} // TODO make this properly work
            })
        })*/

    // Hide tooltip
    register("itemTooltip", (lore, item, event) => {
      if (!this.enabled || this.getState() === this.STATES.OFF) return

      if (item.getRegistryName() === "minecraft:stained_glass_pane") cancel(event)
    })
  }

  getState() {
    const name = Player.getContainer()?.getName()
    if (!name) return this.STATES.OFF

    if (/^Experimentation Table/.test(name)) return this.STATES.MENU
    else if (/(.*) ➜ Stakes/.test(name)) return this.STATES.SELECTION
    else if (/Ultrasequencer \(/.test(name)) return this.STATES.ULTRASEQUENCER
    else if (/Chronomatron \(/.test(name)) return this.STATES.CHRONOMATRON
    else if (/Superpairs \(/.test(name)) return this.STATES.SUPERPAIRS
    else if (/Experiment Over/.test(name)) return this.STATES.OVER
    else return this.STATES.OFF
  }

  getRound() {
    return parseInt(Player.getContainer()?.getStackInSlot(4)?.getName()?.removeFormatting()?.split("Round: ")[1])
  }

  reset() {
    this.superPairs.clear()
    this.clickOrder = []
    this.clicks = 0

    this.alerted = false
  }

  sendMacroMessage(msg) {
    chat.message(this.ModuleName + ": " + msg)
  }
}

new autoEnchanting()
