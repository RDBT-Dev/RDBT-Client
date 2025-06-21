let { TeleportFailsafe, Failsafe, chat } = global.export
let { ModuleManager } = global.settingSelection

class VelocityFailsafe extends Failsafe {
  constructor() {
    super()

    this.THRESHOLD = 10000
    register("step", () => {
      switch (ModuleManager.getSetting("Failsafes", "Failsafe Sensitivity")) {
        case "Relaxed":
          this.THRESHOLD = 12500
          break
        case "Normal":
          this.THRESHOLD = 7500
          break
        case "High":
          this.THRESHOLD = 5000
          break
        case "Strict":
          this.THRESHOLD = 2500
          break
        default:
          this.THRESHOLD = 10000
          break
      }
      if (global.export.CommissionMacro) this.THRESHOLD *= 2
      if (global.export.CommissionMacro.state === global.export.CommissionMacro.MacroStates.GOBLINSLAYER) this.THRESHOLD *= 3 // 6x
      if (global.export.CommissionMacro.state === global.export.CommissionMacro.MacroStates.ICEWALKERSLAYER) this.THRESHOLD *= 2 // 4x
    }).setDelay(1)

    this.triggers = [
      register("packetReceived", packet => {
        if (!this.toggle || Player.getPlayer().func_145782_y() !== packet.func_149412_c() /*  || TeleportFailsafe.isTeleporting() */) return

        if (Math.abs(packet.func_149411_d()) >= this.THRESHOLD || Math.abs(packet.func_149410_e()) >= this.THRESHOLD || Math.abs(packet.func_149409_f()) >= this.THRESHOLD) {
          chat.debugMessage(`&c[VelocityFailsafe] Velocity threshold exceeded (x: ${packet.func_149411_d()}, y: ${packet.func_149410_e()}, z: ${packet.func_149409_f()}). Threshold: ${this.THRESHOLD}. Triggering failsafe.`)
          global.export.FailsafeManager.trigger("Velocity")
        }
      }).setFilteredClass(net.minecraft.network.play.server.S12PacketEntityVelocity),
    ]
  }
}

global.export.VelocityFailsafe = new VelocityFailsafe()
