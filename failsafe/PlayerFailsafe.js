let { Failsafe, TeleportFailsafe, Rotations, Vector, RaytraceUtils, Utils, MiningBot, PowderRotations, chat, TimeHelper, MovementHelper } = global.export
let { ModuleManager } = global.settingSelection
import Skyblock from "BloomCore/Skyblock"

class PlayerFailsafe extends Failsafe {
  constructor() {
    super()

    this.DYNAMIC_SCALING = 0.15
    this.FLAG_THRESHOLD = 15
    this.BLOCK_FLAG_THRESHOLD = 15
    this.DISTANCE_THRESHOLD = 60
    this.lookingTriggersFailsafe = false

    this.warpTimer = new TimeHelper()

    register("step", () => {
      this.lookingTriggersFailsafe = ModuleManager.getSetting("Other", "Players can trigger failsafe")

      switch (ModuleManager.getSetting("Failsafes", "Player Failsafe Sensitivity")) {
        case "Relaxed":
          this.DYNAMIC_SCALING = 0.25
          this.FLAG_THRESHOLD = 80
          this.BLOCK_FLAG_THRESHOLD = 20
          this.DISTANCE_THRESHOLD = 8
          break
        case "Normal":
          this.DYNAMIC_SCALING = 0.19
          this.FLAG_THRESHOLD = 60
          this.BLOCK_FLAG_THRESHOLD = 14
          this.DISTANCE_THRESHOLD = 10
          break
        case "High":
          this.DYNAMIC_SCALING = 0.13
          this.FLAG_THRESHOLD = 40
          this.BLOCK_FLAG_THRESHOLD = 10
          this.DISTANCE_THRESHOLD = 13
          break
        case "Strict":
          this.DYNAMIC_SCALING = 0.09
          this.FLAG_THRESHOLD = 20
          this.BLOCK_FLAG_THRESHOLD = 7
          this.DISTANCE_THRESHOLD = 20
          break
        case "Crazy":
          this.DYNAMIC_SCALING = 0.09
          this.FLAG_THRESHOLD = 12
          this.BLOCK_FLAG_THRESHOLD = 5
          this.DISTANCE_THRESHOLD = 25
          break
        case "Extreme":
          this.DYNAMIC_SCALING = 0.08
          this.FLAG_THRESHOLD = 7
          this.BLOCK_FLAG_THRESHOLD = 4
          this.DISTANCE_THRESHOLD = 30
          break
        case "Insane":
          this.DYNAMIC_SCALING = 0.07
          this.FLAG_THRESHOLD = 3
          this.BLOCK_FLAG_THRESHOLD = 3
          this.DISTANCE_THRESHOLD = 35
          break
        case "shnisveryparanoid":
          this.DYNAMIC_SCALING = 0.07
          this.FLAG_THRESHOLD = 1
          this.BLOCK_FLAG_THRESHOLD = 1
          this.DISTANCE_THRESHOLD = 40
          break
        default:
          this.DYNAMIC_SCALING = 0.07
          this.FLAG_THRESHOLD = 1
          this.BLOCK_FLAG_THRESHOLD = 2
          break
      }
    }).setDelay(1)

    this.playerFlags = new Map()
    this.blockedFlags = 0

    this.NPC_REGEX = /^[0-9A-F]{8}-[0-9A-F]{4}-2[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i

    this.triggers = [
      register("worldLoad", this.reset),
      register("worldUnload", this.reset),

      // TODO improve
      register("chat", (lvl, user, msg) => {
        if (!this.toggle || user.includes(Player.getName())) return // Self
        if (msg.toLowerCase().includes(Player.getName().toLowerCase())) {
          chat.debugMessage(`&c[PlayerFailsafe] Mention in chat detected from ${user}.`)
          Utils.warnPlayer("You were mentioned in chat!")
        }
      }).setCriteria("[${lvl}] ${user}: ${msg}"),

      register("attackEntity", p => {
        if (this.blockedFlags > 0) this.blockedFlags -= 2
      }),

      register("step", () => {
        if (!this.toggle /* || TeleportFailsafe.isTeleporting() */) return
        if (!global.export.CommissionMacro?.travelTimer.hasReached(10000)) return
        if (!this.warpTimer.hasReached(10000)) return

        // Blocked cursor failsafe
        if (Player.lookingAt()?.getClassName() === "EntityOtherPlayerMP" && Player.lookingAt()?.getUUID().version() !== 2 && !(Client.isInGui() && !Client.isInChat())) {
          this.blockedFlags++
          chat.debugMessage(`&c[PlayerFailsafe] Blocked by entity. Flags: ${this.blockedFlags}`)
        } else if (this.blockedFlags > 0) {
          this.blockedFlags--
        }

        if (this.blockedFlags >= this.BLOCK_FLAG_THRESHOLD) {
          chat.debugMessage(`&c[PlayerFailsafe] Blocked flags threshold exceeded (${this.blockedFlags} >= ${this.BLOCK_FLAG_THRESHOLD}).`)
          if (this.lookingTriggersFailsafe) {
            if (Skyblock.area !== "Crystal Hollows") {
              this.handlePlayerDetection()
            } else {
              chat.debugMessage("&c[PlayerFailsafe] In Crystal Hollows. Warning user instead of triggering failsafe.")
              Utils.warnPlayer("You are currently blocked!")
            }
          } else {
            chat.debugMessage("&c[PlayerFailsafe] 'Players can trigger failsafe' is disabled. Warning user.")
            Utils.warnPlayer("You are currently blocked!")
          }
          this.blockedFlags = 0
          return
        }

        World.getAllPlayers()
          .filter(p => p.getName() !== Player.getName() && !p.isInvisible() && p.getUUID().version() !== 2)
          .forEach(p => {
            const isLooking = this.isLookingAtPlayer(p)

            // Handle flag management
            if (!isLooking && this.playerFlags.has(p.getName())) {
              // Decrement flags if not looking
              this.playerFlags.set(p.getName(), Math.max(0, this.playerFlags.get(p.getName()) - 1))
              return // Skip the rest for this player
            } else if (!isLooking) {
              return // Skip the rest for this player
            }

            // Player is looking at you - increment flags
            const flags = this.playerFlags.get(p.getName()) ?? 0
            const newFlags = flags + 1
            this.playerFlags.set(p.getName(), newFlags)
            chat.debugMessage(`&c[PlayerFailsafe] ${p.getName()} is looking at you! Flags: ${newFlags}`)

            if (newFlags >= this.FLAG_THRESHOLD) {
              chat.debugMessage(`&c[PlayerFailsafe] Player flags threshold exceeded for ${p.getName()} (${newFlags} >= ${this.FLAG_THRESHOLD}).`)
              this.playerFlags.set(p.getName(), 0)
              if (this.lookingTriggersFailsafe) {
                if (Skyblock.area !== "Crystal Hollows") {
                  this.handlePlayerDetection(p.getName())
                } else {
                  chat.debugMessage("&c[PlayerFailsafe] In Crystal Hollows. Warning user instead of triggering failsafe.")
                  Utils.warnPlayer(`${p.getName()} is ${flags > this.FLAG_THRESHOLD ? "still " : ""}looking at you!`)
                }
              } else {
                chat.debugMessage("&c[PlayerFailsafe] 'Players can trigger failsafe' is disabled. Warning user.")
                Utils.warnPlayer(`${p.getName()} is ${flags > this.FLAG_THRESHOLD ? "still " : ""}looking at you!`)
              }
            }
          })
      }).setFps(20),
    ]
  }

  handlePlayerDetection(playerName = "") {
    Utils.warnPlayer(`${playerName ? playerName : "A player"} caused a failsafe! Warping to hub...`)

    this.warpTimer.reset()
    MovementHelper?.stopMovement()
    Rotations?.stopRotate()
    MiningBot?.stopBot()
    Client.scheduleTask(40, () => {
      ChatLib.command("hub")
    })

    global.export.WebhookManager?.sendMessageWithPingEmbed(
      "Player Failsafe Triggered!",
      `${playerName ? playerName : "A player"} was detected looking at you!\nLocation: ${Player.getX().toFixed(1)}, ${Player.getY().toFixed(1)}, ${Player.getZ().toFixed(1)}`,
      "red",
    )

    // NEEDS TO DISABLE CURRENT MACRO, IDK HOW AND IM AWAY TO SLEEP
    if (ModuleManager.getSetting("Other", "Auto Restart with Etherwarper")) {
      // better delay
      Client.scheduleTask(120, () => {
        // 4 seconds after /hub
        global.export.Etherwarper?.toggle()
      })
    } else {
      Utils.warnPlayer("Player", `${playerName ? playerName + " was" : "Someone is"} looking at you! Warped out!`)
    }
  }

  isLookingAtPlayer(p) {
    const playerPos = Player.asPlayerMP()
    if (p.distanceTo(playerPos) > this.DISTANCE_THRESHOLD) return false
    if (!playerPos.canSeeEntity(p)) return false

    // Calculate dynamic angle based on distance
    const distance = p.distanceTo(playerPos)
    let dynamicAngle = 0
    if (distance < 4) {
      dynamicAngle = 360
    } else {
      dynamicAngle = 180 * Math.exp(-this.DYNAMIC_SCALING * distance) + 4
    }

    // Get angles from the other player's eye position to your position
    const angles = Rotations.getAnglesFromVec(p.getEyePosition(1), new Vector(playerPos))
    if (!angles) return false

    // Check both yaw and pitch differences
    const yawDiff = Math.abs(net.minecraft.util.MathHelper.func_76142_g(p.getYaw() - angles.yaw))
    const pitchDiff = Math.abs(net.minecraft.util.MathHelper.func_76142_g(p.getPitch() - angles.pitch))

    // Return true if both angles are within the dynamic threshold
    return yawDiff <= dynamicAngle && pitchDiff <= dynamicAngle
  }

  reset() {
    if (!this.playerFlags) this.playerFlags = new Map()
    this.playerFlags.clear()
    this.blockedFlags = 0
  }
}

global.export.PlayerFailsafe = new PlayerFailsafe()
