let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection

let {  chat, Vector, MovementHelper } = global.export

global.modules.push(new ConfigModuleClass("Freecam", "Render", [new SettingSlider("Speed", 1, 0, 8), new SettingToggle("No Clip", true), new SettingToggle("Fly Mode", true)], ["Detach camera from player"]))

class freecam {
  constructor() {
    this.ModuleName = "Freecam"
    this.enabled = false
    this.lastState = {
      pos: null,
      motion: null,
      rotation: null,
      sprint: false,
    }

    // Settings
    this.updateSettings()
    register("step", () => this.updateSettings()).setFps(5)

    // Keybind
    getKeyBind(this.ModuleName, "Rdbt Client v4 - Render").registerKeyPress(() => {
      this.toggle()
    })

    // Movement handler
    register("tick", () => {
      if (!this.enabled) return
      this.handleMovement()
    })

    // Disable on world change
    register("worldUnload", () => {
      if (this.enabled) this.toggle()
    })

    // Block packets when enabled
    register("packetSent", (packet, event) => {
      if (this.enabled) cancel(event)
    }).setFilteredClasses([
      net.minecraft.network.play.client.C03PacketPlayer.class,
      net.minecraft.network.play.client.C0APacketAnimation.class,
      net.minecraft.network.play.client.C02PacketUseEntity.class,
      net.minecraft.network.play.client.C0BPacketEntityAction.class,
      net.minecraft.network.play.client.C08PacketPlayerBlockPlacement.class,
    ])
  }

  updateSettings() {
    this.speed = ModuleManager.getSetting(this.ModuleName, "Speed")
    this.noClip = ModuleManager.getSetting(this.ModuleName, "No Clip")
    this.flyMode = ModuleManager.getSetting(this.ModuleName, "Fly Mode")
  }

  toggle() {
    this.enabled = !this.enabled

    if (this.enabled) {
      this.enableFreecam()
    } else {
      this.disableFreecam()
    }
  }

  enableFreecam() {
    this.sendMacroMessage(`§9Enabled`)

    // Save current state
    this.lastState = {
      pos: new Vector(Player.getX(), Player.getY(), Player.getZ()),
      motion: new Vector(Player.getMotionX(), Player.getMotionY(), Player.getMotionZ()),
      rotation: { yaw: Player.getRawYaw(), pitch: Player.getPitch() },
      sprint: Player.isSprinting(),
    }

    // Enable no clip if setting is on
    if (this.noClip) {
      Player.getPlayer().field_70145_X = true
    }
  }

  disableFreecam() {
    this.sendMacroMessage("§cDisabled")

    // Restore position
    Player.getPlayer().func_70107_b(this.lastState.pos.x, this.lastState.pos.y, this.lastState.pos.z)

    // Restore motion
    Player.getPlayer().field_70159_w = this.lastState.motion.x
    Player.getPlayer().field_70181_x = this.lastState.motion.y
    Player.getPlayer().field_70179_y = this.lastState.motion.z

    // Restore rotation
    Player.getPlayer().field_70177_z = this.lastState.rotation.yaw
    Player.getPlayer().field_70125_A = this.lastState.rotation.pitch

    // Restore sprint
    MovementHelper.setKey("sprint", this.lastState.sprint)

    // Disable no clip
    Player.getPlayer().field_70145_X = false
  }

  handleMovement() {
    const player = Player.getPlayer()
    const controls = player.field_71158_b

    // Calculate speed multiplier based on diagonal movement
    const isMovingHorizontally = controls.field_78900_b !== 0 || controls.field_78902_a !== 0
    const mult = isMovingHorizontally ? this.speed * 0.98 : this.speed

    // Apply horizontal speed
    player.field_70159_w *= mult
    player.field_70179_y *= mult

    // Handle vertical movement in fly mode
    if (this.flyMode) {
      // Reset gravity
      player.field_70181_x = 0

      // Jump key for up, sneak key for down
      if (MovementHelper.isKeyDown("jump")) {
        player.field_70181_x = this.speed * 0.8
      } else if (MovementHelper.isKeyDown("sneak")) {
        player.field_70181_x = -this.speed * 0.8
      }
    }
  }

  sendMacroMessage(msg) {
    chat.message(this.ModuleName + ": " + msg)
  }
}

new freecam()
