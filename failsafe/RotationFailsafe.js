let { TeleportFailsafe, Failsafe, Utils, TimeHelper, chat } = global.export
let { ModuleManager } = global.settingSelection

// TODO -> beat interpolation
class RotationFailsafe extends Failsafe {
  constructor() {
    super()

    // Settings
    this.THRESHOLD = 0.29
    this.FLAG_THRESHOLD = 5
    this.isChangingWorld = false

    register("step", () => {
      switch (ModuleManager.getSetting("Failsafes", "Failsafe Sensitivity")) {
        case "Relaxed":
          this.THRESHOLD = 0.35
          this.FLAG_THRESHOLD = 8
          break
        case "Normal":
          this.THRESHOLD = 0.3
          this.FLAG_THRESHOLD = 6
          break
        case "High":
          this.THRESHOLD = 0.25
          this.FLAG_THRESHOLD = 4
          break
        case "Strict":
          this.THRESHOLD = 0.2
          this.FLAG_THRESHOLD = 2
          break
        default:
          this.THRESHOLD = 0.25
          this.FLAG_THRESHOLD = 4
          break
      }
    }).setDelay(1)

    // new test shit
    this.totalYawChange = 0
    this.totalPitchChange = 0
    this.packetTimer = new TimeHelper()

    this.flagTimer = new TimeHelper()
    this.flags = 0

    this.triggers = [
      // Add world change detection
      register("worldUnload", () => {
        this.isChangingWorld = true
        this.reset()
      }),

      register("worldLoad", () => {
        Client.scheduleTask(20, () => {
          this.isChangingWorld = false
        })
      }),

      register("packetReceived", packet => {
        // Add world change check
        if (!this.toggle || this.triggered || this.isChangingWorld || !TeleportFailsafe.warpTimer.hasReached(1500) /*  || TeleportFailsafe.isTeleporting() || TeleportFailsafe.isInLagback() */) return

        const dYaw = Math.abs(net.minecraft.util.MathHelper.func_76142_g(packet.func_148931_f() - Player.getRawYaw()))
        const dPitch = Math.abs(packet.func_148930_g() - Player.getPitch())

        chat.debugMessage(`&c[RotationFailsafe] Packet Received (dYaw: ${dYaw.toFixed(2)}, dPitch: ${dPitch.toFixed(2)}).`)

        if (TeleportFailsafe.itemTeleport > 0) {
          chat.debugMessage("&c[RotationFailsafe] Item Teleport Detected! Ignoring rotation.")
          return
        }

        if (dYaw === 360) return // || Player.getPlayer().field_70737_aN >= 5 -> Return if player has just been damaged

        if (this.packetTimer.hasReached(2000)) {
          this.totalYawChange = dYaw
          this.totalPitchChange = dPitch
          this.packetTimer.reset()
        } else {
          this.totalYawChange += dYaw
          this.totalPitchChange += dPitch
          this.packetTimer.reset()
        }

        if (this.totalYawChange >= this.THRESHOLD * 180 || this.totalPitchChange >= this.THRESHOLD * 90) {
          chat.debugMessage(
            `&c[RotationFailsafe] Large rotation change detected (Yaw: ${this.totalYawChange.toFixed(2)}, Pitch: ${this.totalPitchChange.toFixed(2)}). Threshold (Yaw: ${(this.THRESHOLD * 180).toFixed(2)}, Pitch: ${(this.THRESHOLD * 90).toFixed(2)}). Triggering failsafe.`,
          )
          global.export.FailsafeManager.trigger("Rotation")
          this.reset()
        } else if (dYaw >= 8 || dPitch >= 5) {
          // Small Rotation Check
          chat.debugMessage(`&c[RotationFailsafe] Small Rotation Detected! &7(dYaw: ${dYaw.toFixed(2)}, dPitch: ${dPitch.toFixed(2)}). Incrementing flags.`)
          this.flagTimer.reset()
          this.flags++

          if (this.flags >= this.FLAG_THRESHOLD) {
            chat.debugMessage(`&c[RotationFailsafe] Small rotation flags threshold exceeded (${this.flags} >= ${this.FLAG_THRESHOLD}). Scheduling failsafe.`)
            this.triggered = true
            this.responseTimer.reset()
            this.waitTime = Utils.getRandomInRange(250, 550)
          }
        }
      }).setFilteredClass(net.minecraft.network.play.server.S08PacketPlayerPosLook),

      // Response
      register("tick", () => {
        if (!this.toggle || this.isChangingWorld) return

        // Clear flags after no more rotations
        if (this.flagTimer.hasReached(2500)) {
          this.flags = 0
          this.flagTimer.reset()
        }

        // Trigger failsafe
        if (this.triggered && this.responseTimer.hasReached(this.waitTime)) {
          chat.debugMessage("&c[RotationFailsafe] Scheduled failsafe triggered.")
          if (this.toggle) global.export.FailsafeManager.trigger("Rotation")
          this.reset()
        }
      }),
    ]
  }

  reset() {
    this.triggered = false
    this.flags = 0
    this.flagTimer.reset()
    this.responseTimer.reset()
    // this.totalYawChange = 0
    // this.totalPitchChange = 0
  }
}

global.export.RotationFailsafe = new RotationFailsafe()
