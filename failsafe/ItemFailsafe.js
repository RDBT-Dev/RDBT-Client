let { TeleportFailsafe, Failsafe, Utils, chat, registerEventSB } = global.export

class ItemFailsafe extends Failsafe {
  constructor() {
    super()

    this.items = []

    this.triggered = false

    registerEventSB("serverchange", () => {
      this.reset()
    }),
      (this.triggers = [
        register("worldLoad", this.reset),

        register("step", () => {
          if (!this.toggle || this.triggered /*  || TeleportFailsafe.isTeleporting() */) return
          if (!TeleportFailsafe.warpTimer.hasReached(1500)) return
          if (global.export.OreMacro && global.export.OreMacro.getIsRefueling()) return
          if (global.export.CommissionMacro && global.export.CommissionMacro.isRefueling()) return
          if (Player.getContainer()?.getName() === "Trades") return

          let playerInventory = Player.getInventory()
          if (!playerInventory) return

          this.items.forEach(item => {
            if (!item || !item.slot) return

            if (playerInventory.getStackInSlot(item.slot)?.getName() !== item.name && item.name.charAt(item.name.length - 3) + item.name.charAt(item.name.length - 2) !== " x") {
              chat.debugMessage(`&c[ItemFailsafe] Item mismatch detected in slot ${item.slot}: Expected "${item.name}", Found "${playerInventory.getStackInSlot(item.slot)?.getName()}". Scheduling failsafe.`)
              this.scheduleFailsafe()
            }
          })

          playerInventory.getItems().forEach((item, slot) => {
            if (slot >= 9) return // Only check hotbar
            if (item?.getID() === 166 || item?.getID() === 7) {
              // barrier or bedrock
              chat.debugMessage(`&c[ItemFailsafe] Invalid item detected in hotbar slot ${slot}: ID ${item?.getID()}. Scheduling failsafe.`)
              this.scheduleFailsafe()
            }
          })
        }).setFps(4),

        register("tick", () => {
          if (!this.toggle) return
          if (!TeleportFailsafe.warpTimer.hasReached(1500)) this.reset()
          if (this.triggered && this.responseTimer.hasReached(this.waitTime)) {
            chat.debugMessage("&c[ItemFailsafe] Scheduled failsafe triggered.")
            if (this.toggle) global.export.FailsafeManager.trigger("Item")
            this.triggered = false
            this.items = []
          }
        }),

        // Disable failsafe while pickonimbus is broken TODO improve detection
        register("chat", event => {
          chat.debugMessage("&c[ItemFailsafe] Pickonimbus broken message detected. Disabling failsafe temporarily.")
          this.toggle = false
          Client.scheduleTask(100, () => {
            this.toggle = true
            chat.debugMessage("&c[ItemFailsafe] Pickonimbus detection window ended. Re-enabling failsafe.")
          })
        }).setCriteria("Oh no! Your ${msg}"),

        register("packetReceived", packet => {
          if (!this.toggle || this.triggered /*  || TeleportFailsafe.isTeleporting() */) return
          if (!TeleportFailsafe.warpTimer.hasReached(1500)) return
          if (global.export.OreMacro && global.export.OreMacro.getIsRefueling()) return
          if (global.export.CommissionMacro && global.export.CommissionMacro.isRefueling()) return
          if (Player.getContainer()?.getName() === "Trades") return

          if (Player.getHeldItemIndex() !== packet.func_149385_c()) {
            chat.debugMessage(`&c[ItemFailsafe] S09PacketHeldItemChange detected. Held item index changed from ${Player.getHeldItemIndex()} to ${packet.func_149385_c()}. Scheduling failsafe.`)
            this.scheduleFailsafe()
          }
        }).setFilteredClass(net.minecraft.network.play.server.S09PacketHeldItemChange),

        // Monitor items the player switches to during macro (TODO improve)
        register("packetSent", packet => {
          const item = Player.getInventory().getStackInSlot(packet.func_149614_c())
          const json = { name: item?.getName(), slot: packet.func_149614_c() }
          if (!item || this.items.includes(json)) return

          this.items.push(json)
        }).setFilteredClass(net.minecraft.network.play.client.C09PacketHeldItemChange),
      ])
  }

  scheduleFailsafe() {
    chat.debugMessage("&c[ItemFailsafe] Scheduling failsafe...")
    this.triggered = true
    this.responseTimer.reset()
    this.waitTime = Utils.getRandomInRange(250, 550)
  }

  reset() {
    this.triggered = false
    this.items = []
  }
}

global.export.ItemFailsafe = new ItemFailsafe()
