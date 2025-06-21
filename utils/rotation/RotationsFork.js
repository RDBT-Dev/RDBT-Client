let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection
let { Vector, MathUtils, TimeHelper,  chat, MathHelper, Utils } = global.export

global.modules.push(
  new ConfigModuleClass(
    "Failsafes",
    "Misc",
    [

      new SettingToggle("Failsafes Enabled", true),
      new SettingToggle("Responses Enabled", true),
      new SettingSlider("Response Delay", 2000, 500, 5000),

      new SettingSelector("Failsafe Sensitivity", 2, ["Relaxed", "Normal", "High", "Strict"]),
      new SettingSelector("Player Failsafe Sensitivity", 2, ["Relaxed", "Normal", "High", "Strict", "Crazy", "Extreme", "Insane", "Instant"]),
      new SettingToggle("Desktop Notifications", true),
      new SettingToggle("Audio Notifications", true),
      new SettingSelector("Failsafe Audio", 0, ["Tave", "Alarm", "AI", "Alternate", "CripRat"]),
    ],
    ["Global settings related to failsafes"],
  ),
)


global.modules.push(
  new ConfigModuleClass(
    "Other", 
    "Misc", 
    [
      new SettingToggle("Players can trigger failsafe", false),
      new SettingToggle("Auto Restart with Etherwarper", false),
      new SettingToggle("Disable failsafes during Etherwarper", false),
      new SettingToggle("Debug Messages", true),
      //new SettingSlider("Screenshot Interval", 300, 30, 900),
    ],
    ["Global settings related to scripts"],
  ),
)

global.modules.push(
  new ConfigModuleClass(
    "Rotations",
    "Misc",
    [
      new SettingSlider("Rotation Speed", 40, 20, 60),
      new SettingSlider("Tremor Frequency", 40, 0, 80),
      new SettingSlider("Randomness", 10, 5, 15),
      new SettingSlider("Fader Exponent", 20, 1, 50),
    ],
    ["Base settings: 40, 40, 10, 20"],
  ),
)

class RotationsFork {
  constructor() {
    this.Vec3 = Java.type("net.minecraft.util.Vec3")
    this.MathHelper = Java.type("net.minecraft.util.MathHelper")
    this.Minecraft = Java.type("net.minecraft.client.Minecraft")

    this.SPEED = 40
    this.RANDOMNESS = 10
    this.TREMOR_FREQUENCY = 40
    this.FADER_EXPONENT = 0.02

    this.update = true
    register("step", () => {
      if (this.update) {
        this.SPEED = ModuleManager.getSetting("Rotations", "Rotation Speed")
        this.RANDOMNESS = ModuleManager.getSetting("Rotations", "Randomness")
        this.TREMOR_FREQUENCY = ModuleManager.getSetting("Rotations", "Tremor Frequency")
        this.FADER_EXPONENT = ModuleManager.getSetting("Rotations", "Fader Exponent") / 1000
      }
    }).setFps(1)

    // register("worldUnload", () => this.stopRotate())

    this.rotate = false
    this.yawOnly = false
    this.reachedEnd = false
    this.pitch = 0.0
    this.target = null
    this.startYaw = 0
    this.startPitch = 0
    this.currentYaw = 0
    this.currentPitch = 0
    this.actions = []

    this.rotateCircle = false
    this.circles = []
    this.circleYaw = 0
    this.circlePitch = 0
    this.constant = 1.0
    register("packetSent", () => {
      if (this.rotate) {
        const target = this.getAngles(this.target)
        const interpolated = this.interpolate(target)

        if (Math.abs(this.get180Yaw(Math.abs(target.yaw - Player.getYaw()))) <= this.precision && Math.abs(target.pitch - Player.getPitch()) <= this.precision) return this.triggerEndRotation()
        //chat.debugMessage("Yaw Target: " + target.yaw.toFixed(4) + " | Pitch Target: " + target.pitch.toFixed(4))
        //chat.debugMessage("Yaw: " + Player.getYaw().toFixed(4) + " | Pitch: " + Player.getPitch().toFixed(4))

        Player.getPlayer().field_70177_z = interpolated.yaw
        if (this.yawOnly) this.setPitch(this.pitch)
        else Player.getPlayer().field_70125_A = interpolated.pitch

        this.currentYaw = Player.getPlayer().field_70177_z
        this.currentPitch = Player.getPlayer().field_70125_A
      }
    }).setFilteredClass(net.minecraft.network.play.client.C03PacketPlayer.class)
  }

  /**
   * 
   * @param {*} vector 
   * @param {*} precision 
   * @param {*} yawOnly 
   * @param {*} pitch 
   * @returns 
   */
  rotateTo(vector, precision = 1.0, yawOnly = false, pitch = 0.0) {
    this.rotate = true
    let vec = Utils.convertToVector(vector)
    if (!this.reachedEnd && this.target && this.rotate && vec.x === this.target.field_72450_a && vec.y === this.target.field_72448_b && vec.z === this.target.field_72449_c) return
    this.target = Utils.convertToVector(vector).toMC()
    this.yawOnly = yawOnly
    this.pitch = pitch
    this.startYaw = Player.getRawYaw()
    this.startPitch = Player.getPitch()
    this.precision = precision
    this.reachedEnd = false
  }

  updateTargetTo(vector, precision = undefined, yawOnly = false, pitch = 0.0) {
    if (precision != undefined) {
      this.precision = precision
    }
    this.yawOnly = yawOnly
    this.pitch = pitch
    let target = null
    if (vector instanceof Vector || vector instanceof BlockPos) {
      target = new this.Vec3(vector.x, vector.y, vector.z)
    }
    if (vector instanceof Array) {
      target = new this.Vec3(vector[0], vector[1], vector[2])
    }
    if (vector instanceof this.Vec3) {
      target = vector
    }
    if (!this.target || !target) return
    let vec = Utils.convertToVector(vector)
    if (this.target && this.rotate && vec.x === this.target.field_72450_a && vec.y === this.target.field_72448_b && vec.z === this.target.field_72449_c) return
    this.startYaw = Player.getRawYaw()
    this.startPitch = Player.getPitch()
    this.target = target
  }

  rotateToAngles(yaw, pitch, precision = 1.0, yawOnly = false) {
    this.target = new NewRotation(yaw, pitch)

    this.startYaw = Player.getRawYaw()
    this.startPitch = Player.getPitch()
    this.precision = precision
    this.yawOnly = yawOnly

    this.rotate = true
  }

  roundToAngles(yaw, precision = 1.0) {
    let changeYaw = this.getRoundedYaw() - yaw
    while (changeYaw > 180) changeYaw -= 360
    while (changeYaw < -180) changeYaw += 360
    this.rotateToAngles(Player.getPlayer().field_70177_z + changeYaw, 0.0, precision)
  }

  get180Yaw(yaw) {
    while (yaw > 180) yaw -= 360
    while (yaw < -180) yaw += 360
    return yaw
  }

  getRoundedYaw() {
    let playerYaw = Player.getYaw()
    if (playerYaw >= -45 && playerYaw <= 45) return 0
    else if (playerYaw <= -45 && playerYaw >= -135) return -90
    else if (playerYaw >= 45 && playerYaw <= 135) return 90
    else return 180
  }

  stopRotate() {
    this.rotate = false
    this.target = null
    this.yawOnly = false
  }

  onEndRotation(callBack) {
    this.actions.push(callBack)
  }

  triggerEndRotation() {
    this.rotate = false

    const finalRot = this.getAngles(this.target)
    const sensFix = this.applySensitivity(new NewRotation(Player.getPlayer().field_70177_z + net.minecraft.util.MathHelper.func_76142_g(finalRot.yaw - Player.getYaw()), finalRot.pitch))

    Player.getPlayer().field_70177_z = sensFix.yaw
    Player.getPlayer().field_70125_A = sensFix.pitch

    this.actions.forEach(action => {
      action()
    })
    this.actions = []
    this.yawOnly = false
    this.reachedEnd = true
  }

  getAngles(vec) {
    if (vec instanceof NewRotation) return vec

    return this.getAnglesFromVec(Player.getPlayer().func_174824_e(1), vec)
  }

  getAnglesFromVec(from, to) {
    if (from instanceof Vector) from = from.toMC()
    if (to instanceof Vector) to = to.toMC()

    const deltaX = to.field_72450_a - from.field_72450_a
    const deltaY = to.field_72448_b - from.field_72448_b
    const deltaZ = to.field_72449_c - from.field_72449_c

    const yaw = Math.atan2(deltaZ, deltaX) * (180 / Math.PI) - 90
    const pitch = -(Math.atan2(deltaY, Math.sqrt(deltaX * deltaX + deltaZ * deltaZ)) * (180 / Math.PI))
    return new NewRotation(yaw, pitch)
  }

  interpolate(targetRotation, speed = this.SPEED) {
    const lastRotation = new NewRotation(Player.getRawYaw(), Player.getPitch())

    // Get diffs and distance to vec
    const deltaYaw = this.MathHelper.func_76142_g(targetRotation.yaw - lastRotation.yaw)
    const deltaPitch = targetRotation.pitch - lastRotation.pitch
    const distance = Math.sqrt(deltaYaw * deltaYaw + deltaPitch * deltaPitch)

    // Apply rotation speed and distance modifiers
    const diffYaw = Math.abs(this.MathHelper.func_76142_g(this.startYaw - targetRotation.yaw))
    const diffPitch = Math.abs(this.MathHelper.func_76142_g(this.startPitch - targetRotation.pitch))

    const maxYaw = (speed / 2) * Math.abs(deltaYaw / distance) * this.fader(diffYaw)
    const maxPitch = (speed / 2) * Math.abs(deltaPitch / distance) * this.fader(diffPitch)

    // Clamp yaw change based on distance to vec
    // Randomize movement speed (variance decreasing exponentially as target approaches)
    const moveYaw = this.MathHelper.func_76131_a(deltaYaw, -maxYaw, maxYaw) + this.randomness() * this.fader(deltaYaw)
    const movePitch = this.MathHelper.func_76131_a(deltaPitch, -maxPitch, maxPitch) + this.randomness() * this.fader(deltaPitch)

    let newYaw = lastRotation.yaw + moveYaw
    let newPitch = lastRotation.pitch + movePitch
    const sensitivity = this.getSensitivity()

    // Add tremors based on sensitivity
    const tremorStrength = Math.abs(sensitivity) * 0.2
    newYaw += tremorStrength * Math.sin(this.TREMOR_FREQUENCY * Date.now())
    newPitch += tremorStrength * Math.cos(this.TREMOR_FREQUENCY * Date.now())

    // Apply sensitivity
    for (let i = 1; i <= this.Minecraft.func_175610_ah() / 20 + Math.random() * 10; i++) {
      const adjustedRotations = this.applySensitivity(new NewRotation(newYaw, newPitch))

      newYaw = adjustedRotations.yaw
      newPitch = this.MathHelper.func_76131_a(adjustedRotations.pitch, -90, 90)
    }

    return new NewRotation(newYaw, newPitch)
  }

  applySensitivity(rotation) {
    const currentRotation = new NewRotation(Player.getRawYaw(), Player.getPitch())

    const multiplier = Math.pow(this.getSensitivity(), 3) * 8 * 0.15
    const yaw = currentRotation.yaw + Math.round((rotation.yaw - currentRotation.yaw) / multiplier) * multiplier
    const pitch = currentRotation.pitch + Math.round((rotation.pitch - currentRotation.pitch) / multiplier) * multiplier

    return new NewRotation(yaw, this.MathHelper.func_76131_a(pitch, -90, 90))
  }

  randomness = () => (Math.random() - 0.5) * this.RANDOMNESS

  fader = diff => 1 - Math.exp(-Math.abs(diff) * this.FADER_EXPONENT)
  getSensitivity = () => Client.getMinecraft().field_71474_y.field_74341_c * (1 + Math.random() / 10000000) * 0.6 + 0.2

  setYaw(yaw) {
    const random = Math.random() * 0.08

    let endRot = Player.getPlayer().field_70177_z + (yaw - Player.getYaw())
    if (endRot > 0) endRot += random
    else endRot -= random

    Player.getPlayer().field_70177_z = this.applySensitivity(new NewRotation(endRot, 0.0)).yaw
  }

  setPitch(pitch) {
    Player.getPlayer().field_70125_A = this.applySensitivity(new NewRotation(0.0, pitch + Math.random() * 0.08)).pitch
  }
}

global.export.Rotations = new RotationsFork()

class NewRotation {
  constructor(yaw, pitch) {
    this.yaw = yaw
    this.pitch = pitch
  }
}
