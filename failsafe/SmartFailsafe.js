let { TeleportFailsafe, MiningBot, PowderRotations, Failsafe, TimeHelper, chat } = global.export
let { ModuleManager } = global.settingSelection

// 🐎
class SmartFailsafe extends Failsafe {
  constructor() {
    super()

    this.THRESHOLD = 0.1
    register("step", () => {
      switch (ModuleManager.getSetting("Failsafes", "Failsafe Sensitivity")) {
        case "Relaxed":
          this.THRESHOLD = 0.06
          break
        case "Normal":
          this.THRESHOLD = 0.08
          break
        case "High":
          this.THRESHOLD = 0.1
          break
        case "Strict":
          this.THRESHOLD = 0.12
          break
        default:
          this.THRESHOLD = 0.1
          break
      }
    }).setDelay(1)

    this.blocksBroken = 0
    this.averageBps = 0
    this.bpsArray = []

    this.recentlyBroken = []

    this.breakTimer = new TimeHelper()
    this.shortPauseTimer = new TimeHelper()
    this.debugTimer = new TimeHelper()

    this.triggers = [
      register("step", () => {
        if (!this.toggle || Client.isInChat()) return
        if (!this.shortPauseTimer.hasReached(7500)) return
        this.bpsArray.push(this.blocksBroken)
        this.blocksBroken = 0

        if (this.bpsArray.length > 300) this.bpsArray.shift()
        this.averageBps = Math.min((5 * this.bpsArray.reduce((a, b) => a + b, 0)) / this.bpsArray.length, 3) // Cap at 3 bps

        if (this.debugTimer.hasReached(10000)) {
          chat.debugMessage(`&b[SmartFailsafe] Average BPS: ${this.averageBps.toFixed(2)} | Threshold Delay: ${this.averageBps ? (1000 / (this.averageBps * this.THRESHOLD)).toFixed(2) : "N/A"}ms.`)
          this.debugTimer.reset()
        }

        if (this.averageBps && this.breakTimer.hasReached(1000 / (this.averageBps * this.THRESHOLD))) {
          chat.debugMessage("&c[SmartFailsafe] Break timer exceeded threshold delay. Setting triggered to true.")
          this.triggered = true
        } else {
          this.triggered = false
        }
      }).setFps(5),

      register("packetReceived", packet => {
        if (packet.func_148846_g() < 9) return // Not fully broken
        if (this.recentlyBroken.includes(packet.func_179821_b().toString())) return // Already broken

        this.recentlyBroken.push(packet.func_179821_b().toString())
        if (this.recentlyBroken.length > 10) this.recentlyBroken.shift()

        this.blocksBroken++
        this.breakTimer.reset()
      }).setFilteredClass(net.minecraft.network.play.server.S25PacketBlockBreakAnim.class), // Reset BPS on block break animation

      register("tick", () => {
        if (!this.toggle) return
        if (Client.isInChat() || Client.isInGui()) this.reset()
        if (!TeleportFailsafe.warpTimer.hasReached(1500)) this.reset()

        if (this.triggered) {
          chat.debugMessage("&c[SmartFailsafe] Scheduled failsafe triggered.")
          global.export.FailsafeManager.trigger("Smart")
          this.reset()
        }
      }),
    ]
  }

  reset() {
    this.triggered = false

    this.breakTimer.reset()
    this.blocksBroken = 0
    this.averageBps = 0
    this.bpsArray = []
  }
}

global.export.SmartFailsafe = new SmartFailsafe()
