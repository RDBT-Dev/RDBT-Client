let { Failsafe, TimeHelper, chat, registerEventSB, Utils } = global.export
let { ModuleManager } = global.settingSelection

class ServerFailsafe extends Failsafe {
  constructor() {
    super()

    this.wasOreMacroActive = false
    this.lastRoute = 0

    this.triggers = [
      // Store OreMacro state and route before server changes
      register("worldUnload", () => {
        if (!this.toggle) return
        this.wasOreMacroActive = global.export.OreMacro?.Enabled || false
        if (this.wasOreMacroActive) {
          this.lastRoute = ModuleManager.getSetting("Etherwarper", "Etherwarper Route")
          chat.debugMessage(`&b[ServerFailsafe] OreMacro was active. Storing last route: ${this.lastRoute}.`)
        }
      }),

      // Handle world changes and restart Etherwarper if needed
      register("worldLoad", () => {
        if (!this.toggle || !this.wasOreMacroActive) return

        chat.message("AutoVegetable " + "&2World changed, restarting Etherwarper...")
        Client.scheduleTask(200, () => {
          try {
            // ModuleManager.setSetting("Etherwarper", "Etherwarper Route", this.lastRoute)
            chat.debugMessage("&b[ServerFailsafe] Attempting to restart Etherwarper.")
            global.export.Etherwarper?.toggle()
          } catch (e) {
            chat.message("AutoVegetable " + "&cFailed to restart Etherwarper: " + e)
            chat.debugMessage(`&c[ServerFailsafe] Failed to restart Etherwarper: ${e}`)
          }
        })
        this.wasOreMacroActive = false
      }),

      // Handle evacuation messages
      register("chat", event => {
        if (!this.toggle) return
        chat.debugMessage("&c[ServerFailsafe] Evacuation message detected. Triggering failsafe.")
        global.export.FailsafeManager.trigger("Server", "Evacuation detected!")
      }).setCriteria("§r§c⚠ §r§eEvacuating to Hub...§r"),

      // Handle server restarts
      register("chat", event => {
        if (!this.toggle) return
        chat.debugMessage("&c[ServerFailsafe] Server restart message detected. Triggering failsafe.")
        global.export.FailsafeManager.trigger("Server", "Server restart detected!")
      }).setCriteria("§r§cServer closing in ${time}§r"),

      // Handle limbo
      register("chat", event => {
        if (!this.toggle) return
        chat.debugMessage("&c[ServerFailsafe] Limbo message detected. Triggering failsafe.")
        global.export.FailsafeManager.trigger("Server", "Limbo Detected!")
        // todo : add recovery
      }).setCriteria("/limbo for more information."),
    ]

    registerEventSB("serverchange", () => {
      if (!this.toggle) return
      //Utils.warnPlayer("Server", `Server Change Detected!`)
      if (ModuleManager.getSetting("Other", "Auto Restart with Etherwarper")) {
        Client.scheduleTask(120, () => {
          global.export.Etherwarper?.toggle()
        })
      }
    })
  }

  reset() {
    this.triggered = false
    this.wasOreMacroActive = false
    this.lastRoute = 0
  }
}

global.export.ServerFailsafe = new ServerFailsafe()
