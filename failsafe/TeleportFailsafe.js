let { Failsafe, TimeHelper, Vector, registerEventSB, chat } = global.export
let { ModuleManager } = global.settingSelection

// TODO check for tp back and cancel failsafe

class TeleportFailsafe extends Failsafe {
  constructor() {
    super()

    this.itemTeleport = 0
    this.positions = []

    this.teleportTimer = new TimeHelper()
    this.lagBackTimer = new TimeHelper()
    this.warpTimer = new TimeHelper()

    this.NULL_VEC = new Vector(0, 0, 0)
    this.COMMANDS = ["/skyblock", "/is", "/l", "/lobby", "/hub"]

    // Death detection
    registerEventSB("death", () => {
      chat.debugMessage("&b[TeleportFailsafe] Death detected. Resetting failsafe.")
      this.reset()
    })

    registerEventSB("serverchange", () => {
      chat.debugMessage("&b[TeleportFailsafe] Server change detected. Resetting failsafe.")
      this.reset()
    })

    this.triggers = [
      register("worldLoad", () => this.reset()).setPriority(Priority.HIGHEST),
      register("worldUnload", () => this.reset()).setPriority(Priority.HIGHEST),

      register("tick", () => {
        // TODO check for lag instead of timer
        if (this.teleportTimer.hasReached(3000) && this.itemTeleport > 0) this.itemTeleport = 0
      }),

      register("packetSent", (packet, event) => {
        if (packet.func_149574_g()) {
          if (ChatLib.removeFormatting(packet.func_149574_g()?.func_82833_r()).includes("Aspect of the")) {
            this.itemTeleport++
            this.teleportTimer.reset()
          }
        }
      })
        .setFilteredClass(net.minecraft.network.play.client.C08PacketPlayerBlockPlacement)
        .setPriority(Priority.HIGHEST),

      register("tick", () => {
        if (this.itemTeleport > 0) this.positions = []

        this.positions.push(new Vector(Player.getX(), Player.getY(), Player.getZ()))
        if (this.positions.length > 60) this.positions.shift()
      }),

      register("packetSent", packet => {
        const cmd = packet.func_149439_c()
        if (cmd.startsWith("/warp") || this.COMMANDS.includes(cmd)) {
          chat.debugMessage(`&b[TeleportFailsafe] Warp command sent: "${cmd}". Resetting warp timer.`)
          this.warpTimer.reset()
        }
      }).setFilteredClass(net.minecraft.network.play.client.C01PacketChatMessage),

      register("packetReceived", packet => {
        if (!this.toggle || this.triggered || this.isChangingWorld /*  || this.isTeleporting() || this.isInLagback()*/ || !this.warpTimer.hasReached(1500)) return

        if (this.itemTeleport > 0) {
          Client.scheduleTask(1, () => {
            // TODO adjust with lag? idrk
            if (this.itemTeleport > 0) this.itemTeleport--
          })
          return
        }

        // Check for other failsafes

        const packetPos = new Vector(packet.func_148932_c(), packet.func_148928_d(), packet.func_148933_e())
        const playerPos = new Vector(Player.getX(), Player.getY(), Player.getZ())

        chat.debugMessage(`&b[TeleportFailsafe] Packet Received (PacketPos: ${packetPos.toString()}, PlayerPos: ${playerPos.toString()}).`)
        if (packetPos.equals(playerPos) || packetPos.equals(this.NULL_VEC)) return

        // Lagback check
        if (this.positions.some(pos => pos.getDistance(packetPos) <= 0.2) && playerPos.getDistance(packetPos) >= 0.5) {
          chat.debugMessage("&c[TeleportFailsafe] Lagback detected! Resetting lagBackTimer.")
          this.lagBackTimer.reset()
          return
        }

        // TODO bedrock box check integration
        chat.message("AutoVegetable " + "&cTeleport detected!")
        chat.debugMessage("&c[TeleportFailsafe] Teleport detected. Triggering failsafe.")
        global.export.FailsafeManager.trigger("Teleport")
        this.reset()
      })
        .setFilteredClass(net.minecraft.network.play.server.S08PacketPlayerPosLook)
        .setPriority(Priority.HIGH),
    ]
  }

  isTeleporting() {
    return this.itemTeleport > 0 || !this.warpTimer.hasReached(1000)
  }

  isInLagback() {
    return !this.lagBackTimer.hasReached(300)
  }

  reset() {
    this.itemTeleport = 0
    this.positions = []
    this.warpTimer.reset()
  }
}

global.export.TeleportFailsafe = new TeleportFailsafe()
